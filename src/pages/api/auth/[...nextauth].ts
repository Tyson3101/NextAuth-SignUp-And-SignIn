import NextAuth, { NextAuthOptions, User } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import token from "crypto-token";
import sgMail from "@sendgrid/mail";
import JWT from "jsonwebtoken";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const prisma = new PrismaClient();

const credentialsProperties = {
  email: {},
  password: {},
};

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        ...credentialsProperties,
      },
      async authorize(credentials, req) {
        const isSignInPage = req.body.callbackUrl
          .toLowerCase()
          .includes("/signin");
        if (isSignInPage) return await handleSignIn(credentials);
        else return await handleSignUp(credentials);
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },

  callbacks: {
    signIn: async ({ user }) => {
      let userCheck = await prisma.user.findFirst({
        where: {
          email: user.email || "",
        },
      });
      if (!userCheck && user.email?.length) {
        await prisma.user.create({
          data: {
            email: user.email,
            avatar: generateRandomAvatar(),
            isVerified: true,
          },
        });
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      user && (token.user = user);

      return token;
    },
    //@ts-ignore (Types... ?)
    session: async ({ session, token }) => {
      const tokenUser = token.user as User;
      let user = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });
      if (!user) return {};
      const extendedSession = {
        ...session,
        user: {
          ...tokenUser,
          ...user,
          providerImage: tokenUser.image || null,
        },
      };
      delete extendedSession.user.image;
      delete extendedSession.user.password;
      return extendedSession;
    },
  },
};

export default NextAuth(authOptions);

async function handleSignIn(credentials: typeof credentialsProperties) {
  const userDetails = {
    email: credentials.email as string,
    password: credentials.password as string,
  };
  const user = await prisma.user.findFirst({
    where: { email: userDetails.email },
  });
  if (
    user != null &&
    (await bcrypt.compare(userDetails.password, user.password))
  ) {
    return userDetails;
  } else {
    throw new Error("Wrong email/password");
  }
}
async function handleSignUp(credentials: typeof credentialsProperties) {
  const userDetails = {
    email: credentials.email as string,
    password: credentials.password as string,
  };
  const userCheck = await prisma.user.findFirst({
    where: { email: userDetails.email },
  });
  if (userCheck == null) {
    const hashedPassword = await bcrypt.hash(userDetails.password, 10);
    userDetails.password = hashedPassword;
    const verificationToken = token(32);
    const jwt = JWT.sign(
      { email: userDetails.email, token: verificationToken },
      process.env.VERIFICATION_SECRET,
      {
        expiresIn: 1 * 5,
      }
    );

    await prisma.user.create({
      data: {
        email: userDetails.email,
        password: hashedPassword,
        avatar: generateRandomAvatar(),
        isVerified: false,
        verificationJWT: jwt,
      },
    });
    const verifyURL = process.env.NEXTAUTH_URL + "verify/" + verificationToken;
    const msg = {
      to: userDetails.email, // Change to your recipient
      from: "noreply.starclips@gmail.com", // Change to your verified sender
      subject: "Verify Email",
      text: `Please verify your email with this link: ${verifyURL}`,
      html: `<strong>Please verify your email with this link: <a href="${verifyURL}">${verifyURL}</a></strong>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
    return userDetails;
  } else {
    throw new Error("Email in use OR Password is wrong!");
  }
}

function generateRandomAvatar() {
  return `https://avatars.dicebear.com/api/adventurer-neutral/${Math.floor(
    Math.random() * 200
  )}.svg`;
}
