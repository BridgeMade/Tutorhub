import React from "react";

export default function IconCalendar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="18" rx="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
      <path d="M7 2v4M17 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}