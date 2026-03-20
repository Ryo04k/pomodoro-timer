type SavePomodoroSessionPayload = {
  idempotencyKey: string; // 同一セッションの重複保存を防止するためのキー
  startedAt: string;
  endedAt: string;
  durationMin: number;
};

type SavePomodoroSessionResponse = {
  ok: boolean;
  deduplicated: boolean;
};

export type AllTimeRankingItem = {
  rank: number;
  userId: string;
  name: string;
  totalMin: number;
};

type FetchAllTimeRankingResponse = {
  period: "ALL_TIME";
  generatedAt: string;
  count: number;
  ranking: AllTimeRankingItem[];
};

// ポモドーロ完了データを保存
export async function savePomodoroSession(
  payload: SavePomodoroSessionPayload,
): Promise<SavePomodoroSessionResponse> {
  const response = await fetch("/api/pomodoro/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "FAILED_TO_SAVE_POMODORO_SESSION");
  }

  return data;
}

// ALL_TIME ランキングを取得
export async function fetchAllTimeRanking(limit: number): Promise<FetchAllTimeRankingResponse> {
  const response = await fetch(`/api/rankings/all-time?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "FAILED_TO_FETCH_ALL_TIME_RANKING");
  }

  return data;
}
