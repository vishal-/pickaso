import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, email, name, emailVerified } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing required fields: uid and email" }, { status: 400 });
    }

    // Sync/upsert the tenant using firebaseUid
    const tenant = await prisma.tenant.upsert({
      where: { firebaseUid: uid },
      update: {
        email,
        emailVerified: !!emailVerified,
        name: name || null,
      },
      create: {
        firebaseUid: uid,
        email,
        emailVerified: !!emailVerified,
        name: name || null,
      },
    });

    // Set the session cookie with the database tenant.id
    await setSession(tenant.id);

    return NextResponse.json({ success: true, tenantId: tenant.id }, { status: 200 });
  } catch (error) {
    console.error("Failed to sync user session:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
