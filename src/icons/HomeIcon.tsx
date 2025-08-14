import React from "react";
import { IconProps } from "./IconProps";

export const HomeIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1V9.5z" />
  </svg>
);