import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Generate random checkpoints
  app.post(api.game.generate.path, async (req, res) => {
    try {
      const { lat, lng, radius, count } = api.game.generate.input.parse(req.body);
      
      const randomQuestions = await storage.getRandomQuestions(count);
      
      const checkpoints = randomQuestions.map(q => {
        // Generate random offset within radius (approximate conversion)
        // 1 deg lat ~ 111km. 1m ~ 1/111000 deg.
        const r = radius / 111000;
        const u = Math.random();
        const v = Math.random();
        const w = r * Math.sqrt(u);
        const t = 2 * Math.PI * v;
        const x = w * Math.cos(t);
        const y = w * Math.sin(t); // adjust for longitude shrinkage if needed but for small radius simple is fine
        
        // Simple flat earth approx for small radius is sufficient for a game
        const newLat = lat + x;
        const newLng = lng + y / Math.cos(lat * Math.PI / 180);

        return {
          id: q.id,
          lat: newLat,
          lng: newLng,
          question: q.question,
          options: q.options,
          points: q.points,
          collected: false
        };
      });

      res.json(checkpoints);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Verify Answer
  app.post(api.game.verify.path, async (req, res) => {
    try {
      const { questionId, answer } = api.game.verify.input.parse(req.body);
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const isCorrect = question.answer.toLowerCase() === answer.toLowerCase();
      
      res.json({
        correct: isCorrect,
        points: isCorrect ? question.points : 0,
        message: isCorrect ? "Correct! +10 points" : "Incorrect. Try again!",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed Data if empty
  const existing = await storage.getAllQuestions();
  if (existing.length === 0) {
    const seedQuestions = [
      {
        question: "What is the chemical symbol for Gold?",
        answer: "Au",
        options: ["Au", "Ag", "Fe", "Cu"],
        points: 10,
        difficulty: "easy"
      },
      {
        question: "Which planet is known as the Red Planet?",
        answer: "Mars",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        points: 10,
        difficulty: "easy"
      },
      {
        question: "What is the powerhouse of the cell?",
        answer: "Mitochondria",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"],
        points: 15,
        difficulty: "medium"
      },
      {
        question: "What gas do plants absorb from the atmosphere?",
        answer: "Carbon Dioxide",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        points: 10,
        difficulty: "easy"
      },
      {
        question: "How many bones are in the adult human body?",
        answer: "206",
        options: ["206", "208", "210", "205"],
        points: 20,
        difficulty: "hard"
      }
    ];
    
    for (const q of seedQuestions) {
      await storage.createQuestion(q);
    }
  }

  return httpServer;
}
