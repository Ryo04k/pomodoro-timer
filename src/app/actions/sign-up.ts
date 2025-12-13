"use server";

import { signUpSchema } from "@/schemas/sign-up";
import { ActionResult, ErrorCodes } from "@/types";
import { auth } from "@/lib/auth";

type SignUpValues = {
  name: string;
  email: string;
  password: string;
};

type AuthError = {
  code?: string;
};

export async function signUp(values: SignUpValues): Promise<ActionResult> {
  const parsed = signUpSchema.omit({ confirmPassword: true }).safeParse(values);

  if (!parsed.success) {
    return { isSuccess: false, errorCode: ErrorCodes.INVALID_INPUT };
  }

  try {
    const { name, email, password } = parsed.data;

    await auth.api.signUpEmail({
      body: { name, email, password },
    });

    return { isSuccess: true };
  } catch (err) {
    console.error("SignUp error:", err);

    const code = (err as AuthError).code;

    if (code === "EMAIL_ALREADY_IN_USE") {
      return { isSuccess: false, errorCode: ErrorCodes.USER_EXISTS };
    }

    return { isSuccess: false, errorCode: ErrorCodes.SERVER_ERROR };
  }
}
