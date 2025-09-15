import { auth } from '@/auth';
import Session from '@/components/session';
import { Button } from '@repo/shadcn/button';
import { ModeSwitcher } from '@repo/shadcn/mode-switcher';
import Link from 'next/link';

const Page = async () => {
  const session = await auth();

  return (
    <section className="min-h-dvh flex flex-col bg-gradient-to-b from-background to-muted/30">
      <nav className="container w-full flex items-center justify-between py-5">
        <Link href="/" aria-label="Home">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">Next + Nest Prisma Turborepo Boilerplate</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ModeSwitcher />
          <Session />
        </div>
      </nav>

      <main className="container flex-1 grid place-items-center px-4">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Next.js + NestJS + Prisma Boilerplate
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Full‑stack starter with JWT auth, sessions, PostgreSQL, and TurboRepo — optimized for DX and best practices.
          </p>

          {session?.user ? (
            <div className="flex items-center justify-center gap-3">
              <Button asChild>
                <Link href={`/${session.user.username}`}>Open Profile</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/confirm-email">Email Status</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Button asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/sign-up">Create Account</Link>
              </Button>
            </div>
          )}

          <div className="pt-2 text-xs text-muted-foreground">
            {session?.user ? (
              <span>Signed in as {session.user.email}</span>
            ) : (
              <span>No account? It takes less than a minute.</span>
            )}
          </div>
        </div>
      </main>
      <footer className="container py-6 text-center text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Next + Nest Prisma Turborepo Boilerplate</span>
      </footer>
    </section>
  );
};

export default Page;
