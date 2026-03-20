"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import Header from "@/components/Header";
import TimerDisplay from "./TimerDisplay";
import Controls from "./Controls";
import MetadataUpdater from "./MetadataUpdater";
import RefreshSuggestion from "./RefreshSuggestion";
import AllTimeRankingCard from "@/components/RankingCard";

import { playNotificationSound } from "@/utils/sound";
import { generateRefreshSuggestion } from "@/utils/gemini";
import { savePomodoroSession } from "@/utils/pomodoro";

import { useAudio } from "@/hooks/useAudio";
import { authClient } from "@/lib/auth-client";

type Mode = "work" | "break";

type TodayPomodoro = {
  date: string;
  minutes: number;
};

const TODAY_POMODORO_KEY = "pomodoro_today";

function getTodayKey(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function loadTodayPomodoro(): TodayPomodoro {
  const today = getTodayKey();
  const raw = localStorage.getItem(TODAY_POMODORO_KEY);

  if (!raw) return { date: today, minutes: 0 };

  const parsed = JSON.parse(raw);
  if (parsed.date !== today) return { date: today, minutes: 0 };

  return { date: today, minutes: parsed.minutes ?? 0 };
}

function saveTodayPomodoro(data: TodayPomodoro) {
  localStorage.setItem(TODAY_POMODORO_KEY, JSON.stringify(data));
}

function formatMinutesText(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return (
      <span>
        <span className="text-2xl">{minutes}</span>
        <span className="ml-0.5 text-xs text-white/65">分</span>
      </span>
    );
  }

  if (minutes === 0) {
    return (
      <span>
        <span className="text-2xl">{hours}</span>
        <span className="ml-0.5 text-xs text-white/65">時間</span>
      </span>
    );
  }

  return (
    <span>
      <span className="text-2xl">{hours}</span>
      <span className="ml-0.5 text-xs text-white/65">時間</span>
      <span className="ml-1 text-2xl">{minutes}</span>
      <span className="ml-0.5 text-xs text-white/65">分</span>
    </span>
  );
}

export default function TimerApp() {
  // =========================
  // 外部フック・セッション
  // =========================
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const { play, stop } = useAudio("/rain_sound.mp3", 0.2);

  // =========================
  // タイマー状態
  // =========================
  const [isRunning, setIsRunning] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState({ minutes: 25, seconds: 0 });
  const [mode, setMode] = useState<Mode>("work");
  const [autoStart, setAutoStart] = useState(false);

  // =========================
  // UI表示用の状態
  // =========================
  const [refreshSuggestion, setRefreshSuggestion] = useState<string | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [rankingRefreshKey, setRankingRefreshKey] = useState(0);

  // =========================
  // ref（再レンダリング不要な内部状態）
  // =========================
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const didFinishRef = useRef(false);
  const workStartedAtRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  // =========================
  // 補助関数
  // =========================
  const addTodayMinutes = useCallback((minutesToAdd: number) => {
    const data = loadTodayPomodoro();
    const next = {
      date: data.date,
      minutes: data.minutes + minutesToAdd,
    };

    saveTodayPomodoro(next);
    setTodayMinutes(next.minutes);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode: Mode = mode === "work" ? "break" : "work";

    setMode(newMode);
    setTimeLeft({
      minutes: newMode === "work" ? workDuration : breakDuration,
      seconds: 0,
    });

    if (newMode === "break") {
      generateRefreshSuggestion()
        .then((suggestion) => setRefreshSuggestion(suggestion))
        .catch(console.error);
    }

    setIsRunning(autoStart);
  }, [autoStart, breakDuration, mode, workDuration]);

  // =========================
  // UIイベント
  // =========================
  const handleStart = () => {
    didFinishRef.current = false;

    setIsRunning((prev) => {
      const next = !prev;

      if (next && mode === "work" && workStartedAtRef.current === null) {
        workStartedAtRef.current = Date.now();
      }

      return next;
    });
  };

  const handleReset = () => {
    didFinishRef.current = false;
    setIsRunning(false);
    stop();

    if (mode === "work") {
      workStartedAtRef.current = null;
    }

    setTimeLeft({
      minutes: mode === "work" ? workDuration : breakDuration,
      seconds: 0,
    });
  };

  // =========================
  // ポモドーロ完了時のセッション保存
  // =========================
  const saveCompletedWorkSession = useCallback(async () => {
    if (!userId) return;

    // 二重保存防止
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      const endedAtMs = Date.now();
      const startedAtMs = workStartedAtRef.current ?? endedAtMs - workDuration * 60 * 1000;
      const idempotencyKey = `${userId}:${startedAtMs}:${workDuration}`;

      await savePomodoroSession({
        idempotencyKey,
        startedAt: new Date(startedAtMs).toISOString(),
        endedAt: new Date(endedAtMs).toISOString(),
        durationMin: workDuration,
      });
    } catch (error) {
      console.error("Error while saving pomodoro session:", error);
    } finally {
      isSavingRef.current = false;
      workStartedAtRef.current = null;
    }
  }, [userId, workDuration]);

  // =========================
  // effect: 初期化
  // =========================
  useEffect(() => {
    const data = loadTodayPomodoro();
    setTodayMinutes(data.minutes);
  }, []);

  // =========================
  // effect: 雨音と動画の再生制御
  // =========================
  useEffect(() => {
    const videoElement = videoRef.current;

    if (isRunning && mode === "work") {
      void play();

      if (videoElement) {
        void videoElement.play();
      }
    } else {
      stop();

      if (videoElement) {
        videoElement.pause();
      }
    }
  }, [isRunning, mode, play, stop]);

  // =========================
  // effect: タイマーのカウントダウン
  // =========================
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          const isFinished = prev.minutes === 0 && prev.seconds === 0;

          if (isFinished) {
            if (didFinishRef.current) return prev;

            didFinishRef.current = true;
            setIsRunning(false);
            stop();

            if (mode === "work") {
              addTodayMinutes(workDuration);

              void saveCompletedWorkSession().finally(() => {
                setRankingRefreshKey((prevKey) => prevKey + 1);
              });
            }

            void playNotificationSound();

            setTimeout(() => {
              toggleMode();
            }, 100);

            return prev;
          }

          if (prev.seconds === 0) {
            return { minutes: prev.minutes - 1, seconds: 59 };
          }

          return {
            ...prev,
            seconds: prev.seconds - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, stop, mode, workDuration, addTodayMinutes, saveCompletedWorkSession, toggleMode]);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[rgb(4,6,18)] text-white">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-10">
        <div className="-mx-4 sm:-mx-6 lg:-mx-10">
          <Header />
        </div>

        <div className="mt-6 flex flex-col gap-6 rounded-xl lg:flex-row lg:gap-10">
          {/* 左：動画エリア */}
          <div className="relative w-full rounded-xl border border-white/10 bg-white/5 lg:w-3/5 lg:self-start">
            <div className="relative w-full overflow-hidden rounded-xl sm:h-[360px] lg:h-[520px]">
              <video
                ref={videoRef}
                src="/top_movie02.mp4"
                className="h-full w-full object-cover"
                playsInline
                muted
                loop
                preload="auto"
              />
            </div>
          </div>

          {/* 右：タイマー + ランキング */}
          <div className="w-full lg:w-2/5">
            <Card className="relative mb-6 flex flex-col overflow-hidden border-0 bg-gray-700/30 text-white">
              <CardHeader className="relative z-10 text-center">
                <h3 className="text-sm font-semibold tracking-wide text-white">
                  本日のポモドーロ時間
                </h3>
                <p className="font-semibold leading-none">{formatMinutesText(todayMinutes)}</p>
              </CardHeader>
            </Card>

            <Card className="relative mb-6 flex flex-col overflow-hidden border-0 bg-gray-700/30 text-white">
              <CardHeader className="relative z-10 text-center">
                <CardTitle className="text-xl font-semibold tracking-wide text-white">
                  {mode === "work" ? "作業時間" : "休憩時間"}
                </CardTitle>
              </CardHeader>

              <CardContent className="relative z-10 -mt-2 flex flex-col items-center gap-6">
                <TimerDisplay
                  minutes={timeLeft.minutes}
                  seconds={timeLeft.seconds}
                  mode={mode}
                  isRunning={isRunning}
                />

                <Controls
                  onStart={handleStart}
                  onReset={handleReset}
                  onModeToggle={toggleMode}
                  isRunning={isRunning}
                />
              </CardContent>

              <CardFooter className="relative z-10 mx-auto flex w-full max-w-[260px] flex-col gap-3 text-white">
                {/* 作業時間の設定 */}
                <div className="flex items-center justify-between gap-3">
                  <label className="min-w-[4.5rem] text-sm font-medium text-white/90">
                    作業時間
                  </label>
                  <div className="relative flex h-9 w-full min-w-[140px] items-center">
                    <select
                      value={workDuration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value, 10);
                        setWorkDuration(newDuration);

                        if (mode === "work" && !isRunning) {
                          setTimeLeft({ minutes: newDuration, seconds: 0 });
                        }
                      }}
                      className="h-9 w-full appearance-none rounded-lg border border-white/20 bg-white/10 px-2.5 pr-8 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                    >
                      {[5, 10, 15, 25, 30, 45, 60].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes}分
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                      aria-hidden
                    />
                  </div>
                </div>

                {/* 休憩時間の設定 */}
                <div className="flex items-center justify-between gap-3">
                  <label className="min-w-[4.5rem] text-sm font-medium text-white/90">
                    休憩時間
                  </label>
                  <div className="relative flex h-9 w-full min-w-[140px] items-center">
                    <select
                      value={breakDuration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value, 10);
                        setBreakDuration(newDuration);

                        if (mode === "break" && !isRunning) {
                          setTimeLeft({ minutes: newDuration, seconds: 0 });
                        }
                      }}
                      className="h-9 w-full appearance-none rounded-lg border border-white/20 bg-white/10 px-2.5 pr-8 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                    >
                      {[5, 10, 15].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes}分
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                      aria-hidden
                    />
                  </div>
                </div>

                {/* 自動開始の設定 */}
                <div className="flex items-center justify-between gap-3">
                  <label className="min-w-[4.5rem] text-sm font-medium text-white/90">
                    自動開始
                  </label>
                  <div className="flex h-9 w-full min-w-[140px] items-center justify-center">
                    <Switch checked={autoStart} onCheckedChange={() => setAutoStart(!autoStart)} />
                  </div>
                </div>
              </CardFooter>

              <MetadataUpdater minutes={timeLeft.minutes} seconds={timeLeft.seconds} mode={mode} />
            </Card>

            <AllTimeRankingCard refreshKey={rankingRefreshKey} />
          </div>
        </div>
      </div>

      <RefreshSuggestion
        suggestion={refreshSuggestion}
        onClose={() => setRefreshSuggestion(null)}
      />
    </div>
  );
}
