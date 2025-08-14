import React from "react";
import IconCalendar from "../icons/IconCalendar";
import IconUpload from "../icons/IconUpload";
import IconDownload from "../icons/IconDownload";
import { IconMore } from "../icons";

const iconMap: Record<string, React.FC<any>> = {
  calendar: IconCalendar,
  upload: IconUpload,
  download: IconDownload,
  more: IconMore,
};

export default function QuickAction({ label, iconKey }: { label: string; iconKey: string }) {
  const Icon = iconMap[iconKey] || IconMore;
  return (
    <button className="flex-1 bg-[var(--tk-blue)] text-white p-4 rounded-xl flex flex-col items-center gap-2 shadow-tkSoft">
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}