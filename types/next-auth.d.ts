import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    organizationId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
  }
}
