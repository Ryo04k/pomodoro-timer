// src/app/signup/_components/sign-up-form.tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signUpSchema, AuthFormValues } from "@/schemas/sign-up";
import { signUp } from "@/app/actions/sign-up";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  // ボタン連打防止 & ローディング状態管理用
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // React Hook Form のセットアップ
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(signUpSchema), // ← Zod と連携
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // フォーム送信時の処理
  const onSubmit = (values: AuthFormValues) => {
    // startTransition 内で async を使うと「処理中」状態を持てる
    startTransition(async () => {
      const { name, email, password } = values;

      const result = await signUp({ name, email, password });

      if (!result.isSuccess) {
        // エラーコードから日本語メッセージへ変換
        toast.error(getErrorMessage(result.errorCode));
        return;
      }

      toast.success("アカウントを作成しました");

      // Better Auth の仕様に合わせて：
      // - ここでログイン画面へ飛ばす
      // - もしくはトップページへ
      router.push("/login");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ニックネーム */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ユーザー名</FormLabel>
              <FormControl>
                <Input placeholder="たろう" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* メールアドレス */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* パスワード */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input type="password" placeholder="8文字以上のパスワード" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* パスワード（確認用） */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード（確認用）</FormLabel>
              <FormControl>
                <Input type="password" placeholder="8文字以上のパスワード" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 送信ボタン */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "登録中…" : "新規登録"}
        </Button>
      </form>
    </Form>
  );
}
