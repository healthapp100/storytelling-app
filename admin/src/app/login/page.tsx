import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-night p-12 text-cream lg:flex">
        <p className="font-display text-2xl">Storytelling</p>
        <div>
          <p className="max-w-sm font-display text-4xl leading-tight">
            A new story,
            <br />
            every day.
          </p>
          <div className="mt-6 h-[3px] w-10 bg-accent" />
        </div>
        <p className="text-sm text-cream/60">Admin console</p>
      </aside>
      <div className="flex items-center justify-center bg-paper px-6 py-16">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
