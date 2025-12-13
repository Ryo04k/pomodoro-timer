import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, { message: "ユーザー名を入力してください" }),
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .email({ message: "有効なメールアドレスを入力してください" }),
    password: z.string().min(8, { message: "パスワードは8文字以上で入力してください" }),
    confirmPassword: z.string().min(1, { message: "確認用パスワードを入力してください" }),
  })

  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type AuthFormValues = z.infer<typeof signUpSchema>;
