# TutorKai Design System

## Overview

The TutorKai Design System is a comprehensive set of design tokens, components, and guidelines that ensure consistency across all user interfaces. It's built with accessibility, mobile-first design, and age-appropriate experiences in mind.

## Core Principles

### 1. Student/Parent-Centric Design
- **Age-Appropriate**: Different visual treatments for K-7 vs 8-12 students
- **Family-Friendly**: Clean, approachable design that parents trust
- **Safety First**: Clear visual hierarchy and safe interaction patterns

### 2. Accessibility First
- **WCAG 2.1 AA Compliant**: All components meet accessibility standards
- **Touch-Friendly**: Minimum 44px touch targets on all interactive elements
- **High Contrast Support**: Adapts to user preferences
- **Reduced Motion**: Respects user motion preferences

### 3. Mobile-First
- **Progressive Enhancement**: Designed for mobile, enhanced for desktop
- **Touch Gestures**: Swipe, tap, and gesture-friendly interfaces
- **Responsive**: Fluid layouts that work on any screen size

---

## Color System

### Brand Colors

#### Primary Blue
- **Main Brand**: `#2563eb` - Used for primary actions, links, and brand elements
- **Light Variant**: `#3b82f6` - Used for hover states and secondary actions
- **Dark Variant**: `#1d4ed8` - Used for pressed states and emphasis

#### Secondary Gray
- **Text Primary**: `#0f172a` - Primary text color
- **Text Secondary**: `#334155` - Secondary text and descriptions
- **Border**: `#e2e8f0` - Borders and dividers
- **Background**: `#f8fafc` - Background surfaces

### Age-Specific Colors

#### Kids (K-7)
- **Primary**: `#60a5fa` (Bright, friendly blue)
- **Secondary**: `#a78bfa` (Playful purple)
- **Accent**: `#34d399` (Encouraging green)
- **Background**: `#f0f9ff` (Soft blue background)

#### Teen (8-12)
- **Primary**: `#2563eb` (Professional blue)
- **Secondary**: `#7c3aed` (Mature purple)
- **Accent**: `#059669` (Success green)
- **Background**: `#f8fafc` (Clean gray background)

### Semantic Colors

#### Success
- **Primary**: `#16a34a` - Success states, completed actions
- **Background**: `#dcfce7` - Success message backgrounds

#### Warning
- **Primary**: `#d97706` - Warning states, attention needed
- **Background**: `#fef3c7` - Warning message backgrounds

#### Error
- **Primary**: `#dc2626` - Error states, critical actions
- **Background**: `#fee2e2` - Error message backgrounds

---

## Typography

### Font Family
- **Primary**: Inter, system fonts - Clean, readable font for all text
- **Monospace**: JetBrains Mono - Used for code and technical content

### Font Sizes
- **xs**: 12px - Captions, fine print
- **sm**: 14px - Secondary text, labels
- **base**: 16px - Body text, default size
- **lg**: 18px - Prominent text
- **xl**: 20px - Small headings
- **2xl**: 24px - Section headings
- **3xl**: 30px - Page headings
- **4xl**: 36px - Hero headings

### Font Weights
- **Normal (400)**: Body text
- **Medium (500)**: Emphasized text
- **Semibold (600)**: Headings, important text
- **Bold (700)**: Strong emphasis

### Line Heights
- **Tight (1.25)**: Headings and display text
- **Normal (1.5)**: Body text and paragraphs
- **Relaxed (1.625)**: Long-form content

---

## Spacing System

Based on a 4px grid system for consistent spacing:

- **1**: 4px - Tight spacing
- **2**: 8px - Small spacing
- **3**: 12px - Compact spacing  
- **4**: 16px - Default spacing
- **5**: 20px - Comfortable spacing
- **6**: 24px - Spacious
- **8**: 32px - Large spacing
- **10**: 40px - Extra large spacing
- **12**: 48px - Section spacing
- **16**: 64px - Page-level spacing

---

## Components

### Buttons

#### Primary Button
```css
.tutorkai-btn-primary {
  background-color: var(--tutorkai-primary-600);
  color: white;
  min-height: 44px; /* Accessibility */
  border-radius: 8px;
  padding: 12px 16px;
}
```

#### Secondary Button
```css
.tutorkai-btn-secondary {
  background-color: white;
  color: var(--tutorkai-secondary-700);
  border: 1px solid var(--tutorkai-secondary-300);
  min-height: 44px;
  border-radius: 8px;
  padding: 12px 16px;
}
```

### Cards

#### Standard Card
```css
.tutorkai-card {
  background-color: white;
  border-radius: 16px;
  box-shadow: var(--tutorkai-shadow-base);
  border: 1px solid var(--tutorkai-secondary-200);
  padding: 24px;
}
```

#### Kids Card (K-7)
```css
.tutorkai-card-kids {
  background: linear-gradient(135deg, #f0f9ff 0%, #fef7ff 100%);
  border: 1px solid var(--tutorkai-kids-primary);
  border-radius: 24px; /* More rounded for kids */
}
```

### Forms

#### Input Field
```css
.tutorkai-input {
  border: 1px solid var(--tutorkai-secondary-300);
  border-radius: 8px;
  padding: 12px 16px;
  min-height: 44px; /* Accessibility */
  font-size: 16px; /* Prevents zoom on iOS */
}
```

---

## Usage Guidelines

### Age-Appropriate Design

#### For Kids (K-7)
- **Larger touch targets** (48px minimum)
- **Brighter, playful colors** from kids palette
- **More rounded corners** (16px+)
- **Visual icons and emojis** to aid comprehension
- **Simpler language** in labels and text

#### For Teens (8-12)
- **Standard touch targets** (44px minimum)
- **Professional color palette** with teen colors
- **Standard corners** (8px)
- **Icon + text combinations** for clarity
- **Age-appropriate terminology**

### Responsive Behavior

#### Mobile (< 768px)
- **Single column layouts**
- **Bottom sheet modals**
- **Swipe gestures enabled**
- **Larger padding and spacing**

#### Tablet (768px - 1024px)
- **Two-column layouts where appropriate**
- **Adaptive spacing**
- **Touch-first interactions**

#### Desktop (> 1024px)
- **Multi-column layouts**
- **Hover states**
- **Keyboard navigation**
- **Mouse-optimized interactions**

---

## Implementation

### CSS Custom Properties

All design tokens are available as CSS custom properties:

```css
/* Colors */
--tutorkai-primary-600: #2563eb;
--tutorkai-secondary-700: #334155;

/* Typography */
--tutorkai-text-base: 1rem;
--tutorkai-font-medium: 500;

/* Spacing */
--tutorkai-space-4: 1rem;
--tutorkai-space-6: 1.5rem;
```

### TypeScript Tokens

Design tokens are also available as TypeScript constants:

```typescript
import { colors, typography, spacing } from '../styles/design-tokens';

const buttonStyle = {
  backgroundColor: colors.primary[600],
  fontSize: typography.fontSize.base,
  padding: spacing[4],
};
```

### Component Classes

Pre-built component classes are available:

```html
<!-- Buttons -->
<button class="tutorkai-btn tutorkai-btn-primary">Primary Action</button>
<button class="tutorkai-btn tutorkai-btn-secondary">Secondary Action</button>

<!-- Cards -->
<div class="tutorkai-card">Standard card content</div>
<div class="tutorkai-card tutorkai-card-kids">Kids-themed card</div>

<!-- Typography -->
<h1 class="tutorkai-heading-1">Page Title</h1>
<p class="tutorkai-body">Body text content</p>
```

---

## Testing & Validation

### Accessibility Checklist

- [ ] Color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
- [ ] All interactive elements have minimum 44px touch targets
- [ ] Focus indicators are clearly visible
- [ ] Content is readable without color alone
- [ ] Motion respects user preferences

### Responsive Testing

- [ ] Components work on screens from 320px to 2560px wide
- [ ] Touch interactions work properly on mobile devices
- [ ] Hover states work on desktop
- [ ] Text remains readable at all sizes

### Age-Appropriate Testing

- [ ] Kids components use appropriate colors and sizing
- [ ] Language is age-appropriate
- [ ] Visual hierarchy is clear for all age groups
- [ ] Safety features are properly implemented

---

## Examples

### Parent Dashboard Card
```jsx
<div className="tutorkai-card">
  <h2 className="tutorkai-heading-3">Today's Schedule</h2>
  <div className="space-y-4 mt-4">
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="tutorkai-body-sm">Emma (Grade K) • Math</div>
      <div className="tutorkai-caption">2:00 PM with Ms. Jennifer</div>
    </div>
  </div>
</div>
```

### Student Dashboard (Kids)
```jsx
<div className="tutorkai-card tutorkai-card-kids">
  <h1 className="tutorkai-heading-2 text-center">Hi Emma! 🌟</h1>
  <div className="grid grid-cols-3 gap-4 mt-6">
    <button className="tutorkai-btn tutorkai-btn-primary h-20 flex-col">
      <span className="text-2xl">📚</span>
      <span className="tutorkai-caption">Lessons</span>
    </button>
  </div>
</div>
```

This design system ensures consistent, accessible, and age-appropriate experiences across all TutorKai interfaces while maintaining the flexibility needed for our diverse user base.