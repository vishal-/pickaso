import { NextResponse } from "next/server";
import { createApp } from "@/lib/apps";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name : "";
    const app = createApp(name);

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create app.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
