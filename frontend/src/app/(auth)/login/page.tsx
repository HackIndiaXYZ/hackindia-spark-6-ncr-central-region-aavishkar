import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg py-10 text-sm text-white/60">Loading sign-in…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
