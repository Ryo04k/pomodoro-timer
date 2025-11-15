"use client";
import { Volume2 } from "lucide-react";
import VolumeDialog from "@/components/VolumeDialog";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex w-full items-center justify-between border-white/15 bg-black/25 px-10 py-4 text-white shadow-lg backdrop-blur">
      <h1 className="text-lg font-semibold tracking-wide text-white/95">Pomodoro Timer</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-2 text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="音量を調整"
        >
          <Volume2 className="h-5 w-5" />
        </button>

        <VolumeDialog open={open} onOpenChange={setOpen} />
      </div>
    </header>
  );
}
