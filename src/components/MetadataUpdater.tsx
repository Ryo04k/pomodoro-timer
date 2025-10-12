import { useEffect } from "react";

interface MetadataUpdaterProps {
  minutes: number;
  seconds: number;
  mode: "work" | "break";
}

export default function MetadataUpdater({ minutes, seconds, mode }: MetadataUpdaterProps) {
  useEffect(() => {
    const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const modeString = mode === "work" ? "作業" : "休憩";
    // Titleを更新
    document.title = `${timeString} ${modeString} - Pomodoro Timer`;
  }, [minutes, seconds, mode]);

  return null;
}
