import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { getScoreColor } from '@/lib/utils';

interface DayScoreProps {
  score: number;
  showAnimation?: boolean;
}

export default function DayScore({ score, showAnimation = false }: DayScoreProps) {
  const [displayScore, setDisplayScore] = useState(showAnimation ? 0 : score);
  const colorClass = getScoreColor(score);
  const controls = useAnimationControls();

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setDisplayScore(score);
        controls.start({
          scale: [0.9, 1.1, 1],
          opacity: [0.8, 1],
          transition: { duration: 0.3 }
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [score, showAnimation, controls]);

  return (
    <motion.div
      className={`text-2xl font-semibold ${colorClass} px-3 py-1 rounded-md backdrop-blur-sm bg-card/10`}
      initial={showAnimation ? { opacity: 0.8, scale: 0.9 } : false}
      animate={controls}
    >
      {showAnimation ? (
        <motion.span
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {Math.round(displayScore)}
        </motion.span>
      ) : (
        Math.round(score)
      )}
    </motion.div>
  );
}