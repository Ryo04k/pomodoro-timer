"use client";
import { Volume2 } from "lucide-react";
import VolumeDialog from "@/components/VolumeDialog";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function Header() {
  const [open, setOpen] = useState(false);

  //ログインしているユーザーの情報を取得
  const { data: session } = authClient.useSession();
  console.log(session);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <header className="flex w-full items-center justify-between border-white/15  px-10 py-4 text-white">
      <h1 className="text-lg font-semibold tracking-wide text-white/95">Pomodoro Timer</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-2 text-white transition-colors duration-200 bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 hover:bg-white/20"
          aria-label="音量を調整"
        >
          <Volume2 className="h-5 w-5" />
        </button>

        {session?.user ? (
          <div className="flex items-center gap-3">
            <p>{session.user.name}</p>
            <button onClick={handleLogout}>ログアウト</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">ログイン</Link>
          </div>
        )}

        <VolumeDialog open={open} onOpenChange={setOpen} />
      </div>
    </header>
  );
}
