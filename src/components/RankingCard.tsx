"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trophy } from "lucide-react";
import { fetchAllTimeRanking, type AllTimeRankingItem } from "@/utils/pomodoro";

type Props = {
  refreshKey?: number;
};

function formatMinutesText(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return (
      <span>
        <span className="text-base">{minutes}</span>
        <span className="ml-0.5 text-[11px] text-white/65">分</span>
      </span>
    );
  }

  if (minutes === 0) {
    return (
      <span>
        <span className="text-base">{hours}</span>
        <span className="ml-0.5 text-[11px] text-white/65">時間</span>
      </span>
    );
  }

  return (
    <span>
      <span className="text-base">{hours}</span>
      <span className="ml-0.5 text-[11px] text-white/65">時間</span>
      <span className="ml-1 text-base">{minutes}</span>
      <span className="ml-0.5 text-[11px] text-white/65">分</span>
    </span>
  );
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "border-amber-300/60 bg-amber-300/20 text-amber-200";
  if (rank === 2) return "border-slate-300/60 bg-slate-300/20 text-slate-200";
  if (rank === 3) return "border-orange-300/60 bg-orange-300/20 text-orange-200";
  return "border-white/20 bg-white/10 text-white/80";
}

export default function AllTimeRankingCard({ refreshKey = 0 }: Props) {
  const [items, setItems] = useState<AllTimeRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAllTimeRanking(5);
        if (!mounted) return;
        setItems(data.ranking);
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError("ランキングの取得に失敗しました");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  return (
    <Card className="relative py-3 px-4 mb-6 flex flex-col overflow-hidden border-0 bg-gray-700/30 text-white">
      <CardContent className="relative z-10 pt-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="all-time" className="border-b-0">
            <AccordionTrigger className="cursor-pointer px-1 py-3 text-sm font-semibold tracking-wide text-white hover:no-underline [&>svg]:size-5 [&>svg]:stroke-[2.75] [&>svg]:text-white/90 [&[data-state=open]>span]:mx-auto [&[data-state=closed]>span]:mx-auto">
              <span className="flex gap-2.5">
                <Trophy className="h-5 w-5 text-accent-blue" aria-hidden />
                <h2 className="text-lg font-semibold leading-none">ランキング</h2>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              {loading && <p className="text-sm text-white/70">読み込み中...</p>}
              {error && <p className="text-sm text-red-300">{error}</p>}
              {!loading && !error && items.length === 0 && (
                <p className="text-sm text-white/70">まだランキングデータがありません</p>
              )}

              {!loading && !error && items.length > 0 && (
                <ol className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.userId}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 px-3.5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border text-xs font-bold ${getRankBadgeClass(item.rank)}`}
                        >
                          {item.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-white/95">
                        {formatMinutesText(item.totalMin)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-right text-xs text-white/60">※累計のポモドーロ時間を集計</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
