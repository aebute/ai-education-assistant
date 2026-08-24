"use client";

import { useState, useRef } from "react";

interface QuizItem {
  question: string;
  options: string[];
  correct_answer: string;
}

export default function Home() {
  const [inputMaterial, setInputMaterial] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [targetLevel, setTargetLevel] = useState("Elementary / Beginner");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reader" | "quiz">("reader");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState("");
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [reviewTopics, setReviewTopics] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessMaterial = async () => {
    if (!inputMaterial.trim() && !file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("level", targetLevel);

      if (file) {
        formData.append("file", file);
      } else {
        formData.append("text", inputMaterial);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || "");
        setQuizData(data.quiz || []);
        setReviewTopics(data.review_topics || []);
        setSelectedAnswers({});
      }
    } catch (err) {
      console.error("Failed to process material:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">AI Education Assistant</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Level:</span>
          <select
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option>Elementary / Beginner</option>
            <option>Intermediate</option>
            <option>Advanced / Academic</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-slate-200">1. Material Input</h2>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/50 p-6 rounded-lg text-center cursor-pointer transition"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
              />
              <p className="text-xs text-slate-400">
                {file ? (
                  <span className="text-blue-400 font-medium">Selected: {file.name}</span>
                ) : (
                  "Drag and drop PDF/TXT files here, or click to browse"
                )}
              </p>
            </div>

            <div className="text-center text-xs text-slate-500 font-medium">— OR —</div>

            <textarea
              rows={4}
              value={inputMaterial}
              onChange={(e) => setInputMaterial(e.target.value)}
              placeholder="Paste lesson notes, or topic text here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />

            <button
              onClick={handleProcessMaterial}
              disabled={loading || (!inputMaterial.trim() && !file)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-xs transition"
            >
              {loading ? "Processing Material..." : "Process Material"}
            </button>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-slate-200">Learning Gap Tracker</h2>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs">
                  {Object.values(selectedAnswers).filter((ans, idx) => ans === quizData[idx]?.correct_answer).length} Correct
                </span>
                <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded text-xs">
                  {Object.values(selectedAnswers).filter((ans, idx) => ans !== quizData[idx]?.correct_answer).length} Incorrect
                </span>
              </div>
            </div>

            {reviewTopics.length > 0 ? (
              <div className="space-y-2">
                {reviewTopics.map((topic, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-yellow-400 text-xs">{topic}</span>
                    <span className="px-2 py-1 text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/50 rounded">
                      Review Needed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No review topics identified yet. Upload material above to generate.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
          <div className="flex border-b border-slate-800 mb-4">
            <button
              onClick={() => setActiveTab("reader")}
              className={`pb-2 px-4 text-xs font-medium ${
                activeTab === "reader" ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-400"
              }`}
            >
              Simplified Reader
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`pb-2 px-4 text-xs font-medium ${
                activeTab === "quiz" ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-400"
              }`}
            >
              Quiz & Flashcards
            </button>
          </div>

          {activeTab === "reader" ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Key Takeaways ({targetLevel})
              </h3>
              {summary ? (
                <div className="p-4 bg-slate-950 rounded-lg text-slate-300 text-xs whitespace-pre-wrap border border-slate-800 leading-relaxed">
                  {summary}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Upload a PDF document or paste study notes, then click Process Material.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {quizData.length > 0 ? (
                quizData.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <p className="text-xs font-medium text-slate-200">{q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === opt;
                        const isCorrect = opt === q.correct_answer;
                        let btnStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800";

                        if (isSelected) {
                          btnStyle = isCorrect
                            ? "bg-emerald-950 border-emerald-700 text-emerald-200"
                            : "bg-rose-950 border-rose-800 text-rose-200";
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectOption(qIdx, opt)}
                            className={`w-full text-left text-xs p-2.5 rounded-lg border transition ${btnStyle}`}
                          >
                            {opt} {isSelected && (isCorrect ? " ✓ (Correct)" : " ✗")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No quiz questions generated yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}