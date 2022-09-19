import { GetServerSidePropsContext } from "next";
import { Session, unstable_getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";

function VerifyPassword() {
  const [msg, setMsg] = useState("Loading...");
  const [skip, setSkip] = useState(false);
  const { data: session, status } = useSession();
  console.log(status);
  if (!session?.user && status === "loading") return <div>Loading...</div>;

  if (typeof window !== "undefined" && !skip) {
    const router = useRouter();
    let jwt = router.query.jwt as string;
    if (!session?.user || !jwt || jwt?.length < 20) {
      router.push("/");
    } else {
      if (session.user.verificationJWT?.includes(jwt)) {
        fetch("/api/updateUser", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ changeVerificationStatus: true, urlJWT: jwt }),
        }).then(() => router.push("/"));
      }
    }
  }

  return (
    <>
      <h1>Verify Password</h1>
      <h3>{msg}</h3>
    </>
  );
}

export default VerifyPassword;
