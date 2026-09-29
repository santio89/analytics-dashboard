import { LoginBrand, LoginForm } from "@/app/login/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/app-config";

export const metadata = {
  title: `Sign in — ${APP_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4">
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card px-6 py-8 shadow-(--shadow)">
        <LoginBrand />
        <LoginForm />
      </div>
    </div>
  );
}
