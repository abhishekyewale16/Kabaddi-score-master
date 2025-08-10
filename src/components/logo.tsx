
"use client";

import { motion } from 'framer-motion';

export const Logo = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.svg
        width="80"
        height="80"
        viewBox="0 0 100 100"
        className="mb-4"
      >
        <g transform="rotate(-15 50 50)">
          {/* Top part of the '9' */}
          <motion.path
            d="M 50,20 A 25 25 0 1 1 50,70"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            variants={pathVariants}
          />
          {/* Bottom tail of the '9' */}
          <motion.path
            d="M 50,70 Q 50 85, 70 85"
            stroke="hsl(var(--border))"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            variants={pathVariants}
          />
        </g>
      </motion.svg>
      
      <motion.div variants={textVariants} className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
          Synergy Score
        </h1>
        <p className="text-lg text-muted-foreground">
          Holistic Match Management
        </p>
      </motion.div>
    </motion.div>
  );
};
