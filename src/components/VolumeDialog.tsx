"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
};

export default function VolumeDialog({ open, onOpenChange, volume, onVolumeChange }: Props) {
  const handleVolumeChange = ([value]: number[]) => {
    const nextVolume = Math.max(0, Math.min(1, value / 100));
    onVolumeChange(nextVolume);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#040612]/50 border-white/10 backdrop-blur [&_[data-slot=dialog-close]]:text-white/80 [&_[data-slot=dialog-close]]:hover:text-white py-10">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-accent-blue">雨音の音量</DialogTitle>
        </DialogHeader>
        <div>
          <Slider
            value={[Math.round(volume * 100)]}
            min={0}
            max={100}
            step={5}
            onValueChange={handleVolumeChange}
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
