import React from "react";
import { IconProps } from "./IconProps";

export const ScienceIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <circle cx={12} cy={12} r={9} />
    <path d="M12 3v18M3 12h18" />
  </svg>
);