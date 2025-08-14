import { Bell, MoreHorizontal, BookOpen, Upload, Download, FileText, Calculator, Grid3X3, Microscope } from "lucide-react";
import IconButton from "../components/IconButton";
import LessonCard from "../components/LessonCard";
import QuickActionButton from "../components/QuickActionButton";
import WorkCard from "../components/WorkCard";

export default function HomeScreen() {
  return (
    <div className="px-6 py-5 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] leading-7 font-semibold text-gray-900">Hi Karabo</h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={<Bell size={20} className="text-gray-600" />} />
          <IconButton icon={<MoreHorizontal size={20} className="text-gray-600" />} />
        </div>
      </div>

      {/* Upcoming Lessons with scroll layout */}
      <section>
        <h2 className="text-[16px] leading-6 font-semibold text-gray-900 mb-4">Upcoming Lessons</h2>
        <div className="overflow-x-auto snap-x snap-mandatory pr-6 -mr-6 scrollbar-hide pb-2">
          <div className="flex gap-4">
          <LessonCard
            subject="Mathematics"
            topic="Exponents"
            tutor="Natsisana"
            time="2:00 PM"
            icon={<Grid3X3 size={20} />}
            onView={() => {}}
            onMessage={() => {}}
          />
          <LessonCard
            subject="Science"
            topic="Biology"
            tutor="Sarah"
            time="4:00 PM"
            icon={<Microscope size={20} />}
            onView={() => {}}
            onMessage={() => {}}
          />
          <LessonCard
            subject="English"
            topic="Reading"
            tutor="John"
            time="6:00 PM"
            icon={<BookOpen size={20} />}
            onView={() => {}}
            onMessage={() => {}}
          />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-[16px] leading-6 font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          <QuickActionButton label="Book" icon={<BookOpen size={20} />} />
          <QuickActionButton label="Upload" icon={<Upload size={20} />} />
          <QuickActionButton label="Download" icon={<Download size={20} />} />
          <QuickActionButton label="More" icon={<MoreHorizontal size={20} />} />
        </div>
      </section>

      {/* My Work */}
      <section>
        <h2 className="text-[16px] leading-6 font-semibold text-gray-900 mb-4">My Work</h2>
        <div className="space-y-3">
          <WorkCard
            title="School"
            subtitle="Homework"
            subject="Math: Integers"
            due="Tomorrow"
            icon={<Calculator size={20} />}
            cardType="school"
            onView={() => {}}
            onMarkDone={() => {}}
          />
          <WorkCard
            title="Tutoring"
            subtitle="Worksheet"
            subject="Math: Integers"
            due="Friday"
            icon={<FileText size={20} />}
            cardType="tutoring"
            onView={() => {}}
            onMarkDone={() => {}}
          />
        </div>
      </section>
    </div>
  );
}