import React from "react";
import { IconProps } from "./IconProps";

export const CATIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <rect x={4} y={4} width={16} height={12} rx={2} />
    <line x1={8} y1={20} x2={16} y2={20} />
    <line x1={12} y1={16} x2={12} y2={20} />
  </svg>
);