import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionTenantId } from "@/lib/session";
import logger from "@/lib/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  logger.info(
    { route: "/api/apps/[id]/keys/[keyId]", method: "DELETE" },
    "Incoming API key revoke request"
  );

  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) {
      logger.warn(
        { route: "/api/apps/[id]/keys/[keyId]", method: "DELETE" },
        "Unauthorized API key revoke request"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appId, keyId } = await params;

    const result = await prisma.apiKey.deleteMany({
      where: {
        id: keyId,
        appId,
        app: {
          tenantId,
        },
      },
    });

    if (result.count === 0) {
      logger.warn(
        {
          route: "/api/apps/[id]/keys/[keyId]",
          method: "DELETE",
          tenantId,
          appId,
          keyId,
        },
        "API key not found or access denied for revoke"
      );
      return NextResponse.json({ error: "API key not found or access denied" }, { status: 404 });
    }

    logger.info(
      {
        route: "/api/apps/[id]/keys/[keyId]",
        method: "DELETE",
        tenantId,
        appId,
        keyId,
      },
      "API key revoked"
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error(
      { route: "/api/apps/[id]/keys/[keyId]", method: "DELETE", error },
      "Failed to revoke API key"
    );
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}