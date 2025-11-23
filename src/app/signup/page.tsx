"use client";

import SignUpForm from "./_components/sign-up-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-4 text-2xl font-bold">新規登録</h1>
      <SignUpForm />
    </div>
  );
}
