"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Target,
  CalendarDays,
  Clock,
  Smartphone,
  Award,
  Heart,
  Pencil,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";

const ProgressRingVisual = () => {
    const { data: session } = useSession();
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const controls = animate(0, 100, {
            duration: 2.5,
            ease: "linear",
            onUpdate: (value) => {
                setProgress(value);
            },
        });
        return () => controls.stop();
    }, []);
    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                تحدي المعسكر: {Math.round(progress)}%
            </p>
            <ProgressRing progress={progress} size={100} strokeWidth={8} disableTransition>
                <Avatar className="h-20 w-20">
                    <AvatarImage src={session?.user?.image ?? undefined} />
                    <AvatarFallback>
                        {session?.user?.name?.charAt(0) ?? '?'}
                    </AvatarFallback>
                </Avatar>
            </ProgressRing>
        </div>
    );
};

const tourSteps = [
  {
    title: "مرحبًا بك في معسكر الأبطال!",
    content: "معسكر الإنجاز هو تحدٍ لمدة شهر لتحقيق هدف واحد كبير. للنجاح، عليك الالتزام بحد أدنى 4 ساعات من العمل المركز يوميًا. من شروط المعسكر الأساسية التخلص من جميع المشتتات طوال فترة التحدي.",
    visual: () => (
      <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2 } }}><Target size={32} /></motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.4 } }}><CalendarDays size={32} /></motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.6 } }}><Clock size={32} /></motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.8 } }}><Smartphone size={32} /></motion.div>
      </div>
    ),
  },
  {
    title: "تحدي الـ 4 ساعات اليومي",
    content: "هذه الحلقة تمثل هدفك اليومي (4 ساعات). اكتمالها يعني نجاحك في تحدي اليوم.",
    visual: () => <ProgressRingVisual />,
  },
  {
    title: "ارتقِ في الرتب",
    content: "كلما زادت ساعات إنجازك الكلية، ارتفعت رتبتك.",
    visual: () => (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}><Badge variant="outline">مبتدئ</Badge></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}><Badge variant="outline">مجتهد</Badge></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}><Badge variant="outline">فارس</Badge></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }}><Badge variant="outline">قائد</Badge></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.0 } }}><Badge variant="outline">أمير</Badge></motion.div>
        </div>
    ),
  },
  {
    title: "انتبه! لديك 3 فرص فقط",
    content: "لكل يوم تفشل فيه، ستخسر قلبًا. إذا خسرت كل قلوبك، تخرج من المنافسة.",
    visual: () => (
        <div className="flex items-center justify-center gap-4">
            <motion.div initial={{ scale: 1 }} animate={{ scale: 1 }}><Heart size={40} className="fill-red-500 stroke-red-600" /></motion.div>
            <motion.div initial={{ scale: 1 }} animate={{ scale: 1 }}><Heart size={40} className="fill-red-500 stroke-red-600" /></motion.div>
            <motion.div initial={{ scale: 1 }} animate={{ scale: 0.9, transition: { delay: 1, yoyo: Infinity } }}><Heart size={40} className="fill-slate-300 stroke-slate-400" /></motion.div>
        </div>
    ),
  },
  {
    title: "حدد هدفك",
    content: "يمكنك تعديل هدفك في أي وقت من نافذة التفاصيل الخاصة بك.",
    visual: () => (
        <div className="flex items-center justify-center gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">هدفي هو...</p>
            <Pencil size={20} />
        </div>
    ),
  },
  {
    title: "هل أنت مستعد؟",
    content: "المعسكر بدأ. بالتوفيق أيها البطل!",
    visual: () => <Target size={60} className="stroke-primary" />,
  },
];

const TOTAL_STEPS = tourSteps.length;

export const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour_v1');
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        // If dialog is closed for any reason, mark tour as seen
        localStorage.setItem('hasSeenOnboardingTour_v1', 'true');
    }
    setIsOpen(open);
    // Reset step count when dialog is closed
    if (!open) {
        setTimeout(() => setStep(1), 300);
    }
  }

  const handleFinalButtonClick = () => {
    localStorage.setItem('hasSeenOnboardingTour_v1', 'true');
    setIsOpen(false);
    setTimeout(() => setStep(1), 300);
  }

  const currentStepContent = tourSteps[step - 1];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold mb-2">
                {currentStepContent.title}
              </DialogTitle>
            </DialogHeader>

            <div className="min-h-[120px] flex items-center justify-center my-4">
              {currentStepContent.visual()}
            </div>

            <p className="text-center text-muted-foreground min-h-[60px]">
              {currentStepContent.content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation and Progress Dots */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={handlePrev}>
                السابق
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  step === index + 1 ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          <div>
            {step < TOTAL_STEPS ? (
              <Button onClick={handleNext}>التالي</Button>
            ) : (
              <Button onClick={handleFinalButtonClick}>هيا نبدأ!</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};