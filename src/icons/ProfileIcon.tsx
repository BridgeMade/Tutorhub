import React from "react";
import { IconProps } from "./IconProps";

export const ProfileIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <circle cx={12} cy={7} r={4} />
    <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
  </svg>
);