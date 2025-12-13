"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import TimerDisplay from "./TimerDisplay";
import { Switch } from "@/components/ui/switch";
import Controls from "./Controls";
import MetadataUpdater from "./MetadataUpdater";
import RefreshSuggestion from "./RefreshSuggestion";
import Header from "@/components/Header";
import { useState, useEffect, useRef, useCallback } from "react";
import { playNotificationSound } from "@/utils/sound";
import { generateRefreshSuggestion } from "@/utils/gemini";
import { useAudio } from "@/hooks/useAudio";

// タイマーのモードを表す型
type Mode = "work" | "break";

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

  // モードを切り替える関数
  const toggleMode = useCallback(() => {
    const nextMode: Mode = mode === "work" ? "break" : "work";
    setMode(nextMode);

    setTimeLeft({
      minutes: nextMode === "work" ? workDuration : breakDuration,
      seconds: 0,
    });

    if (nextMode === "break") {
      generateRefreshSuggestion()
        .then((suggestion) => setRefreshSuggestion(suggestion))
        .catch(console.error);
    }

    setIsRunning(autoStart);
  }, [autoStart, breakDuration, mode, workDuration]);

  //開始/停止ボタンのハンドラ
  const handleStart = () => {
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
    setIsRunning(false);
    stop();
    setTimeLeft({ minutes: mode === "work" ? workDuration : breakDuration, seconds: 0 });
  };

  // タイマーのカウントダウン処理
  useEffect(() => {
    //setIntervalの戻り値(タイマーID)を保持する変数
    let intervalId: NodeJS.Timeout;

    // タイマーが実行中の場合のみ処理を行う
    if (isRunning) {
      // 1秒ごとに実行される処理を設定しつつ、
      // 戻り値（タイマーID）を intervalId 変数に再セット
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          //秒数が0の場合
          if (prev.seconds === 0) {
            //分数が0の場合（タイマー終了）
            if (prev.minutes === 0) {
              setIsRunning(false); // タイマーを停止
              stop(); // 雨音を停止
              void playNotificationSound(); // タイマー終了後に音声を再生
              setTimeout(() => {
                toggleMode(); // モードを自動切り替え
              }, 100);
              return prev; //現在の状態(0分0秒)を返す
            }
            // 分数がまだ残っている場合は、分を1減らして秒を59にセット
            return { minutes: prev.minutes - 1, seconds: 59 };
          }

          //秒数が1以上の場合は、秒を1減らす
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    // クリーンアップ関数（コンポーネントのアンマウント時やisRunningが変わる前に実行される）
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, stop, toggleMode]); // isRunningが変わったときだけこのエフェクトを再実行

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[rgb(4,6,18)] text-white">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-10">
        <div className="-mx-4 sm:-mx-6 lg:-mx-10">
          <Header />
        </div>
        <span
          id="confettiReward"
          className="pointer-events-none absolute right-8 top-12 lg:right-14 lg:top-14"
        />

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-10">
          {/* 左：動画エリア */}
          <div className="relative w-full rounded-[36px] border border-white/10 bg-white/5 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl lg:w-3/5 lg:self-start">
            <div className="relative h-[260px] w-full overflow-hidden rounded-[36px] sm:h-[360px] lg:h-[520px]">
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
            <Card className="relative flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/70 text-white shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
              <CardHeader className="relative z-10 text-center">
                <CardTitle className="text-2xl font-semibold tracking-wide text-white">
                  {mode === "work" ? "作業時間" : "休憩時間"}
                </CardTitle>
                <p className="text-sm text-white/70">
                  {mode === "work"
                    ? "集中モードでタスクに没頭しましょう。"
                    : "短い休憩で次のフォーカスに備えましょう。"}
                </p>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-col items-center gap-6">
                <TimerDisplay minutes={timeLeft.minutes} seconds={timeLeft.seconds} mode={mode} />
                <Controls
                  onStart={handleStart}
                  onReset={handleReset}
                  onModeToggle={toggleMode}
                  isRunning={isRunning}
                />
              </CardContent>
              <CardFooter className="relative z-10 mx-auto flex w-full max-w-[260px] flex-col gap-4 text-white">
                {/* 作業時間の設定 */}
                <div className="flex items-center gap-3">
                  <label className="min-w-[4.5rem] text-sm font-medium text-white/90">
                    作業時間
                  </label>
                  <select
                    value={workDuration}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value);
                      setWorkDuration(newDuration);
                      if (mode === "work" && !isRunning) {
                        setTimeLeft({ minutes: newDuration, seconds: 0 });
                      }
                    }}
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    {[5, 10, 15, 25, 30, 45, 60].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes}分
                      </option>
                    ))}
                  </select>
                </div>

                {/* 休憩時間の設定 */}
                <div className="flex items-center gap-3">
                  <label className="min-w-[4.5rem] text-sm font-medium text-white/90">
                    休憩時間
                  </label>
                  <select
                    value={breakDuration}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value);
                      setBreakDuration(newDuration);
                      if (mode === "break" && !isRunning) {
                        setTimeLeft({ minutes: newDuration, seconds: 0 });
                      }
                    }}
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    {[5, 10, 15].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes}分
                      </option>
                    ))}
                  </select>
                </div>

                {/* 自動開始の設定 */}
                <div className="flex w-full items-center justify-between gap-2">
                  <label className="text-sm font-medium text-white/90">自動開始</label>
                  <Switch checked={autoStart} onCheckedChange={() => setAutoStart(!autoStart)} />
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
