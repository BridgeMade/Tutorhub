import React from "react";

export default function IconProfile({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx={12} cy={7} r={4} stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 21a8.38 8.38 0 0 1 13 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}