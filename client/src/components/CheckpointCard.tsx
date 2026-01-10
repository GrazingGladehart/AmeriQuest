import { motion } from "framer-motion";
import { CheckCircle, MapPin, Navigation } from "lucide-react";
import type { Checkpoint } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  distance: number; // meters
  index: number;
}

export function CheckpointCard({ checkpoint, distance, index }: CheckpointCardProps) {
  const isCollected = checkpoint.collected;
  const isNear = distance < 50 && !isCollected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative p-4 rounded-2xl border-2 transition-all duration-300",
        isCollected 
          ? "bg-green-50 border-green-200 opacity-60" 
          : "bg-white border-white/50 shadow-sm hover:shadow-md hover:scale-[1.02]",
        isNear && "border-primary shadow-primary/20 ring-2 ring-primary/10 animate-pulse"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm",
            isCollected 
              ? "bg-green-100 text-green-600" 
              : "bg-gradient-to-br from-secondary to-orange-400 text-white"
          )}>
            {isCollected ? <CheckCircle className="w-6 h-6" /> : index + 1}
          </div>
          
          <div>
            <h3 className="font-display font-bold text-lg leading-tight text-foreground/90">
              Checkpoint #{checkpoint.id}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-muted-foreground">
              {isCollected ? (
                <span className="text-green-600">Collected!</span>
              ) : (
                <>
                  <Navigation className="w-3 h-3 text-primary" />
                  <span className={cn(
                    distance < 50 ? "text-primary font-bold" : ""
                  )}>
                    {Math.round(distance)}m away
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isCollected && (
          <div className="flex flex-col items-center justify-center min-w-[3rem]">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">PTS</div>
            <div className="text-xl font-black text-primary font-display">{checkpoint.points}</div>
          </div>
        )}
      </div>
      
      {/* Progress Bar Background for "Near" state could go here */}
      {isNear && (
        <motion.div 
          layoutId="near-indicator"
          className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" 
        />
      )}
    </motion.div>
  );
}
