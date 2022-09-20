import { GetServerSidePropsContext } from "next";
import { Session, unstable_getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
      fetch("/api/updateUser", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          changeVerificationStatus: true,
          verificationToken: jwt,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) setMsg(data.error);
          else setMsg(data.successMsg);
          setSkip(true);
        });
    }
  }

  async function requestNewVerificationJWT() {
    const res = await fetch("/api/updateUser", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestNewVerificationJWT: true,
      }),
    });
    const data = await res.json();
    if (data.error) return setMsg(data.error);
    setMsg("New email sent!");
  }

  return (
    <>
      <h1>Verify Password</h1>
      <h3>{msg}</h3>
      {msg.includes("expired") ? (
        <button onClick={requestNewVerificationJWT}>New email</button>
      ) : null}
      <button>
        <Link href={"/"}>Homepage</Link>
      </button>
    </>
  );
}

export default VerifyPassword;
