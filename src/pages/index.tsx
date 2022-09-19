import type { NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Home: NextPage = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState(false);
  const [fetchedData, setFetchedData] = useState<any>();
  const { data: session } = useSession();
  if (session?.user && !authState) setAuthState(true);
  else if (!session?.user && authState) setAuthState(false);
  useEffect(() => {
    fetch("/api/userinfo")
      .then((res) => res.json())
      .then((data) => {
        setFetchedData(data);
      })
      .catch(() => "WE NOT LOGGED IN!");
  }, []);

  return (
    <>
      <h1>Next-Auth</h1>
      {session?.user && authState ? (
        <div>
          <h1>
            Profile Pic:{" "}
            <Image
              src={`${
                session.user.avatar ||
                "https://avatars.dicebear.com/api/adventurer-neutral/default.svg"
              }`}
              width={"100px"}
              height={"100px"}
            />
          </h1>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      ) : (
        <>
          <div>
            <button onClick={() => router.push("/signin")}>Sign In</button>
          </div>
          <div>
            <button onClick={() => router.push("/signup")}>Sign Up</button>
          </div>
        </>
      )}
      <div>
        <h3>{fetchedData?.message}</h3>
        {fetchedData?.user ? (
          <>
            <p>User:</p>{" "}
            <code style={{ backgroundColor: "rgb(220,220,220)" }}>
              <pre>{JSON.stringify(fetchedData.user, null, 4)}</pre>
            </code>
          </>
        ) : null}
        {fetchedData?.users ? (
          <>
            <p>Users:</p>{" "}
            <code style={{ backgroundColor: "rgb(220,220,220)" }}>
              <pre>{JSON.stringify(fetchedData.users, null, 4)}</pre>
            </code>
          </>
        ) : null}
      </div>
      <span style={{ display: "block" }}>
        {" "}
        Code:{" "}
        <a
          target={"_blank"}
          href={
            "https://github.com/Tyson3101/Firebase-Auth-with-NextJS-SSR/blob/main/src/pages/index.tsx"
          }
        >
          Github
        </a>
      </span>
    </>
  );
};

export default Home;
