import { openDB, DBSchema } from "idb";

interface EduDB extends DBSchema {
  lessons: {
    key: string;
    value: { id: string; title: string; content: string; level: string };
  };
  quizResults: {
    key: number;
    value: { id?: number; quizId: string; correct: boolean; timestamp: number; synced: boolean };
    autoIncrement: true;
  };
}

const DB_NAME = "edu-assistant-db";

export async function initDB() {
  return openDB<EduDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("lessons")) {
        db.createObjectStore("lessons", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("quizResults")) {
        db.createObjectStore("quizResults", { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function cacheLesson(lesson: { id: string; title: string; content: string; level: string }) {
  const db = await initDB();
  await db.put("lessons", lesson);
}

export async function saveQuizResultLocally(quizId: string, correct: boolean) {
  const db = await initDB();
  await db.add("quizResults", {
    quizId,
    correct,
    timestamp: Date.now(),
    synced: false,
  });
}
