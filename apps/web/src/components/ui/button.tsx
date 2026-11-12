import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Spinner } from './spinner';

/**
 * Buttons from the design system: primary (on-accent text on accent), secondary,
 * ghost, danger (outline) and danger-solid (destructive confirm). Desktop targets 32–40 px.
 */
export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-colors duration-150 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-accent/85 disabled:bg-accent/45 disabled:text-on-accent/70',
        secondary: 'border border-control bg-elevated text-fg hover:bg-elevated/60 hover:border-fg-muted disabled:border-subtle disabled:bg-transparent disabled:text-fg-muted',
        ghost: 'text-fg-secondary hover:bg-elevated hover:text-fg disabled:text-fg-muted disabled:hover:bg-transparent',
        danger: 'border border-danger/80 text-danger hover:bg-danger hover:text-on-accent disabled:border-danger/30 disabled:text-danger/50 disabled:hover:bg-transparent',
        'danger-solid': 'bg-danger text-on-accent hover:bg-danger/85 disabled:bg-danger/40',
        link: 'h-auto px-0 text-accent underline underline-offset-4 hover:text-fg',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'size-9 p-0',
        'icon-sm': 'size-8 p-0',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Variants {
  loading?: boolean;
  /** Text shown next to the spinner while loading, e.g. "Approving…". */
  loadingText?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading = false, loadingText, disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), loading && 'cursor-progress', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {loading && loadingText ? loadingText : children}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps, Variants {}

/** Navigation styled as a button: renders an <a>. */
export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
