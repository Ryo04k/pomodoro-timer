"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { signInSchema, SignInFormValues } from "@/schemas/sign-in";
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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { ErrorCodes } from "@/types";
import Link from "next/link";

const mapBetterAuthErrorToAppCode = (code?: string) => {
  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "INVALID_EMAIL") {
    return ErrorCodes.INVALID_CREDENTIALS;
  }
  return ErrorCodes.SERVER_ERROR;
};

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: SignInFormValues) => {
    startTransition(async () => {
      try {
        const { error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });

        if (error) {
          toast.error(getErrorMessage(mapBetterAuthErrorToAppCode(error.code)));
          return;
        }

        toast.success("ログインしました");
        router.push("/");
        router.refresh();
      } catch (err) {
        console.error("Sign in error:", err);
        toast.error(getErrorMessage(ErrorCodes.SERVER_ERROR));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "ログイン中…" : "ログイン"}
        </Button>

        <p className="text-sm text-muted-foreground">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-primary underline underline-offset-4">
            新規登録
          </Link>
          へ
        </p>
      </form>
    </Form>
  );
}
