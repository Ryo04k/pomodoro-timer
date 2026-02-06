"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import TimerDisplay from "./TimerDisplay";
import { Switch } from "@/components/ui/switch";
import Controls from "./Controls";
import MetadataUpdater from "./MetadataUpdater";
import RefreshSuggestion from "./RefreshSuggestion";
import Header from "@/components/Header";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { playNotificationSound } from "@/utils/sound";
import { generateRefreshSuggestion } from "@/utils/gemini";
import { useAudio } from "@/hooks/useAudio";

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

function saveTodayPomodoro(date: TodayPomodoro) {
  localStorage.setItem(TODAY_POMODORO_KEY, JSON.stringify(date));
}

function formatMinutesText(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}分`;
  if (minutes === 0) return `${hours}時間`;

  return `${hours}時間${minutes}分`;
}

export default function TimerApp() {
  // タイマーの実行状態を管理するstate
  const [isRunning, setIsRunning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 雨音の再生を管理するフック
  const { play, stop } = useAudio("/rain_sound.mp3", 0.2);

  // 作業時間・休憩時間を管理する状態変数
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  // タイマーの残り時間を保持する状態変数
  const [timeLeft, setTimeLeft] = useState({ minutes: workDuration, seconds: 0 });

  // モードの状態を管理する変数
  const [mode, setMode] = useState<Mode>("work");

  //自動開始の設定
  const [autoStart, setAutoStart] = useState(false);

  //休憩に入る時のリフレッシュ提案テキスト
  const [refreshSuggestion, setRefreshSuggestion] = useState<string | null>(null);

  // 本日のポモドーロ時間を管理する状態変数
  const [todayMinutes, setTodayMinutes] = useState(0);

  useEffect(() => {
    const data = loadTodayPomodoro();
    setTodayMinutes(data.minutes);
  }, []);

  const addTodayMinutes = useCallback((minutesToAdd: number) => {
    const data = loadTodayPomodoro();
    const next = { date: data.date, minutes: data.minutes + minutesToAdd };

    saveTodayPomodoro(next);
    setTodayMinutes(next.minutes);
  }, []);

  // モードを切り替える関数
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

  const didFinishRef = useRef(false);

  //開始/停止ボタンのハンドラ
  const handleStart = () => {
    didFinishRef.current = false;
    setIsRunning((prev) => !prev);
  };

  // 雨音と動画の再生制御
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

  // リセットボタンのハンドラ
  const handleReset = () => {
    didFinishRef.current = false;
    setIsRunning(false);
    stop();
    setTimeLeft({ minutes: mode === "work" ? workDuration : breakDuration, seconds: 0 });
  };

  // タイマーのカウントダウン処理
  useEffect(() => {
    //タイマーIDを保持する変数
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          const isFinished = prev.minutes === 0 && prev.seconds === 0;

          if (isFinished) {
            if (didFinishRef.current) return prev;

            didFinishRef.current = true;
            setIsRunning(false);
            stop(); // 雨音を停止

            if (mode === "work") {
              addTodayMinutes(workDuration);
            }

            void playNotificationSound(); // タイマー終了後に通知音を再生

            setTimeout(() => {
              toggleMode();
            }, 100);
            return prev;
          }

          if (prev.seconds === 0) {
            return { minutes: prev.minutes - 1, seconds: 59 };
          }

          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, stop, toggleMode]);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[rgb(4,6,18)] text-white">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-10">
        <div className="-mx-4 sm:-mx-6 lg:-mx-10">
          <Header />
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-10 rounded-xl">
          {/* 左：動画エリア */}
          <div className="relative w-full border border-white/10 bg-white/5 lg:w-3/5 lg:self-start rounded-xl">
            <div className="relative  w-full overflow-hidden sm:h-[360px] lg:h-[520px] rounded-xl">
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

          {/* 右：タイマー */}
          <div className="w-full lg:w-2/5">
            <Card className="relative flex flex-col overflow-hidden border-0 bg-gray-700/30 text-white mb-6">
              <CardHeader className="relative z-10 text-center">
                <h3 className="text-sm tracking-wide text-white font-semibold">
                  本日のポモドーロ時間
                </h3>
                <p className="text-xl font-semibold"> {formatMinutesText(todayMinutes)}</p>
              </CardHeader>
            </Card>

            <Card className="relative flex flex-col overflow-hidden border-0 bg-gray-700/30 text-white">
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
                        const newDuration = parseInt(e.target.value);
                        setWorkDuration(newDuration);
                        if (mode === "work" && !isRunning) {
                          setTimeLeft({ minutes: newDuration, seconds: 0 });
                        }
                      }}
                      className="h-9 w-full appearance-none rounded-lg border border-white/20 bg-white/10 px-2.5 pr-8 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 font-bold"
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
                        const newDuration = parseInt(e.target.value);
                        setBreakDuration(newDuration);
                        if (mode === "break" && !isRunning) {
                          setTimeLeft({ minutes: newDuration, seconds: 0 });
                        }
                      }}
                      className="h-9 w-full appearance-none rounded-lg border border-white/20 bg-white/10 px-2.5 pr-8 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 font-bold"
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
