"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type UseAudioReturn = {
  play: () => Promise<void>;
  stop: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  ctxState: AudioContextState | null;
};

export function useAudio(src: string, initialVolume = 0.2): UseAudioReturn {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const loadedOnceRef = useRef(false);

  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setMuted] = useState(false);
  const [ctxState, setCtxState] = useState<AudioContextState | null>(null);

  // 音声データをセットアップ
  const ensureLoaded = useCallback(async () => {
    if (loadedOnceRef.current && audioCtxRef.current && bufferRef.current && gainRef.current)
      return;
    const Ctor: typeof AudioContext =
      window.AudioContext || (window as unknown as typeof AudioContext); //ブラウザによる互換対応
    const ctx = new Ctor();
    audioCtxRef.current = ctx;
    setCtxState(ctx.state);

    const res = await fetch(src);
    const arrBuf = await res.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrBuf);
    bufferRef.current = decoded;

    const gain = ctx.createGain();
    gain.gain.value = isMuted ? 0 : volume;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    loadedOnceRef.current = true;
  }, [src]);

  const play = useCallback(async () => {
    await ensureLoaded();
    const ctx = audioCtxRef.current;
    const buf = bufferRef.current;
    const gain = gainRef.current;

    if (!ctx || !buf || !gain) return;

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        console.error("エラーが発生しました。", e);
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (ctx.state === "suspended") {
      await ctx.resume();
      setCtxState(ctx.state);
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
    const safeVolume = Math.max(0, Math.min(1, volume));
    gainRef.current.gain.value = isMuted ? 0 : safeVolume;
  }, [volume, isMuted]);

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
      setCtxState(null);
    };
  }, [src, stop]);

  return {
    play,
    stop,
    volume,
    setVolume: (v: number) => setVolumeState(Math.max(0, Math.min(1, v))),
    isMuted,
    toggleMute: () => setMuted((prev) => !prev),
    ctxState,
  };
}
