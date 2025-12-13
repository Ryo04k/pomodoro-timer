import { ErrorCode } from "@/types";

export const getErrorMessage = (errorCode: ErrorCode | string): string => {
  const messages: Record<ErrorCode, string> = {
    INVALID_INPUT: "入力内容に誤りがあります",
    INVALID_CREDENTIALS: "メールアドレスまたはパスワードが正しくありません",
    SERVER_ERROR: "処理中にエラーが発生しました。",
    UNAUTHORIZED: "ログインが必要です",
    USER_EXISTS:
      process.env.NODE_ENV === "production"
        ? "登録できませんでした。入力内容をご確認ください"
        : "このメールアドレスは既に登録されています",
  };
  return messages[errorCode as ErrorCode] || "予期せぬエラーが発生しました";
};
