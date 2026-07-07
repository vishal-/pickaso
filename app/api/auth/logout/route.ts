import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to clear user session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
