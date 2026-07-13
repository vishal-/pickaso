import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "tenant_id";

export async function getSessionTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function getSessionTenant() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return null;

  try {
    return await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  } catch (error) {
    console.error("Failed to fetch session tenant:", error);
    return null;
  }
}

export async function setSession(tenantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
