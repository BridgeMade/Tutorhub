import React from "react";
import { IconProps } from "./IconProps";

export const IconTrophy: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.25}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 9v6a6 6 0 0 0 12 0V9M6 9h12" />
    <path d="M12 16v5" />
    <path d="M8 21h8" />
  </svg>
);