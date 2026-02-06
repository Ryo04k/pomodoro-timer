"use client";
import { LogIn, LogOut, Volume2 } from "lucide-react";
import VolumeDialog from "@/components/VolumeDialog";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [open, setOpen] = useState(false);

  //ログインしているユーザーの情報を取得
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name ?? "ユーザー";

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <header className="flex w-full items-center justify-between border-white/15  px-10 py-4 text-white">
      <div className="flex items-end gap-3">
        <h1 className="text-2xl font-bold leading-none tracking-wide text-accent-blue">
          RainTimer
        </h1>
        <p className="text-sm leading-none text-white/60">雨音・黒猫と過ごすポモドーロタイマー</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-2 text-white transition-colors duration-200 bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 hover:bg-white/20"
          aria-label="音量を調整"
        >
          <Volume2 className="h-5 w-5" />
        </button>

        {session?.user ? (
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/90 transition-colors hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center">
                    <Image
                      src="/user_icon.png"
                      alt="ユーザーアイコン"
                      width={25}
                      height={25}
                      className="block rounded-full"
                    />
                  </span>
                  <span className="text-sm font-bold leading-none text-white/90">{userName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-white/10 bg-[rgb(8,12,26)] text-white"
              >
                <DropdownMenuLabel className="text-xs text-white/60">ログイン中</DropdownMenuLabel>
                <DropdownMenuLabel className="text-sm font-medium text-white/90">
                  {userName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="cursor-pointer text-white/90 hover:bg-white/10 hover:text-white focus:bg-white/10"
                >
                  <LogOut className="size-4 text-white/70" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <LogIn className="size-4" />
              ログイン
            </Link>
          </div>
        )}

        <VolumeDialog open={open} onOpenChange={setOpen} />
      </div>
    </header>
  );
}
