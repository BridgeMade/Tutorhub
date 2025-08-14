import React from "react";

export default function IconProgress({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17h2v-6H3v6zm8 0h2V7h-2v10zm8 0h2v-3h-2v3z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}