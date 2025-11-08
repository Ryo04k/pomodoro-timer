"use client";
import { Volume2 } from "lucide-react";
import VolumeDialog from "@/components/VolumeDialog";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 border-b">
      <h1 className="font-bold text-lg">Pomodoro Timer</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-full hover:bg-accent transition-all duration-200"
          aria-label="音量を調整"
        >
          <Volume2 className="h-5 w-5" />
        </button>

        <VolumeDialog open={open} onOpenChange={setOpen} />
      </div>
    </header>
  );
}
