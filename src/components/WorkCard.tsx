import { FC, ReactNode } from "react";

interface WorkCardProps {
  title: string;
  subtitle: string;
  subject: string;
  due: string;
  icon: ReactNode;
  cardType: "school" | "tutoring" | "assignment";
  onView: () => void;
  onMarkDone: () => void;
}

const WorkCard: FC<WorkCardProps> = ({
  title,
  subtitle,
  subject,
  due,
  icon,
  cardType,
  onView,
  onMarkDone,
}) => {
  // Get gradient classes based on card type
  const getGradientClasses = (type: string) => {
    switch (type) {
      case "school":
        return "bg-blue-50 text-tk-blue";
      case "tutoring":
        return "bg-green-50 text-green-600";
      case "assignment":
        return "bg-orange-50 text-tk-orange";
      default:
        return "bg-blue-50 text-tk-blue";
    }
  };

  return (
    <div className="flex items-start gap-4 bg-[--tk-card] rounded-2xl border border-tk-border shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-5">
      {/* Icon tile */}
      <div className={`w-10 h-10 rounded-2xl ${getGradientClasses(cardType)} flex items-center justify-center shadow flex-shrink-0`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Title section with due date */}
        <div className="flex items-start justify-between mb-2">
          <div className="text-[16px] font-bold leading-5 text-[--tk-text] tracking-tight">
            {title}: {subtitle}
          </div>
          <div className="text-[13px] text-[--tk-muted] ml-4 flex-shrink-0 font-medium">
            Due: <span className="text-[--tk-text] font-bold">{due}</span>
          </div>
        </div>
        
        {/* Subject info */}
        <div className="text-[14px] text-tk-muted mb-4 font-medium">
          {subject}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onView}
            className="rounded-lg px-4 py-2 text-[13px] font-medium bg-white border border-tk-border text-tk-blue hover:bg-gray-50 transition-colors"
          >
            View
          </button>
          <button
            onClick={onMarkDone}
            className="rounded-lg px-4 py-2 text-[13px] font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Mark done
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkCard;