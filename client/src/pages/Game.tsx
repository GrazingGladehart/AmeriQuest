import { useState, useEffect, useMemo } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useGenerateGame, useVerifyAnswer } from "@/hooks/use-game";
import { CheckpointCard } from "@/components/CheckpointCard";
import { QuestionDialog } from "@/components/QuestionDialog";
import { Radar } from "@/components/Radar";
import { ARView } from "@/components/ARView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDistance } from "geolib";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trophy, MapPin, AlertCircle, Camera, Settings, Timer, Target } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Checkpoint } from "@shared/schema";

export default function Game() {
  const { lat, lng, error: geoError, loading: geoLoading } = useGeolocation();
  const generateGameMutation = useGenerateGame();
  const verifyAnswerMutation = useVerifyAnswer();
  
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Checkpoint | null>(null);
  const [showARView, setShowARView] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const settingsQuery = useQuery<{ timeLimit: number; checkpointCount: number; radius: number }>({
    queryKey: ["/api/settings"],
  });

  // Derived state: sorted and deduplicated checkpoints by distance
  const sortedCheckpoints = useMemo(() => {
    if (!lat || !lng || checkpoints.length === 0) return [];
    
    // Deduplicate by ID
    const uniqueCheckpointsMap = new Map();
    checkpoints.forEach(cp => {
      uniqueCheckpointsMap.set(cp.id, cp);
    });
    const uniqueCheckpoints = Array.from(uniqueCheckpointsMap.values());
    
    return uniqueCheckpoints.map(cp => {
      const dist = getDistance(
        { latitude: lat, longitude: lng },
        { latitude: cp.lat, longitude: cp.lng }
      );
      return { ...cp, distance: dist };
    }).sort((a, b) => {
      // Sort collected to bottom, then by distance
      if (a.collected && !b.collected) return 1;
      if (!a.collected && b.collected) return -1;
      return a.distance - b.distance;
    });
  }, [lat, lng, checkpoints]);

  // Start Game Handler
  const handleStartGame = () => {
    if (lat && lng) {
      const count = settingsQuery.data?.checkpointCount ?? 5;
      const radius = settingsQuery.data?.radius ?? 500;
      generateGameMutation.mutate(
        { lat, lng, radius, count },
        {
          onSuccess: (data) => {
            setCheckpoints(data);
            setGameActive(true);
            setScore(0);
            const minutes = settingsQuery.data?.timeLimit ?? 30;
            setTimeRemaining(minutes * 60);
          }
        }
      );
    }
  };

  const [gameOver, setGameOver] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    if (!gameActive || timeRemaining === null || gameOver) return;

    if (timeRemaining <= 0) {
      setGameOver(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameActive, timeRemaining, gameOver]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle AR checkpoint tap
  const handleARCheckpointTap = (checkpoint: Checkpoint) => {
    setShowARView(false);
    setActiveQuestion(checkpoint);
  };

  // Watch for proximity triggers - REMOVED automatic popup
  /* 
  useEffect(() => {
    if (!gameActive || !lat || !lng || activeQuestion) return;

    // Find closest uncollected checkpoint
    const closest = sortedCheckpoints.find(cp => !cp.collected);
    
    if (closest && closest.distance <= 20) {
      // Trigger question!
      setActiveQuestion(closest);
    }
  }, [lat, lng, sortedCheckpoints, gameActive, activeQuestion]);
  */

  // Handle Answer Verification
  const handleVerify = async (answer: string): Promise<boolean> => {
    if (!activeQuestion) return false;

    try {
      const result = await verifyAnswerMutation.mutateAsync({
        questionId: activeQuestion.id,
        answer
      });

      if (result.correct) {
        setScore(prev => prev + result.points);
        setCheckpoints(prev => prev.map(cp => 
          cp.id === activeQuestion.id ? { ...cp, collected: true } : cp
        ));
        // After a small delay to show success in dialog, we'll close it
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // --- Render States ---

  // 1. Loading Geolocation
  if (geoLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-blue-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground/80 font-display">Acquiring Satellites...</h2>
      </div>
    );
  }

  // 2. Geolocation Error
  if (geoError || !lat || !lng) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-red-50/50">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground font-display mb-2">Location Required</h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          We need your GPS coordinates to generate checkpoints around you. Please enable location access.
        </p>
      </div>
    );
  }

  // 3. Game Not Started (Lobby)
  if (!gameActive) {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-gradient-to-br from-background via-purple-50 to-blue-50">
        <div className="absolute top-4 right-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <img 
              src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop" 
              alt="Science Exploration"
              className="w-48 h-48 object-cover rounded-3xl shadow-2xl relative z-10 rotate-3 border-4 border-white"
            />
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg z-20 rotate-[-6deg]">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-black font-display text-foreground mb-4 leading-tight">
            Science <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Scavenger Hunt</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            Explore your surroundings to find hidden energy points. Answer questions correctly to collect them!
          </p>

          <div className="flex flex-col items-center gap-2 mb-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className="text-sm">Time Limit: {settingsQuery.data?.timeLimit ?? 30} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Checkpoints: {settingsQuery.data?.checkpointCount ?? 5}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleStartGame}
            disabled={generateGameMutation.isPending}
            className="w-full btn-game h-16 text-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
            data-testid="button-start-game"
          >
            {generateGameMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              "Start Mission"
            )}
          </Button>
        </div>
        
        <div className="text-center text-xs text-muted-foreground/50 mt-8 font-mono">
          LOCATION: {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </div>
    );
  }

  // Active Game directly in AR
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <ARView
        checkpoints={sortedCheckpoints}
        userLat={lat}
        userLng={lng}
        score={score}
        timeRemaining={timeRemaining}
        onCheckpointTap={handleARCheckpointTap}
        onClose={() => setGameActive(false)}
      />

      <QuestionDialog 
        open={!!activeQuestion} 
        onOpenChange={(open) => !open && setActiveQuestion(null)}
        checkpoint={activeQuestion}
        onVerify={handleVerify}
      />
    </div>
  );
}