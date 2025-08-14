import React from "react";
import { IconProps } from "./IconProps";

export const BusinessStudiesIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <path d="M4 4h16v4H4zM4 12h10v8H4zM16 12h4v8h-4z" />
  </svg>
);