import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  options: jsonb("options").$type<string[]>().notNull(), // Multiple choice options
  points: integer("points").notNull().default(10),
  difficulty: text("difficulty").notNull().default("easy"),
});

export const insertQuestionSchema = createInsertSchema(questions);
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

// Types for the game logic (not stored in DB for this simple version, but shared)
export const checkpointSchema = z.object({
  id: z.number(), // maps to question id
  lat: z.number(),
  lng: z.number(),
  question: z.string(),
  options: z.array(z.string()),
  points: z.number(),
  collected: z.boolean().optional(),
});

export type Checkpoint = z.infer<typeof checkpointSchema>;

export const verifyAnswerSchema = z.object({
  questionId: z.number(),
  answer: z.string(),
});

export type VerifyAnswerRequest = z.infer<typeof verifyAnswerSchema>;
