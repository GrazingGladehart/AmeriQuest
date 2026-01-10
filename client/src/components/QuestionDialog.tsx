import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Checkpoint } from "@shared/schema";
import { Loader2, Award, XCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoint: Checkpoint | null;
  onVerify: (answer: string) => Promise<boolean>;
}

export function QuestionDialog({ open, onOpenChange, checkpoint, onVerify }: QuestionDialogProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  if (!checkpoint) return null;

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    setIsSubmitting(true);
    
    try {
      const isCorrect = await onVerify(selectedAnswer);
      if (isCorrect) {
        setResult("correct");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF69B4', '#00BFFF']
        });
        setTimeout(() => {
          onOpenChange(false);
          setResult(null);
          setSelectedAnswer("");
        }, 2000);
      } else {
        setResult("incorrect");
        setTimeout(() => setResult(null), 1500); // Allow retry
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />
        
        <DialogHeader className="p-6 pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-display font-bold text-foreground">
            Science Challenge!
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-1">
            Answer correctly to earn <span className="font-bold text-primary">{checkpoint.points} points</span>
          </p>
        </DialogHeader>

        <div className="p-6 pt-2">
          <div className="bg-secondary/10 p-4 rounded-xl mb-6">
            <p className="font-medium text-lg leading-relaxed text-center text-foreground/90">
              {checkpoint.question}
            </p>
          </div>

          <RadioGroup 
            value={selectedAnswer} 
            onValueChange={setSelectedAnswer} 
            className="space-y-3"
          >
            {checkpoint.options.map((option, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  "relative flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                  selectedAnswer === option 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-transparent bg-gray-50 hover:bg-gray-100"
                )}>
                  <RadioGroupItem value={option} id={`option-${idx}`} className="text-primary" />
                  <Label 
                    htmlFor={`option-${idx}`} 
                    className="flex-1 cursor-pointer font-medium text-base"
                  >
                    {option}
                  </Label>
                </div>
              </motion.div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="p-6 pt-0">
          <AnimatePresence mode="wait">
            {result === "incorrect" ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full bg-red-100 text-red-600 p-3 rounded-xl flex items-center justify-center gap-2 font-bold"
              >
                <XCircle className="w-5 h-5" />
                Try Again!
              </motion.div>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitting || result === "correct"}
                className={cn(
                  "w-full py-6 text-lg rounded-xl font-bold shadow-lg transition-all",
                  result === "correct" 
                    ? "bg-green-500 hover:bg-green-600 text-white" 
                    : "bg-primary hover:bg-primary/90 text-white"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : result === "correct" ? (
                  "Correct! +Points"
                ) : (
                  "Submit Answer"
                )}
              </Button>
            )}
          </AnimatePresence>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility for cn if not already present in user codebase context (safe to include)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
