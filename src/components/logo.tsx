
"use client";

import { motion } from 'framer-motion';

export const Logo = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0,
      },
    },
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0, scale: 0.8 },
    visible: {
      pathLength: 1,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
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
        delay: 0.5,
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
        className="mb-2"
      >
        <g>
          {/* Stylized 'K' */}
          <motion.path
            d="M 25,20 L 25,80"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            variants={pathVariants}
          />
          <motion.path
            d="M 65,20 L 25,50 L 65,80"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            variants={pathVariants}
          />

          {/* Stylized 'V' swoosh */}
           <motion.path
            d="M 75,20 Q 85 50, 75 80"
            stroke="hsl(var(--border))"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            variants={{
              hidden: { pathLength: 0, opacity: 0, scale: 0.8 },
              visible: {
                pathLength: 1,
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 1,
                  ease: "easeInOut",
                  delay: 0.3
                },
              },
            }}
          />
        </g>
      </motion.svg>
      
      <motion.div variants={textVariants} className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
          Kabaddi Veer
        </h1>
        <p className="text-lg text-muted-foreground">
          The Ultimate Scoring Companion
        </p>
      </motion.div>
    </motion.div>
  );
};
