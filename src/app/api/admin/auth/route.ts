import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  isAdminRequestAuthorized,
  signAdminToken,
  verifyPinConstantTime,
} from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: isAdminRequestAuthorized(request),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const submittedPin = typeof body?.pin === "string" ? body.pin : "";

    if (!submittedPin || !verifyPinConstantTime(submittedPin)) {
      return NextResponse.json(
        { authenticated: false, error: "PIN incorreto." },
        { status: 401 }
      );
    }

    const expiresAtMs = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
    const token = signAdminToken(expiresAtMs);
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json(
      { authenticated: false, error: "Requisição inválida." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
