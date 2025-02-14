import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';

const TypewriterText = ({ text, isVisible }: { text: string; isVisible: boolean }) => {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const paragraphs = text.split('\n\n');

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText([]);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < paragraphs.length) {
        setDisplayedText(prev => [...prev, paragraphs[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000); // 2 seconds between paragraphs

    return () => clearInterval(interval);
  }, [isVisible, text]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <div className="relative space-y-6">
        {displayedText.map((paragraph, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1,
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="whitespace-pre-line text-lg leading-relaxed font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
            style={{
              textShadow: '0 0 20px rgba(255,255,255,0.1)',
            }}
          >
            {paragraph.split('').map((char, charIndex) => (
              <motion.span
                key={charIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.1,
                  delay: charIndex * 0.03
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
};

export default function Oath() {
  const [started, setStarted] = useState(false);
  const [showPledge, setShowPledge] = useState(false);
  const [, setLocation] = useLocation();
  const [oathText, setOathText] = useState('');

  useEffect(() => {
    const settings = storage.getSettings();
    setOathText(settings.oathText || '');
  }, []);

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => setShowPledge(true), oathText.length * 50 + 5000);
  };

  const handlePledge = () => {
    setLocation('/ranges');
  };

  const buttonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundSize: '400% 400%',
        }}
      />

      <div className="max-w-3xl w-full space-y-8 relative">
        <AnimatePresence mode="wait">
          {!started && (
            <motion.div
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              className="flex justify-center"
            >
              <Button
                size="lg"
                className="text-xl px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                onClick={handleStart}
              >
                Начать
              </Button>
            </motion.div>
          )}

          {started && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-lg dark:prose-invert mx-auto"
            >
              <TypewriterText text={oathText} isVisible={started} />
            </motion.div>
          )}

          {showPledge && (
            <motion.div
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, y: 20 }}
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              className="flex justify-center mt-8"
            >
              <Button
                size="lg"
                className="text-xl px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                onClick={handlePledge}
              >
                Клянусь
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}