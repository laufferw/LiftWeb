import AuthForm from "@/components/AuthForm";
import PageShell from "@/components/PageShell";

export default function LoginPage() {
  return (
    <PageShell title="Sign in" subtitle="Magic link">
      <p className="text-sm text-muted">
        Enter your email to receive a magic link. You’ll be signed in on return.
      </p>
      <div className="mt-6">
        <AuthForm />
      </div>
    </PageShell>
  );
}
