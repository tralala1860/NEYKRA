"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type ConflictingHTMLProps =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

export type CardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  ConflictingHTMLProps
> &
  HTMLMotionProps<"div"> & {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      hover = false,
      padding = "md",
      as: Component = "div",
      children,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    return (
      <motion.div
        ref={ref}
        className={`${paddingClasses[padding]} ${
          hover ? "transition-all duration-200 cursor-pointer" : ""
        } ${className}`}
        whileHover={hover ? { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" } : {}}
        whileTap={hover ? { scale: 0.99 } : {}}
        {...props}
      >
        <Component className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm hover:border-[var(--border-hover)] hover:shadow-md">
          {children}
        </Component>
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export { Card };