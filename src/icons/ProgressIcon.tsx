import React from "react";
import { IconProps } from "./IconProps";

export const ProgressIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <path d="M3 17h2v-6H3v6zm8 0h2V7h-2v10zm8 0h2v-3h-2v3z" />
  </svg>
);