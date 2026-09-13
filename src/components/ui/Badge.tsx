"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { motion } from "framer-motion";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "accent"
  | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  pulse?: boolean;
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = "",
      variant = "default",
      size = "md",
      pulse = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center font-display font-bold rounded-full transition-all duration-200";

    const variantClasses: Record<BadgeVariant, string> = {
      default:
        "bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/30",
      success:
        "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30",
      warning:
        "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30",
      error:
        "bg-[var(--color-error)]/15 text-[var(--color-error)] border border-[var(--color-error)]/30",
      info:
        "bg-[var(--color-info)]/15 text-[var(--color-info)] border border-[var(--color-info)]/30",
      accent:
        "bg-[var(--accent)] text-white border border-[var(--accent)] shadow-md hover:shadow-[var(--accent-glow)]/30",
      outline:
        "bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    return (
      <motion.span
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${
          sizeClasses[size]
        } ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {children}
        {pulse && (
          <motion.span
            className="ml-1.5 h-2 w-2 rounded-full bg-current opacity-75"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps, BadgeVariant };