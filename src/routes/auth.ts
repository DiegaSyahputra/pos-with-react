import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { POSStore } from "../services/store";

const jwtSecret = process.env.JWT_SECRET || "pos-super-secret-jwt-key-2026-production";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(
    jwt({
      name: "jwtAuth",
      secret: jwtSecret,
    })
  )
  // POST /api/auth/login - Authenticate user against PostgreSQL DB & Issue 8-Hour Shift JWT Token
  .post(
    "/login",
    async ({ body, jwtAuth, set }) => {
      try {
        const { username, password } = body;
        if (!username || !password) {
          set.status = 400;
          return { success: false, error: "Username dan password wajib diisi" };
        }

        // 1. Verify User Credentials & Bcrypt Password Hash in Database
        const userProfile = await POSStore.loginUser(username, password);

        // 2. Sign JWT Token with User Claims & 8-Hour Shift Expiration (8h = 28800s)
        const token = await jwtAuth.sign({
          id: userProfile.id,
          username: userProfile.username,
          role: userProfile.role,
          name: userProfile.name,
          exp: Math.floor(Date.now() / 1000) + 8 * 3600,
        });

        set.status = 200;
        return {
          success: true,
          token,
          data: userProfile,
          message: `Selamat datang kembali, ${userProfile.name}!`,
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Login gagal" };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  // GET /api/auth/me - Validate JWT Token & Return Active User Session
  .get("/me", async ({ jwtAuth, headers, set }) => {
    try {
      const authHeader = headers["authorization"] || headers["Authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, error: "Sesi tidak valid / Token Authorization tidak ditemukan" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwtAuth.verify(token);

      if (!payload || typeof payload !== "object" || !payload.id) {
        set.status = 401;
        return { success: false, error: "Token JWT telah kedaluwarsa atau tidak valid" };
      }

      if (payload.exp && typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
        set.status = 401;
        return { success: false, error: "Token JWT telah kedaluwarsa (Expired 8 Jam)" };
      }

      const userProfile = await POSStore.getUserById(payload.id as string);
      if (!userProfile) {
        set.status = 401;
        return { success: false, error: "User tidak ditemukan di database" };
      }

      return { success: true, data: userProfile };
    } catch {
      set.status = 401;
      return { success: false, error: "Verifikasi token gagal" };
    }
  })
  // PUT /api/auth/profile - Update Logged-in User Profile & Password
  .put(
    "/profile",
    async ({ jwtAuth, headers, body, set }) => {
      try {
        const authHeader = headers["authorization"] || headers["Authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, error: "Sesi tidak valid / Token Authorization tidak ditemukan" };
        }

        const token = authHeader.split(" ")[1];
        const payload = await jwtAuth.verify(token);

        if (!payload || typeof payload !== "object" || !payload.id) {
          set.status = 401;
          return { success: false, error: "Token JWT telah kedaluwarsa atau tidak valid" };
        }

        const updatedUser = await POSStore.updateUserProfile(payload.id as string, body);
        return {
          success: true,
          data: updatedUser,
          message: "Profil berhasil diperbarui",
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || "Gagal memperbarui profil" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        oldPassword: t.Optional(t.String()),
        newPassword: t.Optional(t.String()),
      }),
    }
  )
  // GET /api/auth/users - List users
  .get("/users", async () => {
    const users = await POSStore.getUsers();
    return { success: true, data: users };
  });
