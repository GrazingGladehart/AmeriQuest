import { useState, useEffect, useMemo } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useGenerateGame, useVerifyAnswer } from "@/hooks/use-game";
import { CheckpointCard } from "@/components/CheckpointCard";
import { QuestionDialog } from "@/components/QuestionDialog";
import { Radar } from "@/components/Radar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDistance } from "geolib";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trophy, MapPin, AlertCircle } from "lucide-react";
import type { Checkpoint } from "@shared/schema";

export default function Game() {
  const { lat, lng, error: geoError, loading: geoLoading } = useGeolocation();
  const generateGameMutation = useGenerateGame();
  const verifyAnswerMutation = useVerifyAnswer();
  
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Checkpoint | null>(null);

  // Derived state: sorted checkpoints by distance
  const sortedCheckpoints = useMemo(() => {
    if (!lat || !lng || checkpoints.length === 0) return [];
    
    return checkpoints.map(cp => {
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
      generateGameMutation.mutate(
        { lat, lng, radius: 500, count: 5 },
        {
          onSuccess: (data) => {
            setCheckpoints(data);
            setGameActive(true);
            setScore(0);
          }
        }
      );
    }
  };

  // Watch for proximity triggers
  useEffect(() => {
    if (!gameActive || !lat || !lng || activeQuestion) return;

    // Find closest uncollected checkpoint
    const closest = sortedCheckpoints.find(cp => !cp.collected);
    
    if (closest && closest.distance <= 20) {
      // Trigger question!
      setActiveQuestion(closest);
    }
  }, [lat, lng, sortedCheckpoints, gameActive, activeQuestion]);

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
            {/* Unsplash: Science equipment in a lab or field */}
            <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg z-20 rotate-[-6deg]">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-black font-display text-foreground mb-4 leading-tight">
            Science <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Scavenger Hunt</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Explore your surroundings to find hidden energy points. Answer questions correctly to collect them!
          </p>
          
          <Button 
            onClick={handleStartGame}
            disabled={generateGameMutation.isPending}
            className="w-full btn-game h-16 text-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
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

  // 4. Active Game UI
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Stats */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Score</span>
            <div className="text-3xl font-black font-display text-primary flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              {score}
            </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Found</span>
             <div className="text-xl font-bold font-display text-foreground">
               {checkpoints.filter(c => c.collected).length} / {checkpoints.length}
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        
        {/* Status Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="p-6 relative z-10 text-center">
            <Radar />
            <h2 className="text-xl font-bold font-display mb-1">Scanning Sector...</h2>
            <p className="text-indigo-100 text-sm">Walk towards checkpoints to unlock questions.</p>
          </div>
        </Card>

        {/* Checkpoints List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Nearby Targets</h3>
            <Badge variant="secondary" className="bg-white text-slate-500 shadow-sm">
              <MapPin className="w-3 h-3 mr-1" />
              Accuracy: High
            </Badge>
          </div>

          <AnimatePresence>
            {sortedCheckpoints.map((cp, idx) => (
              <CheckpointCard 
                key={cp.id} 
                checkpoint={cp} 
                distance={cp.distance} 
                index={idx} 
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Question Dialog Popup */}
      <QuestionDialog 
        open={!!activeQuestion} 
        onOpenChange={(open) => !open && setActiveQuestion(null)}
        checkpoint={activeQuestion}
        onVerify={handleVerify}
      />
    </div>
  );
}
