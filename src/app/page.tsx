import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">RestoPOS</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Multi-Branch Restaurant POS System
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
