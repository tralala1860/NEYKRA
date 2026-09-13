"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-display font-bold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-[var(--accent-glow)]/20",
      secondary:
        "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] active:scale-[0.98]",
      ghost:
        "bg-transparent text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] active:scale-[0.98]",
      danger:
        "bg-[var(--color-error)] text-white hover:brightness-110 active:scale-[0.98] shadow-md",
    };

    const sizeClasses: Record<string, string> = {
      sm: "px-3 py-1.5 text-sm leading-none",
      md: "px-4 py-2 text-sm leading-none",
      lg: "px-6 py-3 text-base leading-none",
    };

    return (
      <motion.button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
        {...props}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin -ml-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Chargement…
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant };
export type { ButtonProps, ButtonVariant };