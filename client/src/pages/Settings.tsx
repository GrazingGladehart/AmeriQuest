import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, MapPin, Plus, Loader2, Target, Move } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Question } from "@shared/schema";

export default function Settings() {
  const { lat, lng } = useGeolocation();
  const { toast } = useToast();
  
  const [timeLimit, setTimeLimit] = useState(30);
  const [checkpointCount, setCheckpointCount] = useState(5);
  const [radius, setRadius] = useState(500);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");

  const settingsQuery = useQuery<{ timeLimit: number; checkpointCount: number; radius: number }>({
    queryKey: ["/api/settings"],
  });

  const questionsQuery = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { timeLimit: number; checkpointCount: number; radius: number }) => {
      return apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved", description: "Your game settings have been updated." });
    },
  });

  const addCheckpointMutation = useMutation({
    mutationFn: async (data: { lat: number; lng: number; questionId: number }) => {
      return apiRequest("POST", "/api/checkpoints/custom", data);
    },
    onSuccess: () => {
      toast({ title: "Checkpoint added", description: "Custom checkpoint created at your location." });
      setSelectedQuestionId("");
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setTimeLimit(settingsQuery.data.timeLimit);
      setCheckpointCount(settingsQuery.data.checkpointCount ?? 5);
      setRadius(settingsQuery.data.radius ?? 500);
    }
  }, [settingsQuery.data]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({ timeLimit, checkpointCount, radius });
  };

  const handleAddCheckpoint = () => {
    if (!lat || !lng) {
      toast({ title: "Location required", description: "Please enable GPS to add a checkpoint.", variant: "destructive" });
      return;
    }
    if (!selectedQuestionId) {
      toast({ title: "Select a question", description: "Please choose a science question for this checkpoint.", variant: "destructive" });
      return;
    }
    addCheckpointMutation.mutate({
      lat,
      lng,
      questionId: parseInt(selectedQuestionId),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Game Rules</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Time Limit: {timeLimit} min</Label>
              </div>
              <Slider
                value={[timeLimit]}
                min={5}
                max={120}
                step={5}
                onValueChange={(val) => setTimeLimit(val[0])}
                data-testid="slider-time-limit"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Checkpoints: {checkpointCount}
                </Label>
              </div>
              <Slider
                value={[checkpointCount]}
                min={1}
                max={20}
                step={1}
                onValueChange={(val) => setCheckpointCount(val[0])}
                data-testid="slider-checkpoint-count"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  <Move className="w-4 h-4" />
                  Spawn Radius: {radius}m
                </Label>
              </div>
              <Slider
                value={[radius]}
                min={10}
                max={2000}
                step={10}
                onValueChange={(val) => setRadius(val[0])}
                data-testid="slider-radius"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="w-full h-12 text-lg font-bold"
            data-testid="button-save-settings"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Game Configuration
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-lg font-bold">Custom Checkpoints</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Add a checkpoint at your current location with a science question.
          </p>

          {lat && lng ? (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="font-mono text-xs">
                Current: {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              GPS location not available
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Question</Label>
            <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
              <SelectTrigger data-testid="select-question">
                <SelectValue placeholder="Choose a question..." />
              </SelectTrigger>
              <SelectContent>
                {questionsQuery.data?.map((q) => (
                  <SelectItem key={q.id} value={String(q.id)}>
                    {q.question.substring(0, 40)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAddCheckpoint}
            disabled={addCheckpointMutation.isPending || !lat || !lng}
            variant="secondary"
            className="w-full"
            data-testid="button-add-checkpoint"
          >
            {addCheckpointMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Checkpoint Here
          </Button>
        </Card>
      </div>
    </div>
  );
}
