import { FC, ReactNode } from "react";

interface LessonCardProps {
  subject: string;
  topic: string;
  tutor: string;
  time: string;
  icon?: ReactNode;
  onView: () => void;
  onMessage: () => void;
}

const LessonCard: FC<LessonCardProps> = ({
  subject,
  topic,
  tutor,
  time,
  icon,
  onView,
  onMessage,
}) => {
  return (
    <div className="relative w-[292px] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] snap-start overflow-hidden flex-shrink-0 bg-white">
      {/* Orange gradient top panel */}
      <div 
        className="px-4 py-3 rounded-t-2xl relative"
        style={{
          background: 'linear-gradient(180deg, var(--tk-orange-gradient-start) 0%, var(--tk-orange-gradient-end) 100%)'
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-white tracking-tight leading-tight">{subject}</h3>
            <p className="text-[14px] text-white/80 mt-0.5 font-medium">Topic: {topic}</p>
          </div>
          {icon && (
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <div className="text-white opacity-80">
                {icon}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* White bottom panel */}
      <div className="bg-white px-4 py-3 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-[--tk-muted] font-medium">Tutor: {tutor}</span>
          <span className="text-[13px] font-semibold text-[--tk-text] tracking-tight">{time}</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 bg-white border border-[--tk-border] text-[--tk-text] rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-gray-50 transition-colors min-h-[44px] flex items-center justify-center"
          >
            View
          </button>
          <button
            onClick={onMessage}
            className="flex-1 bg-[--tk-green-500] text-white rounded-lg px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center"
          >
            Message tutor
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;