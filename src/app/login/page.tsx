"use client";

import LoginForm from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-4 text-2xl font-bold">ログイン</h1>
      <LoginForm />
    </div>
  );
}
