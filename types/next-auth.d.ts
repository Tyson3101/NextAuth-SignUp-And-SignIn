import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      avatar: string;
      providerImage: string;
      email: string;
      id: string;
      verificationJWT?: string;
      isVerified: boolean;
    } & DefaultSession["user"];
  }
}
