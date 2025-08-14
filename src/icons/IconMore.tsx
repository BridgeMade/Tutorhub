import React from "react";
import { IconProps } from "./IconProps";

export const IconMore: React.FC<IconProps> = ({ size = 24, className }) => (
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
    <circle cx={12} cy={12} r={1} />
    <circle cx={19} cy={12} r={1} />
    <circle cx={5} cy={12} r={1} />
  </svg>
);