import "next-auth";
import "next-auth/jwt";

type Role = "owner" | "admin" | "member";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId?: string;
      role?: Role;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    organizationId?: string;
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    role?: Role;
  }
}
