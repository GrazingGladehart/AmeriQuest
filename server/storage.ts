import { db } from "./db";
import { questions, type Question, type InsertQuestion } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Questions
  getAllQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  getRandomQuestions(count: number): Promise<Question[]>;
}

export class DatabaseStorage implements IStorage {
  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    return await db.select().from(questions).orderBy(sql`RANDOM()`).limit(count);
  }
}

export const storage = new DatabaseStorage();
