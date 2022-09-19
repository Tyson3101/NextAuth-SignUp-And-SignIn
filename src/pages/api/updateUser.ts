// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);
  const user = session?.user;
  console.log(req.body, !!user, req.body.changeVerificationStatus);
  if (req.body.changeVerificationStatus && user) {
    const checkUser = await prisma.user.findFirst({
      where: { email: user.email },
    });
    if (checkUser?.verificationJWT.includes(req.body.urlJWT)) {
      try {
        await prisma.user.update({
          where: { email: user.email },
          data: { verificationJWT: null, isVerified: true },
        });
      } catch {}
      res.send(200);
    }
  } else res.send(400);
}
