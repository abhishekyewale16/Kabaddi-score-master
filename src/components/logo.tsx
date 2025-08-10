
"use client";

import { motion } from 'framer-motion';

export const Logo = () => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
        type: 'spring',
        damping: 15,
        stiffness: 100,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
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
        variants={itemVariants}
      >
        <g>
            <motion.path
                d="M 25,15 L 25,85"
                stroke="hsl(var(--primary))"
                strokeWidth="10"
                strokeLinecap="round"
                variants={itemVariants}
            />
            <motion.path
                d="M 75,15 L 40,50 L 75,85"
                stroke="hsl(var(--primary))"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                 variants={itemVariants}
            />
             <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                fill="none"
                variants={itemVariants}
            />
        </g>
      </motion.svg>
      
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
          Kabaddi Score Master
        </h1>
        <p className="text-lg text-muted-foreground">
          Live Scoring & Match Management
        </p>
      </motion.div>
    </motion.div>
  );
};
