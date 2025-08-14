import { FC, ReactNode } from "react";

interface QuickActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

const QuickActionButton: FC<QuickActionButtonProps> = ({
  label,
  icon,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center bg-[--tk-card] text-black px-3 py-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 min-h-[72px] active:scale-95"
    >
      <div className="w-6 h-6 flex items-center justify-center mb-2 text-black">
        {icon}
      </div>
      <span className="text-[14px] font-medium leading-none tracking-tight">{label}</span>
    </button>
  );
};

export default QuickActionButton;