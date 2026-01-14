import { storage } from "../server/storage";
import { readFileSync } from "fs";
import { join } from "path";

async function seed() {
  try {
    const filePath = join(process.cwd(), "attached_assets/Pasted--question-Which-Great-Lake-borders-the-Upper-Peninsula-_1768359917311.txt");
    const rawData = readFileSync(filePath, "utf-8");
    const questionsData = JSON.parse(rawData);

    console.log(`Found ${questionsData.length} questions. Seeding...`);

    for (const q of questionsData) {
      await storage.createQuestion({
        question: q.question,
        answer: q.answer,
        options: q.choices,
        points: 10,
        difficulty: "easy"
      });
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
