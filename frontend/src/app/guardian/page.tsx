"use client";

import React from "react";
import Link from "next/link";

export default function GuardianSummaryPage() {
  const summaryData = {
    studentName: "Alex Johnson",
    recentPerformance: [
      { id: 1, title: "Cellular Respiration Quiz", score: "80%", date: "2026-08-23" },
      { id: 2, title: "Photosynthesis Basics", score: "90%", date: "2026-08-22" },
      { id: 3, title: "DNA Replication", score: "60%", date: "2026-08-20" },
    ],
    weakConcepts: ["Cellular Respiration - Phase 2", "Enzyme Kinetics"],
    completedModules: ["Introduction to Biology", "Plant Physiology"],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-400">Guardian Summary Portal</h1>
            <p className="text-sm text-slate-400">Student Progress Overview: {summaryData.studentName}</p>
          </div>
          <Link
            href="/"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            ← Return to Dashboard
          </Link>
        </div>

        {/* Quiz Performance Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-md font-semibold text-slate-200">Recent Quiz Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Quiz Module</th>
                  <th className="p-2.5">Score</th>
                  <th className="p-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {summaryData.recentPerformance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="p-2.5 font-medium text-slate-200">{item.title}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{item.score}</td>
                    <td className="p-2.5 text-slate-400">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Weak Concepts & Completed Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-md font-semibold text-rose-400">Identified Weak Concepts</h2>
            <ul className="space-y-2">
              {summaryData.weakConcepts.map((concept, idx) => (
                <li key={idx} className="text-xs bg-rose-950/40 border border-rose-900/50 text-rose-200 p-2.5 rounded-lg">
                  {concept}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-md font-semibold text-emerald-400">Completed Modules</h2>
            <ul className="space-y-2">
              {summaryData.completedModules.map((mod, idx) => (
                <li key={idx} className="text-xs bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 p-2.5 rounded-lg">
                  ✓ {mod}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
