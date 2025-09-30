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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip as ChartTooltip } from "recharts";

// Helper function to get style for ranks, copied from the main page for consistency
const getRankStyle = (rankTitle: string) => {
  switch (rankTitle) {
    case "أمير المؤمنين": return "bg-yellow-200 text-yellow-800 border-yellow-300";
    case "أمير": return "bg-red-200 text-red-800 border-red-300";
    case "النبلاء": return "bg-pink-200 text-pink-800 border-pink-300";
    case "قائد": return "bg-purple-200 text-purple-800 border-purple-300";
    case "فارس": return "bg-indigo-200 text-indigo-800 border-indigo-300";
    case "مجتهد": return "bg-blue-200 text-blue-800 border-blue-300";
    default: return "bg-gray-200 text-gray-800 border-gray-300"; // مبتدئ
  }
};

// Self-contained component for the entirety of Step 2
const StepTwoVisual = () => {
    const { data: session } = useSession();
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('ring'); // 'ring' or 'chart'

    // Effect for the ring animation
    useEffect(() => {
        if (phase === 'ring') {
            const controls = animate(0, 100, {
                duration: 2.5,
                ease: "linear",
                onUpdate: (value) => setProgress(value),
                onComplete: () => {
                    // Wait half a second after completion before switching to the chart
                    setTimeout(() => setPhase('chart'), 500);
                }
            });
            return () => controls.stop();
        }
    }, [phase]);

    // Effect for the chart display duration
    useEffect(() => {
        if (phase === 'chart') {
            const timer = setTimeout(() => {
                setPhase('ring'); // Go back to the ring phase
            }, 4000); // Display chart for 4 seconds
            return () => clearTimeout(timer);
        }
    }, [phase]);


    // Dummy data for the chart visualization
    const dummyChartData = Array.from({ length: 30 }, (_, i) => ({
      name: String(i + 1),
      minutes: Math.floor(Math.random() * 300) + 60, // Random minutes between 1h and 6h
    }));

    return (
        <AnimatePresence mode="wait">
            {phase === 'ring' ? (
                <motion.div
                    key="ring"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center w-full h-full"
                >
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
                        <Badge className={`border text-xs ${getRankStyle("مبتدئ")}`}>مبتدئ</Badge>
                    </div>
                    <p className="text-center text-muted-foreground mt-4">
                        هذه الحلقة تمثل هدفك اليومي (4 ساعات). اكتمالها يعني نجاحك في تحدي اليوم.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    key="chart"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center w-full h-full"
                >
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dummyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis dx={-10} stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
                          <ChartTooltip
                            cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                            formatter={(value: number) => [`${value} دقيقة`, 'الإنجاز']}
                          />
                          <ReferenceLine y={240} stroke="#10b981" strokeDasharray="3 3" />
                          <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                     <p className="text-center text-muted-foreground mt-4">
                        وهذا المخطط يتتبع أدائك طوال الشهر. يمكنك رؤيته في أي وقت عند الضغط على بطاقتك.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
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
    title: "تتبع إنجازك اليومي والشهري",
    content: "", // Content is now handled by the visual component
    visual: () => <StepTwoVisual />,
  },
  {
    title: "ارتقِ في الرتب",
    content: "كلما زادت ساعات إنجازك، ارتفعت رتبتك. لكن رتبة \"أمير المؤمنين\" هي لقب فريد يُمنح فقط لصاحب المركز الأول على الإطلاق.",
    visual: () => (
        <div className="flex flex-col items-center w-full gap-6">
            {/* Top Rank */}
            <div className="flex flex-col items-center gap-1 transform scale-110">
                <span className="text-lg -mb-1">👑</span>
                <div className="shadow-[0_0_15px_rgba(252,211,77,0.7)] rounded-lg">
                    <Badge className={`border text-xs ${getRankStyle("أمير المؤمنين")}`}>أمير المؤمنين</Badge>
                </div>
                <span className="text-xs text-muted-foreground mt-1">لقب فريد</span>
            </div>

            <hr className="w-1/2 border-gray-300 dark:border-gray-700" />

            {/* Other Ranks */}
            <div className="grid grid-cols-3 gap-x-2 gap-y-4 w-full max-w-xs">
                <div className="flex flex-col items-center gap-1">
                    <Badge className={`border text-xs ${getRankStyle("أمير")}`}>أمير</Badge>
                    <span className="text-xs text-muted-foreground">800+ ساعة</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Badge className={`border text-xs ${getRankStyle("النبلاء")}`}>النبلاء</Badge>
                    <span className="text-xs text-muted-foreground">500+ ساعة</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Badge className={`border text-xs ${getRankStyle("قائد")}`}>قائد</Badge>
                    <span className="text-xs text-muted-foreground">300+ ساعة</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Badge className={`border text-xs ${getRankStyle("فارس")}`}>فارس</Badge>
                    <span className="text-xs text-muted-foreground">150+ ساعة</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Badge className={`border text-xs ${getRankStyle("مجتهد")}`}>مجتهد</Badge>
                    <span className="text-xs text-muted-foreground">50+ ساعة</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Badge className={`border text-xs ${getRankStyle("مبتدئ")}`}>مبتدئ</Badge>
                    <span className="text-xs text-muted-foreground">0+ ساعة</span>
                </div>
            </div>
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
    const hasSeenTour = hasSeenOnboardingTour_v2;
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
      <DialogContent className="p-6">
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

            {currentStepContent.content && (
              <p className="text-center text-muted-foreground mt-4">
                {currentStepContent.content}
              </p>
            )}
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