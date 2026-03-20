import { prisma } from "@/lib/prisma";
import { RankingPeriod } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

// 全ての期間の集計では開始期間が必要ないため固定のダミー値を使用
const ALL_TIME_START = new Date("1970-01-01T00:00:00.000Z");

// URLクエリパラメータのバリデーション定義
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export async function GET(req: Request) {
  try {
    // リクエストURLからクエリパラメータを取得する
    const { searchParams } = new URL(req.url);

    // URLから取得したlimitの値を検証
    // 未指定の場合 undefined を渡して defaultの値を使用
    const parsed = querySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { limit } = parsed.data;

    // DBから ALL_TIME のランキングを取得
    const rows = await prisma.userRankingAggregate.findMany({
      where: {
        period: RankingPeriod.ALL_TIME,
        periodStart: ALL_TIME_START,
      },
      orderBy: [
        { totalMin: "desc" },
        // totalMin が同じの場合は userId の昇順で並べる
        { userId: "asc" },
      ],
      take: limit,
      select: {
        userId: true,
        totalMin: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // フロントエンドで表示する形式に整形
    const ranking = rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.user.name,
      totalMin: row.totalMin,
    }));

    return NextResponse.json(
      {
        period: "ALL_TIME",
        generatedAt: new Date().toISOString(),
        count: ranking.length,
        ranking,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/rankings/all-time error:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
