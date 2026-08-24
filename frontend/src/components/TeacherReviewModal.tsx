"use client";

import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
}

export default function TeacherReviewModal({ isOpen, onClose, onAuthenticate }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default demo PIN: 1234
    if (pin === "1234") {
      setError(false);
      setPin("");
      onAuthenticate();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-bold text-slate-100">Teacher / Guardian Access</h3>
        <p className="text-xs text-slate-400">
          Enter your 4-digit PIN to access instructor controls and progress reviews. (Default demo PIN: <code className="text-blue-400">1234</code>)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-center text-lg tracking-widest text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-xs text-rose-400 text-center">Incorrect PIN. Try 1234.</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition-colors"
            >
              Unlock Mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
