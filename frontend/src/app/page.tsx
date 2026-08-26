"use client";

import { useState } from "react";

export default function Home() {
  const [targetLevel, setTargetLevel] = useState<string>("Adult/Higher Ed");
  const [file, setFile] = useState<File | null>(null);
  const [inputMaterial, setInputMaterial] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [quizData, setQuizData] = useState<any[]>([]);
  const [reviewTopics, setReviewTopics] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const handleProcessMaterial = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Pass age_group key to match backend FastAPI requirements
      formData.append("age_group", targetLevel);

      // Pass file or wrap pasted text into a File Blob
      if (file) {
        formData.append("file", file);
      } else if (inputMaterial.trim()) {
        const textBlob = new Blob([inputMaterial], { type: "text/plain" });
        formData.append("file", textBlob, "pasted_notes.txt");
      } else {
        alert("Please upload a file or paste study material.");
        setLoading(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ai-education-backend-9pwn.onrender.com";
      const res = await fetch(`${baseUrl}/api/process-document`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Server error processing document");
      }

      const data = await res.json();
      setSummary(data.summary || "");
      setQuizData(data.quiz || []);
      setReviewTopics(data.key_points || []);
      setSelectedAnswers({});
    } catch (err: any) {
      console.error("Failed to process material:", err);
      alert(err.message || "Failed to process document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">AI Education Assistant</h1>

        {/* Input Section */}
        <div className="p-6 bg-slate-800 rounded-xl space-y-4">
          <h2 className="text-xl font-semibold">1. Material Input</h2>

          <div>
            <label className="block mb-2 text-sm font-medium">Target Level:</label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full p-2 bg-slate-700 rounded text-white"
            >
              <option value="Primary (Ages 6-10)">Primary (Ages 6-10)</option>
              <option value="Secondary (Ages 11-16)">Secondary (Ages 11-16)</option>
              <option value="Adult/Higher Ed">Adult/Higher Ed</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Upload Document (.pdf, .txt):</label>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 bg-slate-700 rounded text-white"
            />
          </div>

          <div className="text-center text-sm text-slate-400">— OR —</div>

          <div>
            <label className="block mb-2 text-sm font-medium">Paste Text Material:</label>
            <textarea
              rows={5}
              value={inputMaterial}
              onChange={(e) => setInputMaterial(e.target.value)}
              placeholder="Paste lesson notes or topic text here..."
              className="w-full p-2 bg-slate-700 rounded text-white"
            />
          </div>

          <button
            onClick={handleProcessMaterial}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold disabled:opacity-50"
          >
            {loading ? "Processing Material..." : "Process Material"}
          </button>
        </div>

        {/* Results Display */}
        {summary && (
          <div className="p-6 bg-slate-800 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold">Summary & Key Points</h2>
            <p className="text-slate-300">{summary}</p>
            {reviewTopics.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Key Takeaways:</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {reviewTopics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
