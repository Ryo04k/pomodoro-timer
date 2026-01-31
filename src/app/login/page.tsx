"use client";

import LoginForm from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[rgb(4,6,18)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur sm:p-8">
          <h1 className="mt-3 text-2xl font-semibold">ログイン</h1>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
