import { NextResponse } from "next/server";

export function redirectWithMessage(
  requestUrl: string,
  pathname: string,
  type: "error" | "success",
  message: string
) {
  const url = new URL(pathname, requestUrl);
  url.searchParams.set(type, message);
  return NextResponse.redirect(url);
}
