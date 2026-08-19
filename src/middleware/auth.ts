import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const jwtSecret = process.env.JWT_SECRET || "pos-super-secret-jwt-key-2026-production";

export const requireRole = (allowedRoles: string[]) => {
  return async ({ jwtAuth, headers, set }: any) => {
    const authHeader = headers["authorization"] || headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { success: false, error: "401 Unauthorized: Sesi login tidak ditemukan" };
    }

    const token = authHeader.split(" ")[1];
    if (!token || !jwtAuth) {
      set.status = 401;
      return { success: false, error: "401 Unauthorized: Token tidak valid" };
    }

    const payload = await jwtAuth.verify(token);

    if (!payload || typeof payload !== "object" || !payload.role) {
      set.status = 401;
      return { success: false, error: "401 Unauthorized: Token JWT tidak valid" };
    }

    if (payload.exp && typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      set.status = 401;
      return { success: false, error: "401 Unauthorized: Sesi login JWT telah kedaluwarsa (Expired 8 Jam)" };
    }

    const userRole = String(payload.role).toUpperCase();
    const formattedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!formattedAllowed.includes(userRole)) {
      set.status = 403;
      return {
        success: false,
        error: `403 Forbidden: Role ${userRole} tidak memiliki izin akses (Khusus ${formattedAllowed.join("/")})`,
      };
    }
  };
};

export const authMiddleware = new Elysia({ name: "authMiddleware" })
  .use(
    jwt({
      name: "jwtAuth",
      secret: jwtSecret,
    })
  )
  .macro({
    requireRole(allowedRoles: string[]) {
      return {
        beforeHandle: requireRole(allowedRoles),
      };
    },
  });
