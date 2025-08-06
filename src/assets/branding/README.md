# 🎨 Brand Assets Directory

This directory contains all brand assets and visual identity elements for the application.

## 📁 Directory Structure

```
branding/
├── logos/                    # Logo files in various formats
│   ├── primary/             # Main brand logo
│   │   ├── logo-primary.svg
│   │   ├── logo-primary-light.svg
│   │   ├── logo-primary-dark.svg
│   │   └── logo-primary.png (multiple sizes)
│   ├── secondary/           # Alternative logo layouts
│   │   ├── logo-stacked.svg
│   │   └── logo-horizontal.svg
│   ├── icon/               # Logo icon/symbol only
│   │   ├── icon.svg
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── wordmark/           # Text-only versions
│       ├── wordmark.svg
│       └── wordmark-light.svg
├── colors/                 # Color palette definitions
│   ├── colors.json
│   ├── tailwind-colors.js
│   └── css-variables.css
├── typography/             # Font specifications
│   ├── fonts.json
│   └── font-samples.html
├── icons/                  # Application icons
│   ├── favicons/
│   ├── app-icons/
│   └── social-icons/
└── guidelines/             # Brand guidelines and usage
    ├── brand-guidelines.md
    ├── logo-usage.md
    └── examples/
```

## 🎯 Asset Requirements

### Logo Specifications
- **Format**: SVG (primary), PNG (fallback)
- **Sizes**: 16px, 32px, 48px, 64px, 128px, 192px, 512px
- **Variants**: Light background, dark background, monochrome
- **Safe area**: Minimum 25% padding around logo

### Color Palette
- **Primary**: Main brand color
- **Secondary**: Complementary color
- **Accent**: Action/highlight color
- **Neutral**: Grays for text and backgrounds
- **Semantic**: Success, warning, error, info colors

### Typography
- **Primary Font**: Brand/heading font
- **Secondary Font**: Body/UI text font
- **Font Weights**: Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)

## 🔧 Usage Guidelines

### React Components
```jsx
import { ReactComponent as Logo } from '../assets/branding/logos/primary/logo-primary.svg';
import { ReactComponent as LogoIcon } from '../assets/branding/logos/icon/icon.svg';

// Usage
<Logo className="h-8 w-auto" />
<LogoIcon className="h-6 w-6" />
```

### CSS Variables
```css
/* Import brand colors */
@import '../assets/branding/colors/css-variables.css';

/* Usage */
.brand-primary { color: var(--color-brand-primary); }
.brand-secondary { color: var(--color-brand-secondary); }
```

### Tailwind Configuration
```js
// tailwind.config.js
const brandColors = require('./src/assets/branding/colors/tailwind-colors.js');

module.exports = {
  theme: {
    extend: {
      colors: brandColors
    }
  }
}
```

## 📋 Asset Checklist

### Required Logo Files
- [ ] Primary logo (SVG + PNG)
- [ ] Logo icon (SVG + multiple PNG sizes)
- [ ] Light version for dark backgrounds
- [ ] Dark version for light backgrounds
- [ ] Monochrome version

### Required App Icons
- [ ] Favicon (16x16, 32x32, 48x48)
- [ ] Apple touch icon (180x180)
- [ ] Android app icon (192x192, 512x512)
- [ ] Windows tile icon (144x144)
- [ ] PWA manifest icons

### Required Color Definitions
- [ ] Primary brand color
- [ ] Secondary brand color
- [ ] Accent color
- [ ] Success color
- [ ] Warning color
- [ ] Error color
- [ ] Neutral grays
- [ ] Background colors

### Implementation Files
- [ ] colors.json (color definitions)
- [ ] tailwind-colors.js (Tailwind integration)
- [ ] css-variables.css (CSS custom properties)
- [ ] fonts.json (typography specifications)

## 🎨 Design Tools Integration

### Figma/Sketch Export Settings
- **SVG**: Outline strokes, include IDs
- **PNG**: 2x resolution for retina displays
- **Colors**: Export as hex values
- **Typography**: Include font specifications

### Optimization
- **SVG**: Optimize with SVGO
- **PNG**: Compress with TinyPNG
- **Colors**: Ensure WCAG AA contrast compliance
- **File sizes**: Keep under 50KB for logos

## 🔄 Brand Updates

When updating brand assets:

1. **Update source files** in design tool
2. **Export all required formats** and sizes
3. **Run optimization** on exported files
4. **Update color/typography** definitions
5. **Test implementation** across components
6. **Update documentation** and guidelines

## 📞 Support

For brand asset questions or requests:
- Review brand guidelines first
- Check existing assets in this directory
- Follow the established naming conventions
- Maintain consistent quality and format standards

## 🚀 Quick Start

1. **Choose your brand name** and create initial concepts
2. **Design primary logo** in SVG format
3. **Define color palette** (5-8 colors maximum)
4. **Export all required sizes** and formats
5. **Update component imports** throughout application
6. **Test implementation** across different screen sizes
7. **Document usage guidelines** for team reference