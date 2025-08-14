import React from "react";

export default function ProgressCard({ percent = 50 }: { percent?: number }) {
  return (
    <div className="tk-card p-4">
      <div className="text-sm text-slate-600 mb-3">This week: {percent}% ({Math.round(percent/20)}/5) Tasks completed</div>
      <div className="w-full bg-slate-100 rounded-full h-3">
        <div className="bg-[var(--tk-green)] h-3 rounded-full" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="text-lg">🏆</div>
        <div>
          <div className="text-sm font-semibold text-[var(--tk-ink)]">Recent Achievements</div>
          <div className="text-xs text-slate-500">Tutoring: Achieved 80% in your integers mock test</div>
        </div>
      </div>
    </div>
  );
}