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
import { authClient } from "@/lib/auth-client";
import { ErrorCodes } from "@/types";

export default function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // React Hook Form のセットアップ
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: AuthFormValues) => {
    startTransition(async () => {
      const { name, email, password } = values;

      const result = await signUp({ name, email, password });

      if (!result.isSuccess) {
        toast.error(getErrorMessage(result.errorCode));
        return;
      }

      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(getErrorMessage(ErrorCodes.SERVER_ERROR));
        return;
      }

      toast.success("アカウントを作成しました");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white/80">ユーザー名</FormLabel>
              <FormControl>
                <Input
                  placeholder="ユーザー名"
                  className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white/80">メールアドレス</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white/80">パスワード</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="8文字以上のパスワード"
                  className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white/80">パスワード（確認用）</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="8文字以上のパスワード"
                  className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-800 text-white hover:bg-blue-800"
        >
          {isPending ? "登録中…" : "新規登録"}
        </Button>
      </form>
    </Form>
  );
}
