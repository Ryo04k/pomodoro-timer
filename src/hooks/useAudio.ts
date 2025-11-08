"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type UseAudioReturn = {
  play: () => Promise<void>;
  stop: () => void;
  volume: number;
  setVolume: (v: number) => void;
};

export function useAudio(src: string, initialVolume = 0.2): UseAudioReturn {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const loadedOnceRef = useRef(false);

  const [volume, setVolumeState] = useState(initialVolume); // 音量状態

  //ダイアログから音量変更のイベントを受け取る
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVolumeChange: EventListener = (event) => {
      const { detail } = event as CustomEvent<number>;
      if (typeof detail !== "number") return;

      const clamped = Math.max(0, Math.min(1, detail));
      setVolumeState(clamped);
    };
    window.addEventListener("timer-volume-change", handleVolumeChange);

    // イベントリスナーを削除
    return () => {
      window.removeEventListener("timer-volume-change", handleVolumeChange);
    };
  }, []);

  // 音声データをセットアップ
  const ensureLoaded = useCallback(async () => {
    if (loadedOnceRef.current && audioCtxRef.current && bufferRef.current && gainRef.current)
      return;
    const Ctor: typeof AudioContext =
      window.AudioContext || (window as unknown as typeof AudioContext); //ブラウザによる互換対応
    const ctx = new Ctor();
    audioCtxRef.current = ctx;

    const res = await fetch(src);
    const arrBuf = await res.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrBuf);
    bufferRef.current = decoded;

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));
    gain.connect(ctx.destination);
    gainRef.current = gain;

    loadedOnceRef.current = true;
  }, [src, volume]);

  const play = useCallback(async () => {
    await ensureLoaded();
    const ctx = audioCtxRef.current;
    const buf = bufferRef.current;
    const gain = gainRef.current;

    if (!ctx || !buf || !gain) return;

    // 既に再生中なら何もしない（再生成を防ぐ）
    if (sourceRef.current) {
      return;
    }

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const srcNode = ctx.createBufferSource();
    srcNode.buffer = buf;
    srcNode.loop = true;
    srcNode.connect(gain);
    srcNode.start();
    sourceRef.current = srcNode;
  }, [ensureLoaded]);

  const stop = useCallback(() => {
    if (!sourceRef.current) return;
    try {
      sourceRef.current.stop();
    } catch (e) {
      console.error("エラーが発生しました。", e);
    }
    sourceRef.current.disconnect();
    sourceRef.current = null;
  }, []);

  // ボリュームを更新
  useEffect(() => {
    if (!gainRef.current) return;

    // volumeを0〜1の範囲に丸めて安全に代入
    const safeVolume = Math.max(0, Math.min(1, volume));

    // 音量を直接反映（スムーズ変化なし）
    gainRef.current.gain.value = safeVolume;
  }, [volume]);

  useEffect(() => {
    return () => {
      stop();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
      audioCtxRef.current = null;
      bufferRef.current = null;
      gainRef.current = null;
      loadedOnceRef.current = false;
    };
  }, [src, stop]);

  return {
    play,
    stop,
    volume,
    setVolume: (v: number) => setVolumeState(Math.max(0, Math.min(1, v))),
  };
}
