"use client";

import { useState } from "react";

interface QuizItem {
  question: str;
  options: string[];
  correct_answer: string;
}

export default function Home() {
  const [inputMaterial, setInputMaterial] = useState("");
  const [targetLevel, setTargetLevel] = useState("Elementary / Beginner");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reader" | "quiz">("reader");

  // Dynamic state replacing placeholders
  const [summary, setSummary] = useState("");
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [reviewTopics, setReviewTopics] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const handleProcessMaterial = async () => {
    if (!inputMaterial.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputMaterial,
          level: targetLevel,
        }),
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
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">AI Education Assistant</h1>
        <select
          value={targetLevel}
          onChange={(e) => setTargetLevel(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-sm rounded-lg p-2 text-slate-200"
        >
          <option>Elementary / Beginner</option>
          <option>Intermediate</option>
          <option>Advanced / Academic</option>
        </select>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input & Learning Gaps */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <h2 className="text-lg font-semibold mb-3 text-slate-200">1. Material Input</h2>
            <textarea
              rows={6}
              value={inputMaterial}
              onChange={(e) => setInputMaterial(e.target.value)}
              placeholder="Paste lesson notes, study guides, or topic text here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleProcessMaterial}
              disabled={loading || !inputMaterial.trim()}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? "Processing Material..." : "Process Material"}
            </button>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
            <h2 className="text-lg font-semibold mb-3 text-slate-200">Learning Gap Tracker</h2>
            {reviewTopics.length > 0 ? (
              <div className="space-y-2">
                {reviewTopics.map((topic, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-yellow-400 text-sm">{topic}</span>
                    <span className="px-2 py-1 text-xs bg-amber-950/80 text-amber-300 border border-amber-800/50 rounded">
                      Review Needed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No review topics generated yet. Upload text and click process.</p>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Outputs */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
          <div className="flex border-b border-slate-800 mb-4">
            <button
              onClick={() => setActiveTab("reader")}
              className={`pb-2 px-4 text-sm font-medium ${
                activeTab === "reader" ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-400"
              }`}
            >
              Simplified Reader
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`pb-2 px-4 text-sm font-medium ${
                activeTab === "quiz" ? "border-b-2 border-blue-500 text-blue-400" : "text-slate-400"
              }`}
            >
              Quiz & Flashcards
            </button>
          </div>

          {activeTab === "reader" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Key Takeaways ({targetLevel})
              </h3>
              {summary ? (
                <div className="p-4 bg-slate-950 rounded-lg text-slate-300 text-sm whitespace-pre-wrap border border-slate-800">
                  {summary}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Upload study notes to view generated summaries here.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {quizData.length > 0 ? (
                quizData.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <p className="text-sm font-medium text-slate-200">{q.question}</p>
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
                <p className="text-xs text-slate-500">No quiz available. Process material to generate questions.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
