import React from "react";
import IconHome from "../icons/IconHome";
import IconCalendar from "../icons/IconCalendar";
import IconProgress from "../icons/IconProgress";
import IconMessage from "../icons/IconMessage";
import IconProfile from "../icons/IconProfile";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-0 right-0 flex justify-center">
      <div className="bg-white w-[90%] mx-auto rounded-3xl p-3 flex justify-between items-center shadow-tk">
        <div className="flex gap-6 w-full justify-around">
          <div className="flex flex-col items-center text-[var(--tk-blue)]">
            <IconHome className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </div>
          <div className="flex flex-col items-center text-slate-400">
            <IconCalendar className="w-6 h-6" />
            <span className="text-xs">Lessons</span>
          </div>
          <div className="flex flex-col items-center text-slate-400">
            <IconProgress className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </div>
          <div className="flex flex-col items-center text-slate-400">
            <IconMessage className="w-6 h-6" />
            <span className="text-xs">Messages</span>
          </div>
          <div className="flex flex-col items-center text-slate-400">
            <IconProfile className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </div>
        </div>
      </div>
    </nav>
  );
}