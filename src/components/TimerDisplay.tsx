interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  mode: "work" | "break";
  isRunning: boolean;
}

export default function TimerDisplay({ minutes, seconds, mode, isRunning }: TimerDisplayProps) {
  return (
    <div
      className={`text-6xl font-bold transition-transform duration-700 ${
        mode === "work" ? "text-accent-blue" : "text-gray-500"
      } ${isRunning ? "scale-115" : "scale-100"}`}
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
