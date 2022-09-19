// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    res.send(
      await prisma.user.create({
        data: {
          email: (req.query.email as string) || "user@email.com",
          password: "Password",
          isVerified: true,
        },
      })
    );
  } catch (e) {
    res.send({ message: e.message, ...e });
  }
}
