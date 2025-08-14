import { FC, ReactNode } from "react";

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
}

const IconButton: FC<IconButtonProps> = ({ icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center shadow-sm transition-colors"
    >
      {icon}
    </button>
  );
};

export default IconButton;