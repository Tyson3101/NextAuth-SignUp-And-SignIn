// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { PrismaClient } from "@prisma/client";
import sgMail from "@sendgrid/mail";
import JWT from "jsonwebtoken";
import token from "crypto-token";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    try {
      const verifyJWT = JWT.verify(
        checkUser.verificationJWT,
        process.env.VERIFICATION_SECRET
      ) as { email: string; token: string } | undefined;

      if (
        verifyJWT?.email === checkUser.email &&
        verifyJWT?.token === req.body.verificationToken
      ) {
        await prisma.user.update({
          where: { email: user.email },
          data: { verificationJWT: null, isVerified: true },
        });
        return res.status(200).json({ successMsg: "Verified!" });
      } else {
        console.log(
          verifyJWT?.email === checkUser.email &&
            verifyJWT?.token === req.body.verificationToken
        );
        return res.status(404).send({ error: "Not Authorized" });
      }
    } catch (e) {
      return res.status(404).send({ error: e.message });
    }
  }
  if (req.body.requestNewVerificationJWT && user) {
    const checkUser = await prisma.user.findFirst({
      where: { email: user.email },
    });
    if (!checkUser || checkUser.isVerified) return res.send(404);
    const verificationToken = token(32);
    const jwt = JWT.sign(
      { email: user.email, token: verificationToken },
      process.env.VERIFICATION_SECRET,
      {
        expiresIn: 60 * 5,
      }
    );
    await prisma.user.update({
      where: { email: user.email },
      data: { verificationJWT: jwt },
    });
    const verifyURL = process.env.NEXTAUTH_URL + "verify/" + verificationToken;
    const msg = {
      to: user.email, // Change to your recipient
      from: "noreply.starclips@gmail.com", // Change to your verified sender
      subject: "Verify Email",
      text: `Please verify your email with this link: ${verifyURL}`,
      html: `<strong>Please verify your email with this link: <a href="${verifyURL}">${verifyURL}</a></strong>`,
    };
    await sgMail.send(msg).catch((error) => {
      res.status(404).json({ error: error.message });
    });
    return res.status(200).json({ successMsg: "Verified!" });
  }
  res.send(404);
}
