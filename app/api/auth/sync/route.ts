import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  logger.info({ route: "/api/auth/sync", method: "POST" }, "Incoming auth sync request");
  try {
    const body = await request.json();
    const { uid, email, name, emailVerified } = body;

    if (!uid || !email) {
      logger.warn(
        { route: "/api/auth/sync", method: "POST", hasUid: !!uid, hasEmail: !!email },
        "Invalid auth sync payload"
      );
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

    logger.info(
      { route: "/api/auth/sync", method: "POST", tenantId: tenant.id, firebaseUid: uid },
      "Auth sync completed"
    );

    return NextResponse.json({ success: true, tenantId: tenant.id }, { status: 200 });
  } catch (error) {
    logger.error(
      { route: "/api/auth/sync", method: "POST", error },
      "Failed to sync user session"
    );
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
