import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Shopcart Admin",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    reset?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const reset = first(params.reset);
  const error = first(params.error);

  return (
    <LoginForm
      notice={
        reset === "1"
          ? "Password updated. Sign in with your new password."
          : null
      }
      initialError={error ?? null}
    />
  );
}
