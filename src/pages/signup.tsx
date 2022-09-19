import Link from "next/link";
import { useRouter } from "next/router";
import React, { FormEvent, useEffect, useState } from "react";
import { getProviders, signIn as signup } from "next-auth/react";

function signUp() {
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  useEffect(() => {
    getProviders().then((p) => setProviders(Object.keys(p)));
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    console.log("running");

    const { error } = await signup("credentials", {
      email,
      password,
      redirect: false,
    });
    if (error) {
      return setError(error);
    }
    router.push("/");
  }
  return (
    <>
      <div>
        <h1>Sign Up</h1>
        <h3>{error}</h3>
        <div>
          {providers
            .filter((p) => p !== "credentials")
            .map((provider) => (
              <div key={provider}>
                <button onClick={() => signup(provider)}>
                  Sign in with {provider}
                </button>
              </div>
            ))}
        </div>
        <div>
          <label htmlFor="email">Email: </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            name="email"
            id="email"
            placeholder="user@email.com"
          />{" "}
          <br />
          <label htmlFor="password">Password: </label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            name="password"
            id="password"
            placeholder="*********"
          />
          <br />
          <button type="submit" onClick={submitForm}>
            Sign Up
          </button>{" "}
        </div>
        <button>
          <Link href={"/signin"}>Sign In</Link>
        </button>
        <button>
          <Link href={"/"}>Homepage</Link>
        </button>
      </div>
      <span style={{ display: "block" }}>
        Code:{" "}
        <a
          target={"_blank"}
          href={
            "https://github.com/Tyson3101/NextAuth-SignUp-And-SignIn/blob/main/src/pages/signup.tsx"
          }
        >
          Github
        </a>
      </span>
    </>
  );
}

export default signUp;
