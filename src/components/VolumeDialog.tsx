"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function VolumeDialog({ open, onOpenChange }: Props) {
  //雨音の音量を管理
  const [volume, setVolume] = useState<number>(() => {
    //windowエラーを避ける
    if (typeof window === "undefined") return 0.2;
    //ローカルストレージから値を取得
    const savedVolume = localStorage.getItem("timer-volume");
    return savedVolume ? parseFloat(savedVolume) : 0.2;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 現在のボリュームをローカルストレージに保存
    localStorage.setItem("timer-volume", String(volume));
    // ボリューム変更イベントを発火
    window.dispatchEvent(new CustomEvent("timer-volume-change", { detail: volume }));
  }, [volume]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>雨音の調整</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Slider
            value={[Math.round(volume * 100)]}
            min={0}
            max={100}
            step={5}
            onValueChange={([val]) => setVolume(val / 100)}
            aria-label="音量"
          />
          <div className="mt-2 text-sm text-muted-foreground text-right">
            {Math.round(volume * 100)}%
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
