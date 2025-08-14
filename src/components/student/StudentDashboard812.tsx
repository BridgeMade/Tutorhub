import React, { useState } from 'react';
import { Calendar, BookOpen, MessageCircle, TrendingUp, User, Clock, FileText, Download, Upload, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { 
  MdPictureAsPdf, 
  MdVideoLibrary, 
  MdLink, 
  MdRefresh, 
  MdMoreHoriz,
  MdSchedule,
  MdUpload,
  MdDownload
} from 'react-icons/md';

interface UpcomingLesson {
  id: string;
  subject: string;
  time: string;
  tutor: string;
  duration: string;
  type: 'online' | 'in-person';
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
}

interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link';
  subject: string;
  uploadedBy: string;
  date: string;
}

interface RecentActivity {
  id: string;
  type: 'session' | 'assignment' | 'message' | 'material';
  title: string;
  description: string;
  time: string;
  subject?: string;
}

interface StudentDashboard812Props {
  studentName: string;
  grade: string;
}

const StudentDashboard812: React.FC<StudentDashboard812Props> = ({
  studentName = 'Sophia',
  grade = '8'
}) => {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [assignmentFilter, setAssignmentFilter] = useState<'All' | 'School' | 'Tutor'>('All');
  const [activityFilter, setActivityFilter] = useState<'All' | 'Sessions' | 'Homework'>('All');
  
  const [upcomingLessons] = useState<UpcomingLesson[]>([
    {
      id: '1',
      subject: 'Biology',
      time: '3 hours',
      tutor: 'Dr. Williams',
      duration: '1 hour',
      type: 'online'
    },
    {
      id: '2',
      subject: 'Mathematics',
      time: 'Tomorrow 2:00 PM',
      tutor: 'Ms. Rodriguez',
      duration: '1 hour',
      type: 'in-person'
    },
    {
      id: '3',
      subject: 'English Literature',
      time: 'Friday 4:00 PM',
      tutor: 'Mr. Thompson',
      duration: '1.5 hours',
      type: 'online'
    }
  ]);

  const [assignments] = useState<(Assignment & { source: 'School' | 'Tutor' })[]>([
    {
      id: '1',
      title: 'Cell Structure Report',
      subject: 'Biology',
      dueDate: 'Tomorrow',
      status: 'pending',
      source: 'School'
    },
    {
      id: '2',
      title: 'Algebra Problem Set 5',
      subject: 'Mathematics',
      dueDate: 'Friday',
      status: 'submitted',
      source: 'Tutor'
    },
    {
      id: '3',
      title: 'Shakespeare Essay',
      subject: 'English',
      dueDate: 'Next Week',
      status: 'graded',
      grade: 'A-',
      source: 'School'
    },
    {
      id: '4',
      title: 'Mock Test - Calculus',
      subject: 'Mathematics',
      dueDate: 'Monday',
      status: 'pending',
      source: 'Tutor'
    }
  ]);

  const [materials] = useState<Material[]>([
    {
      id: '1',
      name: 'Cell Biology Notes.pdf',
      type: 'pdf',
      subject: 'Biology',
      uploadedBy: 'Dr. Williams',
      date: 'Yesterday'
    },
    {
      id: '2',
      name: 'Quadratic Equations Video',
      type: 'video', 
      subject: 'Mathematics',
      uploadedBy: 'Ms. Rodriguez',
      date: '2 days ago'
    }
  ]);

  const [recentActivities] = useState<(RecentActivity & { category: 'Sessions' | 'Homework' | 'Materials' })[]>([
    {
      id: '1',
      type: 'session',
      title: 'Biology session completed',
      description: 'Excellent understanding of cellular respiration!',
      time: '2 hours ago',
      subject: 'Biology',
      category: 'Sessions'
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Math homework submitted',
      description: 'Algebra Problem Set 4 turned in on time',
      time: '1 day ago',
      subject: 'Mathematics',
      category: 'Homework'
    },
    {
      id: '3',
      type: 'material',
      title: 'New mock test available',
      description: 'Calculus Mock Test downloaded',
      time: '1 day ago',
      subject: 'Mathematics',
      category: 'Materials'
    },
    {
      id: '4',
      type: 'material',
      title: 'New study materials shared',
      description: 'Cell Biology Notes.pdf uploaded by Dr. Williams',
      time: '2 days ago',
      subject: 'Biology',
      category: 'Materials'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Calendar className="w-4 h-4 text-[--tk-blue-600]" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-[--tk-green-500]" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'material':
        return <BookOpen className="w-4 h-4 text-[--tk-orange-gradient-start]" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <MdPictureAsPdf size={20} />;
      case 'video':
        return <MdVideoLibrary size={20} />;
      case 'link':
        return <MdLink size={20} />;
      default:
        return <MdPictureAsPdf size={20} />;
    }
  };

  // Filter functions
  const filteredAssignments = assignments.filter(assignment => 
    assignmentFilter === 'All' || assignment.source === assignmentFilter
  );

  const filteredActivities = recentActivities.filter(activity => 
    activityFilter === 'All' || activity.category === activityFilter
  );

  const nextCarousel = () => {
    setCurrentCarouselIndex((prev) => 
      prev === upcomingLessons.length - 1 ? 0 : prev + 1
    );
  };

  const prevCarousel = () => {
    setCurrentCarouselIndex((prev) => 
      prev === 0 ? upcomingLessons.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-black">
              {studentName}
            </h1>
            <p className="text-[16px] text-gray-600 mt-1">
              Grade {grade}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Upcoming Tutoring Sessions */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Upcoming Tutoring Sessions
          </h2>
          
          {/* Two Cards Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Math Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-black">Math</h3>
                  <p className="text-[12px] text-gray-500">Online</p>
                </div>
                <p className="text-[14px] text-gray-600">Ms. Rodriguez</p>
                <p className="text-[14px] text-gray-600">Tomorrow, 3 PM</p>
                
                <div className="pt-2 space-y-2">
                  <button className="w-full text-gray-700 rounded-lg py-2 text-[14px] font-medium" style={{backgroundColor: '#F3F4F6'}}>
                    View
                  </button>
                  <button className="w-full rounded-lg py-2 text-[14px] font-medium" style={{backgroundColor: '#F3F4F6', color: '#2563EB'}}>
                    Message
                  </button>
                </div>
              </div>
            </div>

            {/* Biology Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-black">Biology</h3>
                  <p className="text-[12px] text-gray-500">In-person</p>
                </div>
                <p className="text-[14px] text-gray-600">Dr. Williams</p>
                <p className="text-[14px] text-gray-600">Fri, 2 PM</p>
                
                <div className="pt-2 space-y-2">
                  <button className="w-full text-gray-700 rounded-lg py-2 text-[14px] font-medium" style={{backgroundColor: '#F3F4F6'}}>
                    View
                  </button>
                  <button className="w-full rounded-lg py-2 text-[14px] font-medium" style={{backgroundColor: '#F3F4F6', color: '#2563EB'}}>
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-4 gap-3">
            <button className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100">
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Calendar size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Book
              </span>
            </button>
            
            <button className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100">
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Clock size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Reschedule
              </span>
            </button>
            
            <button className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100">
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Upload size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Upload
              </span>
            </button>
            
            <button className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100">
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Download size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Download
              </span>
            </button>
          </div>
        </div>

        {/* Homework & Assignments */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Homework & Assignments
          </h2>
          
          <div className="space-y-3">
            {/* Cell Structure Report */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black">Cell Structure Report</h3>
                  <p className="text-[14px] text-gray-600">Biology - Biology</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-black">Due tomorrow</p>
              </div>
            </div>

            {/* Algebra Set 5 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black">Algebra Set 5</h3>
                  <p className="text-[14px] text-gray-600">Mathematics - Tutor</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-black">Due Friday</p>
              </div>
            </div>

            {/* Shakespeare Essay */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black">Shakespeare Essay</h3>
                  <p className="text-[14px] text-gray-600">English - English</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-black">Next week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Achievements */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Progress & Achievements
          </h2>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-black mb-2">
                ✔ 80% tasks complete this week
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-[20px]">🏆</span>
                <span className="text-[12px] font-medium text-blue-600">3 Weeks Attendance Streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-black">
              Recent Activity
            </h2>
            <div className="flex gap-2">
              {(['All', 'Sessions', 'Homework'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`text-[13px] rounded-full px-3 py-1 border-none cursor-pointer font-medium transition-all duration-200 active:scale-95 ${
                    activityFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              {/* Biology session completed */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-black">
                    ✔ Biology session completed
                  </div>
                  <div className="text-[14px] text-gray-600">
                    "Excellent understanding of cellular respiration!"
                  </div>
                  <div className="text-[13px] text-blue-600 mt-1">
                    Biology
                  </div>
                </div>
                <div className="text-[13px] text-gray-500">
                  2 hours ago
                </div>
              </div>

              {/* Math homework submitted */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <FileText className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-black">
                    📝 Math homework submitted
                  </div>
                  <div className="text-[14px] text-gray-600">
                    On time submission
                  </div>
                  <div className="text-[13px] text-blue-600 mt-1">
                    Mathematics
                  </div>
                </div>
                <div className="text-[13px] text-gray-500">
                  1 day ago
                </div>
              </div>

              {/* New mock test available */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-black">
                    📄 New mock test available
                  </div>
                  <div className="text-[14px] text-gray-600">
                    Downloaded and ready for practice
                  </div>
                  <div className="text-[13px] text-blue-600 mt-1">
                    Mathematics
                  </div>
                </div>
                <div className="text-[13px] text-gray-500">
                  2 days ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard812;