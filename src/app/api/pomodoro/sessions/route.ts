import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, RankingPeriod } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  idempotencyKey: z.string().min(1),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  durationMin: z.number().int().positive().max(180),
});

// 全ての期間の集計では開始期間が必要ないため固定のダミー値を使用
const ALL_TIME_START = new Date("1970-01-01T00:00:00.000Z");

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => null);

    // Zodで入力チェック
    const parsed = bodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { idempotencyKey, startedAt, endedAt, durationMin } = parsed.data;

    const startedAtDate = new Date(startedAt);
    const endedAtDate = new Date(endedAt);

    // 終了時刻が開始時刻より前ならエラーを返す
    if (endedAtDate <= startedAtDate) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "endedAt must be after startedAt",
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      try {
        await tx.pomodoroSession.create({
          data: {
            userId,
            idempotencyKey,
            startedAt: startedAtDate,
            endedAt: endedAtDate,
            durationMin,
          },
        });
      } catch (error) {
        // 同じidempotencyKey がすでに保存済みなら、
        // 「再送された同じイベント」とみなして成功扱いにする
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          return { deduplicated: true };
        }
        throw error;
      }

      // ALL_TIMEランキング集計を加算
      await tx.userRankingAggregate.upsert({
        where: {
          userId_period_periodStart: {
            userId,
            period: RankingPeriod.ALL_TIME,
            periodStart: ALL_TIME_START,
          },
        },
        create: {
          userId,
          period: RankingPeriod.ALL_TIME,
          periodStart: ALL_TIME_START,
          totalMin: durationMin,
        },
        update: {
          totalMin: {
            increment: durationMin,
          },
        },
      });

      return { deduplicated: false };
    });

    // 新規作成なら201、保存済みの場合200を返す
    return NextResponse.json(
      {
        ok: true,
        deduplicated: result.deduplicated,
      },
      { status: result.deduplicated ? 200 : 201 },
    );
  } catch (error) {
    console.error("POST /api/pomodoro/sessions error:", error);

    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
