"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Direction the element travels in from as it reveals. "down" drops in from above. */
  direction?: "down" | "up";
  /** Stagger delay in seconds, useful for sequencing sibling Reveals. */
  delay?: number;
  distance?: number;
};

export default function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  distance = 28,
}: RevealProps) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: direction === "down" ? -distance : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
