"use client";

import React, { useState, useRef } from "react";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { saveQuizResultLocally } from "@/lib/db";
import TeacherReviewModal from "@/components/TeacherReviewModal";

export default function Dashboard() {
  const { isOnline, isSyncing } = useSyncEngine();
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [level, setLevel] = useState("beginner");
  const [activeTab, setActiveTab] = useState<"reader" | "quiz">("reader");
  const [isLoading, setIsLoading] = useState(false);
  const [processedSummary, setProcessedSummary] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Teacher Mode States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [teacherNotes, setTeacherNotes] = useState("");

  const [stats, setStats] = useState({
    correct: 8,
    incorrect: 3,
    reviewTopics: ["Cellular Respiration", "Photosynthesis Phase 2"],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessMaterial = async () => {
    if (!selectedFile && !inputText.trim()) {
      alert("Please upload a PDF or enter study text first.");
      return;
    }

    setIsLoading(true);
    console.log("Initiating document upload/processing...");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();

      formData.append("age_group", level);

      if (selectedFile) {
        formData.append("file", selectedFile, selectedFile.name);
        console.log("Attached file:", selectedFile.name);
      }

      if (inputText.trim()) {
        formData.append("raw_text", inputText.trim());
        console.log("Attached raw text prompt.");
      }

      console.log(`Sending POST request to: ${API_URL}/api/process-document`);

      const response = await fetch(`${API_URL}/api/process-document`, {
        method: "POST",
        body: formData,
      });

      console.log("HTTP Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      console.log("API Success Data:", data);

      if (data.summary) {
        setProcessedSummary(data.summary);
        setActiveTab("reader"); // Auto-switch tab to output on completion
      } else {
        setProcessedSummary("Processing complete, but no summary field was returned.");
      }
    } catch (err: any) {
      console.error("Processing Failed:", err);
      alert(`Error processing material: ${err.message || "Could not connect to backend."}`);
      setProcessedSummary(`Error: ${err.message || "Failed to reach FastAPI backend on http://localhost:8000"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = async (isCorrect: boolean) => {
    await saveQuizResultLocally("question-1", isCorrect);
    setStats((prev) => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
    }));
  };

  const clearReviewTopic = (indexToRemove: number) => {
    setStats((prev) => ({
      ...prev,
      reviewTopics: prev.reviewTopics.filter((_, i) => i !== indexToRemove),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-blue-400">
              AI Education Assistant
            </h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isOnline
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-amber-950 text-amber-400 border border-amber-800"
              }`}
            >
              {isOnline ? (isSyncing ? "Syncing..." : "Online") : "Offline Mode"}
            </span>

            {isTeacherMode && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-950 text-purple-300 border border-purple-800">
                Teacher Mode Active
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="level-select" className="text-sm font-medium text-slate-300">
                Target Level:
              </label>
              <select
                id="level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Elementary / Beginner</option>
                <option value="intermediate">Intermediate / High School</option>
                <option value="advanced">Advanced / University</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (isTeacherMode) {
                  setIsTeacherMode(false);
                } else {
                  setIsModalOpen(true);
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                isTeacherMode
                  ? "bg-purple-900/40 border-purple-700 text-purple-200 hover:bg-purple-800/50"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isTeacherMode ? "Exit Teacher Mode" : "Teacher Access"}
            </button>
          </div>
        </header>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="xl:col-span-5 space-y-6">
            {/* 1. Material Input */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-200">
                1. Material Input
              </h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-900/50"
              >
                <p className="text-sm text-slate-400">
                  {selectedFile ? (
                    <span className="text-blue-400 font-medium">{selectedFile.name}</span>
                  ) : (
                    <>
                      Drag and drop PDF files here, or{" "}
                      <span className="text-blue-400 font-medium">browse</span>
                    </>
                  )}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="text-center text-xs text-slate-500 font-mono">— OR —</div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste lesson notes or raw text here..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
              />

              <button
                onClick={handleProcessMaterial}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium py-2 rounded-lg transition-colors text-sm"
              >
                {isLoading ? "Processing Material..." : "Process Material"}
              </button>
            </section>

            {/* 4. Learning Gap Tracker */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-200">
                  4. Learning Gap Tracker
                </h2>
                {isTeacherMode && (
                  <span className="text-[10px] text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    Edit Rights Granted
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-3 text-center">
                  <span className="block text-2xl font-bold text-emerald-400">
                    {stats.correct}
                  </span>
                  <span className="text-xs text-slate-400">Correct Answers</span>
                </div>
                <div className="bg-rose-950/40 border border-rose-800/50 rounded-lg p-3 text-center">
                  <span className="block text-2xl font-bold text-rose-400">
                    {stats.incorrect}
                  </span>
                  <span className="text-xs text-slate-400">Incorrect Answers</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Topics Needing Review
                </h3>
                {stats.reviewTopics.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No topics currently flagged.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {stats.reviewTopics.map((topic, i) => (
                      <li
                        key={i}
                        className="text-xs bg-slate-800 text-amber-300 px-3 py-1.5 rounded-md flex items-center justify-between"
                      >
                        <span>{topic}</span>
                        {isTeacherMode ? (
                          <button
                            onClick={() => clearReviewTopic(i)}
                            className="text-[10px] bg-rose-950 hover:bg-rose-900 text-rose-300 px-2 py-0.5 rounded border border-rose-800 transition-colors"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                            Review Needed
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isTeacherMode && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    Guardian Notes & Remarks
                  </h3>
                  <textarea
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    placeholder="Add manual feedback or study instructions for student..."
                    rows={2}
                    className="w-full bg-slate-950 border border-purple-900/50 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
                  />
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-7">
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[500px] flex flex-col">
              <div className="flex border-b border-slate-800 mb-4">
                <button
                  onClick={() => setActiveTab("reader")}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === "reader"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Simplified Reader
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`pb-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === "quiz"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Quiz & Flashcards
                </button>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-5">
                {activeTab === "reader" ? (
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-300 border-b border-slate-800/80 pb-2">
                      Key Takeaways ({level.toUpperCase()})
                    </h3>

                    {processedSummary ? (
                      <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                        {processedSummary}
                      </div>
                    ) : (
                      <ul className="list-disc list-inside text-sm text-slate-400 space-y-2 pt-2">
                        <li>Upload a PDF document or paste study notes, then click Process Material.</li>
                        <li>Extracted concepts and summary guides will render here automatically.</li>
                      </ul>
                    )}

                    {teacherNotes && (
                      <div className="mt-4 p-3 bg-purple-950/30 border border-purple-800/50 rounded-lg">
                        <span className="text-xs font-bold text-purple-300 block mb-1">
                          Instructor Note:
                        </span>
                        <p className="text-xs text-purple-200">{teacherNotes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <p className="text-sm font-medium text-slate-200 mb-3">
                        Sample Question: What is the primary function of the mitochondrion?
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAnswerSelect(false)}
                          className="w-full text-left text-xs p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Protein Synthesis
                        </button>
                        <button
                          onClick={() => handleAnswerSelect(true)}
                          className="w-full text-left text-xs p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          ATP Production (Correct)
                        </button>
                        <button
                          onClick={() => handleAnswerSelect(false)}
                          className="w-full text-left text-xs p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          DNA Storage
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <TeacherReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAuthenticate={() => {
          setIsTeacherMode(true);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
