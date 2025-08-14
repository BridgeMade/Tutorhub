import React from "react";
import { IconProps } from "./IconProps";

export const AccountingIcon: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <rect x={3} y={4} width={18} height={16} rx={2} />
    <line x1={8} y1={10} x2={16} y2={10} />
    <line x1={8} y1={14} x2={16} y2={14} />
  </svg>
);