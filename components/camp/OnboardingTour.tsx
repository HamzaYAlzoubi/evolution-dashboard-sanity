"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const TOTAL_STEPS = 6; // 5 steps for explanation + 1 for final message

export const OnboardingTour = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">جولة تعريفية في معسكر الأبطال</DialogTitle>
        </DialogHeader>

        {/* Step Content will go here */}
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <p>المحتوى للخطوة {step} سيظهر هنا.</p>
        </div>

        {/* Navigation and Progress Dots */}
        <div className="flex items-center justify-between mt-4">
          <div>
            {step > 1 && (
                <Button variant="outline" onClick={handlePrev}>
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
                <Button onClick={handleNext}>
                    التالي
                </Button>
            ) : (
                <Button>هيا نبدأ!</Button> // Final button
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};