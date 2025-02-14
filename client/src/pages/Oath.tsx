import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

const OathText = `Я — неоспоримая сила. Я не раб своих желаний, я их хозяин. Я выбираю дисциплину вместо минутных удовольствий. Я не позволяю порнографии разрушать мой разум и лишать меня энергии — я сильнее этого. Я не растрачиваю своё время на пустые развлечения, которые ведут в никуда. Каждое мгновение — это возможность стать лучше, и я не позволю себе её упустить.

Я контролирую свои финансы, потому что понимаю: деньги — это инструмент для роста, а не для удовлетворения капризов. Я не покупаю бесполезные вещи, потому что инвестирую в себя и своё будущее. Я строю жизнь, где каждый шаг ведёт к успеху.

Моё тело — мой храм. Я питаю его едой, которая даёт силу, а не слабость. Я не позволю сахару и пустым калориям лишить меня энергии и решимости. Я тренирую своё тело, потому что хочу быть сильным, выносливым, непоколебимым. Я уважаю себя слишком сильно, чтобы быть слабым.

Я не убиваю время — я использую его. Я вкладываю каждую минуту в развитие навыков, знаний и опыта, которые приведут меня к величию. Я строю будущее своими действиями сегодня. Я знаю, кем хочу быть, и ничего не сможет меня остановить.

Моя решимость — моя броня. Я выбираю путь дисциплины, силы и мудрости. Я хозяин своей судьбы, и никакие соблазны не могут отнять у меня власть над собой. Я выбираю быть великим. Я выбираю побеждать.`;

const TypewriterText = ({ text, isVisible }: { text: string; isVisible: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (isVisible) {
      let currentText = '';
      const textArray = text.split('');
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < textArray.length) {
          currentText += textArray[currentIndex];
          setDisplayedText(currentText);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 50); // Скорость печати

      return () => clearInterval(interval);
    }
  }, [isVisible, text]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="whitespace-pre-line text-lg leading-relaxed"
    >
      {displayedText}
    </motion.div>
  );
};

export default function Oath() {
  const [started, setStarted] = useState(false);
  const [showPledge, setShowPledge] = useState(false);
  const [, setLocation] = useLocation();

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => setShowPledge(true), OathText.length * 50 + 1000);
  };

  const handlePledge = () => {
    setLocation('/ranges');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-3xl w-full space-y-8">
        <AnimatePresence>
          {!started && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <Button
                size="lg"
                className="text-xl px-8 py-6"
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
              <TypewriterText text={OathText} isVisible={started} />
            </motion.div>
          )}

          {showPledge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mt-8"
            >
              <Button
                size="lg"
                className="text-xl px-8 py-6"
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