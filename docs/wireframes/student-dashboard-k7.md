# TutorKai Student Dashboard - Grades K-7 Wireframe

## Design Overview
Mobile-first responsive web dashboard for younger students (Grades K-7) with age-appropriate interface, simplified navigation, and visual elements designed for developing literacy skills.

## Key Design Principles
- **Visual Learning**: More icons, colors, and visual cues
- **Simplified Language**: Age-appropriate terminology and shorter text
- **Parental Oversight**: Parents can view but not directly access student messages
- **Safety First**: No direct messaging capabilities, all communication through parents
- **Achievement Focus**: Gamification elements to encourage engagement

---

## Dashboard Layout

### Header Section
```
┌─────────────────────────────────────────────────────────┐
│ 🌟 Hi Emma! (Grade 3)    [Trophy: 5] [Streak: 3 days] │
│ Next: Math Fun Time in 2 hours                         │
└─────────────────────────────────────────────────────────┘
```

### Today's Lessons (Horizontal Scroll)
```
┌─────────────────────────────────────────────────────────┐
│ Today's Lessons                                         │
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │    📚     │  │    🔢     │  │    🎨     │          │
│  │ Reading   │  │   Math    │  │   Art     │          │
│  │ 2:00 PM   │  │ 3:30 PM   │  │ 4:00 PM   │          │
│  │ Ms. Smith │  │ Mr. Jones │  │ Ms. Brown │          │
│  └───────────┘  └───────────┘  └───────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Homework & Activities
```
┌─────────────────────────────────────────────────────────┐
│ 📝 My Work                                              │
│                                                         │
│ ┌─ Reading Worksheet ──────────────── ⭐⭐⭐ ─────────┐  │
│ │ Read 3 pages about animals          Due: Tomorrow │  │
│ │ [📄 View] [✅ Mark Done]                          │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌─ Math Practice ──────────────────── ⭐⭐ ────────────┐  │
│ │ Practice addition with pictures     Due: Friday   │  │
│ │ [📄 View] [✏️ Start]                              │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Quick Actions (Large, Visual Buttons)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────┐  │
│  │       📅        │  │       🔄        │  │    ⋯    │  │
│  │                 │  │                 │  │         │  │
│  │  Ask Parent     │  │   Reschedule    │  │  More   │  │
│  │  to Book        │  │                 │  │         │  │
│  │                 │  │                 │  │         │  │
│  └─────────────────┘  └─────────────────┘  └─────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Progress & Achievements
```
┌─────────────────────────────────────────────────────────┐
│ 🏆 My Progress                                          │
│                                                         │
│ This Week: ██████████ 100% (5/5 lessons completed!)    │
│                                                         │
│ 🌟 Recent Achievements:                                 │
│ • 📚 Reading Star (finished 3 books this month)        │
│ • 🔢 Math Wizard (solved 20 problems in a row)         │
│ • ⏰ Always on Time (attended all lessons this week)    │
│                                                         │
│ 🎯 Next Goal: Complete 10 homework assignments → 🏅    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Recent Activities
```
┌─────────────────────────────────────────────────────────┐
│ 📋 What I've Been Doing                                 │
│                                                         │
│ ┌─ Today ────────────────────────────────────────────┐  │
│ │ ✅ Math lesson with Mr. Jones (Great job!)         │  │
│ │ 📝 Finished reading worksheet (A+ work!)           │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ ┌─ Yesterday ─────────────────────────────────────────┐  │
│ │ ✅ Art class with Ms. Brown (Loved your drawing!)  │  │
│ │ 📚 Read 5 pages of "The Magic Tree"                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Bottom Navigation
```
┌─────────────────────────────────────────────────────────┐
│  🏠     📅     📊     👨‍👩‍👧     👤                         │
│ Home  Lessons Progress Family  Profile                   │
└─────────────────────────────────────────────────────────┘
```

---

## Age-Appropriate Differences from Grades 8-12

### Visual Design
- **Larger icons and buttons** for easier touch interaction
- **Bright, cheerful colors** with TutorKai branding accents
- **More white space** to reduce visual clutter
- **Achievement badges and stars** for motivation
- **Simple, friendly language** throughout interface

### Functionality Differences
- **No direct messaging** - "Ask Parent to Book" instead of "Book Session"
- **Simplified homework display** with star ratings instead of complex assignment details
- **Progress gamification** with streaks, trophies, and achievement unlocks
- **Parental notification integration** for all major actions
- **Visual progress bars** instead of detailed analytics

### Content & Language
- **"Lessons" instead of "Sessions"**
- **"My Work" instead of "Assignments & Materials"**
- **"Ask Parent to Book" instead of "Book Session"**
- **"What I've Been Doing" instead of "Recent Activity"**
- **Simple, encouraging feedback** (Great job!, A+ work!, Loved your drawing!)

### Safety Features
- **No direct tutor contact** - all communication routed through parents
- **PIN protection** for profile access
- **Parent oversight indicators** showing what parents can see
- **Safe, supervised environment** with age-appropriate restrictions

---

## Color Scheme
- **Primary Background**: White (#FFFFFF)
- **Text**: Black (#000000)  
- **TutorKai Brand Accents**: Blue (#2563EB) for buttons and highlights
- **Success/Achievement**: Green (#10B981) for completed items
- **Warning**: Orange (#F59E0B) for due items
- **Fun Elements**: Bright, child-friendly colors for icons and badges

---

## Mobile-First Responsive Design
- **Touch-friendly button sizes** (minimum 44px tap targets)
- **Swipe gestures** for lesson carousel
- **Simple navigation** with large, clearly labeled buttons
- **Parent mode toggle** accessible from profile menu
- **Offline capability** for viewing completed work and achievements

This wireframe creates an engaging, safe, and age-appropriate dashboard experience for younger students while maintaining the core functionality needed for effective tutoring management.