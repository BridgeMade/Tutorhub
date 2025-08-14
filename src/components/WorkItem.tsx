import React from "react";
import { MathsIcon } from "../icons";

export default function WorkItem({
  title,
  subtitle,
  due,
  subject,
}: {
  title: string;
  subtitle: string;
  due: string;
  subject?: string;
}) {
  return (
    <div className="tk-card p-4 flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#e6f4ff] flex items-center justify-center">
          <MathsIcon size={20} />
        </div>
        <div>
          <div className="text-base font-semibold text-[var(--tk-ink)]">{title}</div>
          <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="text-sm text-slate-500">{due}</div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[var(--tk-blue)] text-white rounded-md">View</button>
          <button className="px-4 py-2 bg-[var(--tk-green)] text-white rounded-md">Mark done</button>
        </div>
      </div>
    </div>
  );
}