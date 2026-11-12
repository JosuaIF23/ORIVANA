import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/common/logo';

/** Signed-out layout: logo top-left, centred column, optional footer. */
export function AuthLayout({ children, footer = true, width = 'max-w-[480px]' }: { children: ReactNode; footer?: boolean; width?: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <header className="px-6 py-6 md:px-8">
        <Link to="/sign-in" aria-label="ORIVANA sign in" className="inline-flex rounded-control">
          <Logo />
        </Link>
      </header>
      <main id="main" className={cn('mx-auto flex w-full flex-1 flex-col justify-center px-4 pb-12', width)}>
        {children}
      </main>
      {footer ? (
        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pb-8 text-sm text-fg-secondary">
          <span>Personal Intelligence &amp; Action Platform</span>
          <span aria-hidden="true">·</span>
          <a href="#privacy" className="underline underline-offset-4 hover:text-fg">
            Privacy
          </a>
          <a href="#terms" className="underline underline-offset-4 hover:text-fg">
            Terms
          </a>
        </footer>
      ) : null}
    </div>
  );
}

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-card border border-subtle bg-surface p-6 md:p-8', className)}>{children}</div>;
}

/** Inline link styled per the design (accent, underlined). */
export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn('text-accent underline underline-offset-4 hover:text-fg', className)}>
      {children}
    </Link>
  );
}
