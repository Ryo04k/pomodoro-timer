export type ActionResult = { isSuccess: false; errorCode: ErrorCode } | { isSuccess: true };

export const ErrorCodes = {
  USER_EXISTS: "USER_EXISTS",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SERVER_ERROR: "SERVER_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
