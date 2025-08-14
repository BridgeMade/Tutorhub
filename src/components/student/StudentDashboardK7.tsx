import { Bell, MoreHorizontal, BookOpen, Upload, Download, FileText, Calculator, Trophy, Star, Target, Calendar, TrendingUp, Award, CheckCircle, Grid3X3, Microscope } from "lucide-react";
import IconButton from "../IconButton";
import LessonCard from "../LessonCard";
import QuickActionButton from "../QuickActionButton";
import WorkCard from "../WorkCard";

interface StudentDashboardK7Props {
  studentName?: string;
  grade?: string;
  streak?: number;
  trophyCount?: number;
}

const StudentDashboardK7: React.FC<StudentDashboardK7Props> = ({
  studentName = 'Karabo',
}) => {

  return (
    <div className="px-6 py-6 space-y-6 bg-[--tk-surface] min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[24px] leading-8 font-bold tracking-tight text-[--tk-text] mb-3">Hi {studentName}</h1>
          
          {/* Achievement badges */}
          <div className="flex items-center gap-2">
            {/* Trophy pill */}
            <div className="w-10 h-10 rounded-xl bg-[--tk-yellow-400] flex items-center justify-center shadow-[0_4px_12px_rgba(23,42,92,0.12)]">
              <Trophy size={20} className="text-orange-800" />
            </div>
            
            {/* Streak pill */}
            <div className="px-3 py-2 rounded-2xl bg-[--tk-blue-50] flex items-center gap-1 shadow-[0_4px_12px_rgba(23,42,92,0.12)]">
              <Star size={16} className="text-[--tk-blue-600]" />
              <span className="text-[14px] font-bold text-[--tk-blue-600] tracking-tight">3 days</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Icon badges - 36x36 with exact styling */}
          <div className="w-9 h-9 rounded-xl bg-white border border-[--tk-border] shadow-sm flex items-center justify-center">
            <Bell size={20} className="text-[--tk-muted]" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-white border border-[--tk-border] shadow-sm flex items-center justify-center">
            <MoreHorizontal size={20} className="text-[--tk-muted]" />
          </div>
        </div>
      </div>

      {/* Upcoming Lessons with scroll layout */}
      <section>
        <h2 className="text-[18px] leading-tight font-bold text-[--tk-text] mb-2 tracking-tight">Upcoming Lessons</h2>
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
        <h2 className="text-[18px] leading-tight font-bold text-[--tk-text] mb-2 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <QuickActionButton label="Book" icon={<BookOpen size={20} />} />
          <QuickActionButton label="Upload" icon={<Upload size={20} />} />
          <QuickActionButton label="Download" icon={<Download size={20} />} />
          <QuickActionButton label="More" icon={<MoreHorizontal size={20} />} />
        </div>
      </section>

      {/* My Work */}
      <section>
        <h2 className="text-[18px] leading-tight font-bold text-[--tk-text] mb-2 tracking-tight">My Work</h2>
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
            subtitle="worksheet"
            subject="Math: Integers"
            due="Friday"
            icon={<FileText size={20} />}
            cardType="tutoring"
            onView={() => {}}
            onMarkDone={() => {}}
          />
          <WorkCard
            title="School"
            subtitle="Assignment"
            subject="Math: Integers"
            due="Next week"
            icon={<BookOpen size={20} />}
            cardType="assignment"
            onView={() => {}}
            onMarkDone={() => {}}
          />
        </div>
      </section>

      {/* My Progress */}
      <section>
        <h2 className="text-[16px] leading-6 font-semibold text-[--tk-text] mb-5 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[--tk-yellow-400]" />
          My Progress
        </h2>
        <div className="bg-[--tk-card] rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] text-[--tk-muted] font-medium">This week:</span>
            <span className="text-[15px] font-bold text-[--tk-green-500] tracking-tight">80% (4/5 tasks completed!)</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[--tk-border] rounded-full h-3 mb-4">
            <div className="bg-gradient-to-r from-[--tk-green-500] to-[--tk-blue-600] h-3 rounded-full transition-all duration-500" style={{ width: '80%' }}></div>
          </div>

          {/* Achievement badges */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[--tk-yellow-400]" />
              <span className="text-[16px] font-bold text-[--tk-text] tracking-tight">5</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[--tk-orange-500]" />
              <span className="text-[16px] font-bold text-[--tk-text] tracking-tight">3 days</span>
            </div>
          </div>

          {/* Recent Achievements */}
          <div>
            <h4 className="text-[15px] font-bold text-[--tk-text] mb-3 flex items-center gap-2 tracking-tight">
              <Award className="w-5 h-5 text-[--tk-blue-600]" />
              Recent Achievements
            </h4>
            <div className="space-y-2 text-[13px] text-[--tk-muted]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Tutoring: Achieved 80% in your integers mock test</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-blue-500" />
                <span>Schedule: Always on time (attended all lessons this month)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-orange-500" />
                <span>School: 90% for maths semester 2 assignment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Goals */}
      <section>
        <h2 className="text-[18px] leading-7 font-bold text-[--tk-text] mb-5 tracking-tight flex items-center gap-2">
          <Target className="w-5 h-5 text-tk-blue" />
          Next Goals
        </h2>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-tk-border shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-tk-blue" />
            <span className="text-[16px] font-bold text-[--tk-text] tracking-tight">Complete 10 homework assignments</span>
          </div>
          <p className="text-[14px] text-tk-muted ml-9 font-medium">You're doing great! Just 6 more to go.</p>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-[18px] leading-7 font-bold text-[--tk-text] mb-5 tracking-tight">Recent Activity</h2>
        <div className="space-y-4">
          <div className="bg-[--tk-card] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-bold text-[--tk-text] tracking-tight">You completed the math integers worksheet</p>
                <p className="text-[14px] text-tk-muted mt-1 font-medium">2 hours ago</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[--tk-card] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-bold text-[--tk-text] tracking-tight">You earned a gold star for reading!</p>
                <p className="text-[14px] text-tk-muted mt-1 font-medium">Yesterday</p>
              </div>
            </div>
          </div>

          <div className="bg-[--tk-card] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-tk-blue" />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-bold text-[--tk-text] tracking-tight">Attended Math lesson with Ms. Sarah</p>
                <p className="text-[14px] text-tk-muted mt-1 font-medium">Yesterday at 3:30 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="pb-6"></div>
    </div>
  );
};

export default StudentDashboardK7;