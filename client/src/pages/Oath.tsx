import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';

// Получаем текст клятвы из настроек
const getOathText = () => {
  const settings = storage.getSettings();
  return settings.oathText || DEFAULT_OATH_TEXT;
};

const DEFAULT_OATH_TEXT = `Я — неоспоримая сила. Я не раб своих желаний, я их хозяин. Я выбираю дисциплину вместо минутных удовольствий. Я не позволяю порнографии разрушать мой разум и лишать меня энергии — я сильнее этого. Я не растрачиваю своё время на пустые развлечения, которые ведут в никуда. Каждое мгновение — это возможность стать лучше, и я не позволю себе её упустить.

Я контролирую свои финансы, потому что понимаю: деньги — это инструмент для роста, а не для удовлетворения капризов. Я не покупаю бесполезные вещи, потому что инвестирую в себя и своё будущее. Я строю жизнь, где каждый шаг ведёт к успеху.

Моё тело — мой храм. Я питаю его едой, которая даёт силу, а не слабость. Я не позволю сахару и пустым калориям лишить меня энергии и решимости. Я тренирую своё тело, потому что хочу быть сильным, выносливым, непоколебимым. Я уважаю себя слишком сильно, чтобы быть слабым.

Я не убиваю время — я использую его. Я вкладываю каждую минуту в развитие навыков, знаний и опыта, которые приведут меня к величию. Я строю будущее своими действиями сегодня. Я знаю, кем хочу быть, и ничего не сможет меня остановить.

Моя решимость — моя броня. Я выбираю путь дисциплины, силы и мудрости. Я хозяин своей судьбы, и никакие соблазны не могут отнять у меня власть над собой. Я выбираю быть великим. Я выбираю побеждать.`;

const TypewriterText = ({ text, isVisible }: { text: string; isVisible: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      setParagraphs(text.split('\n\n'));
    }
  }, [isVisible, text]);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {paragraphs.map((paragraph, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              delay: index * 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="leading-relaxed text-lg"
          >
            {paragraph}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
};

const FloatingParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-primary/20 rounded-full"
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
      y: [-20, -40],
      x: [-10, 10],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

export default function Oath() {
  const [started, setStarted] = useState(false);
  const [showPledge, setShowPledge] = useState(false);
  const [, setLocation] = useLocation();
  const [oathText, setOathText] = useState(getOathText());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setOathText(getOathText());
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => setShowPledge(true), 3000);
  };

  const handlePledge = () => {
    setLocation('/ranges');
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-background/95 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Динамический фон */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, var(--primary) 0%, transparent 60%)`,
        }}
        transition={{ type: "spring", stiffness: 100 }}
      />

      {/* Плавающие частицы */}
      {Array.from({ length: 20 }).map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.2} />
      ))}

      <div className="max-w-3xl w-full space-y-8 relative z-10">
        <AnimatePresence mode="wait">
          {!started && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="flex justify-center"
            >
              <Button
                size="lg"
                className="text-xl px-8 py-6 relative overflow-hidden group"
                onClick={handleStart}
              >
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Начать
                </motion.span>
                <motion.div
                  className="absolute inset-0 bg-primary/20"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ borderRadius: 'inherit' }}
                />
              </Button>
            </motion.div>
          )}

          {started && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-lg dark:prose-invert mx-auto"
              transition={{ duration: 0.8 }}
            >
              <TypewriterText text={oathText} isVisible={started} />
            </motion.div>
          )}

          {showPledge && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              className="flex justify-center mt-8"
            >
              <Button
                size="lg"
                className="text-xl px-8 py-6 relative overflow-hidden group"
                onClick={handlePledge}
              >
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Клянусь
                </motion.span>
                <motion.div
                  className="absolute inset-0 bg-primary/20"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ borderRadius: 'inherit' }}
                />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}