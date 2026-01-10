import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type GenerateGameRequest, type VerifyAnswerRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// We primarily use local state for the game loop, but use mutations for API interactions
// The game state itself is managed in a context or component state, 
// but here are the server interactions.

export function useGenerateGame() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (location: GenerateGameRequest) => {
      const res = await fetch(api.game.generate.path, {
        method: api.game.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate game");
      }
      
      return api.game.generate.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Mission Failed!",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useVerifyAnswer() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: VerifyAnswerRequest) => {
      const res = await fetch(api.game.verify.path, {
        method: api.game.verify.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Verification failed");
      }
      
      return api.game.verify.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Uh oh!",
        description: "Something went wrong checking your answer.",
        variant: "destructive",
      });
    }
  });
}
