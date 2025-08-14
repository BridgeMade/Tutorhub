import React from "react";
import { IconProps } from "./IconProps";

export const IconFlame: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38.5-2 1-3 .5.92 1.5 2 1.5 3a2.5 2.5 0 0 0 2.5 2.5c0 3.08-2.42 5.5-5.5 5.5s-5.5-2.42-5.5-5.5a2.5 2.5 0 0 0 3.5-2z" />
    <path d="M12 5c0 1.5-.5 2.5-2 3 1.5.5 2 1.5 2 3" />
  </svg>
);