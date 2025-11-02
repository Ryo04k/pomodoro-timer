"use client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import TimerDisplay from "./TimerDisplay";
import { Switch } from "@/components/ui/switch";
import Controls from "./Controls";
import MetadataUpdater from "./MetadataUpdater";
import RefreshSuggestion from "./RefreshSuggestion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useReward } from "react-rewards";
import { playNotificationSound } from "@/utils/sound";
import { generateRefreshSuggestion } from "@/utils/gemini";

// タイマーのモードを表す型
type Mode = "work" | "break";

export default function TimerApp() {
  const { reward: confetti } = useReward("confettiReward", "confetti", {
    elementCount: 100,
    spread: 70,
    decay: 0.93,
    lifetime: 150,
  });

  // タイマーの実行状態を管理するstate
  const [isRunning, setIsRunning] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadedOnceRef = useRef(false);

  //雨音をセットアップする関数
  const ensureLoaded = useCallback(async () => {
    if (loadedOnceRef.current) return; // 既に読み込まれていれば何もしない
    const Ctor: typeof AudioContext =
      window.AudioContext || (window as unknown as typeof AudioContext); //ブラウザによる互換対応
    const ctx = new Ctor();
    audioCtxRef.current = ctx;

    const response = await fetch("/rain_sound.mp3");
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer); //音声データに変換
    bufferRef.current = audioBuffer;

    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    loadedOnceRef.current = true; // 一度読み込んだことを記録
  }, []);

  // 雨音を再生する関数
  const startRainSound = useCallback(async () => {
    await ensureLoaded();
    const ctx = audioCtxRef.current;
    const buf = bufferRef.current;
    const gain = gainRef.current;

    if (!ctx || !buf || !gain) return;

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(gain);

    // オーディオが停止状態の場合は再開する
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    src.start();
    sourceRef.current = src;
  }, [ensureLoaded]);

  // 雨音を停止する関数
  const stopRainSound = useCallback(() => {
    const src = sourceRef.current;
    if (!src) return;
    try {
      src.stop();
    } catch {}
    src.disconnect();
    sourceRef.current = null;
  }, []);

  // 作業時間・休憩時間を管理する状態変数
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  // タイマーの残り時間を保持する状態変数
  const [timeLeft, setTimeLeft] = useState({ minutes: workDuration, seconds: 0 });

  // モードの状態を管理する変数
  const [mode, setMode] = useState<Mode>("work");

  //自動開始の設定
  const [autoStart, setAutoStart] = useState(false);

  //リフレッシュ提案
  const [refreshSuggestion, setRefreshSuggestion] = useState<string | null>(null);

  // モードを切り替える関数
  const toggleMode = () => {
    // 現在のモードを反対のモードに切り替える
    const newMode = mode === "work" ? "break" : "work";
    setMode(newMode);

    // モードに応じてタイマーの時間をリセット
    // 作業モードなら25分、休憩モードなら5分
    setTimeLeft({
      minutes: newMode === "work" ? workDuration : breakDuration,
      seconds: 0,
    });

    // 休憩モードの場合は、Gemini APIを呼び出してリフレッシュ提案を取得
    if (newMode === "break") {
      generateRefreshSuggestion()
        .then((suggestion) => setRefreshSuggestion(suggestion))
        .catch(console.error);
    }

    // 自動開始がONの場合は次のセッションを自動的に開始
    setIsRunning(autoStart);
  };

  //開始/停止ボタンのハンドラ
  const handleStart = () => {
    setIsRunning((prev) => {
      const next = !prev;
      if (next) {
        void startRainSound();
      } else {
        stopRainSound();
      }
      return next;
    });
  };

  // リセットボタンのハンドラ
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft({ minutes: mode === "work" ? workDuration : breakDuration, seconds: 0 });
  };

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
              if (mode === "work") {
                void confetti(); // 紙吹雪を表示
              }
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
      }, 1);
    }
    // クリーンアップ関数（コンポーネントのアンマウント時やisRunningが変わる前に実行される）
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]); // isRunningが変わったときだけこのエフェクトを再実行

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <span
        id="confettiReward"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold  text-center">
            {mode === "work" ? "作業時間" : "休憩時間"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <TimerDisplay minutes={timeLeft.minutes} seconds={timeLeft.seconds} mode={mode} />
          <Controls
            onStart={handleStart}
            onReset={handleReset}
            onModeToggle={toggleMode}
            isRunning={isRunning}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 w-full max-w-[200px] mx-auto">
          {/* 作業時間の設定 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium min-w-[4.5rem]">作業時間</label>
            <select
              value={workDuration}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value);
                setWorkDuration(newDuration);
                if (mode === "work" && !isRunning) {
                  setTimeLeft({ minutes: newDuration, seconds: 0 });
                }
              }}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 15, 25, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes}分
                </option>
              ))}
            </select>
          </div>

          {/* 休憩時間の設定 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium min-w-[4.5rem]">休憩時間</label>
            <select
              value={breakDuration}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value);
                setBreakDuration(newDuration);
                if (mode === "break" && !isRunning) {
                  setTimeLeft({ minutes: newDuration, seconds: 0 });
                }
              }}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 15].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes}分
                </option>
              ))}
            </select>
          </div>

          {/* 自動開始の設定 */}
          <div className="flex items-center gap-2 w-full justify-between">
            <label className="text-sm font-medium min-w-[4.5rem]">自動開始</label>
            <Switch checked={autoStart} onCheckedChange={() => setAutoStart(!autoStart)} />
          </div>
        </CardFooter>
        <MetadataUpdater minutes={timeLeft.minutes} seconds={timeLeft.seconds} mode={mode} />
      </Card>
      <RefreshSuggestion
        suggestion={refreshSuggestion}
        onClose={() => setRefreshSuggestion(null)}
      />
    </div>
  );
}
