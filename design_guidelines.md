# Easyread IQ - Design Guidelines

## Design Approach: Design System Foundation
**Selected System:** Material Design 3 (adapted for educational context)
**Rationale:** Mobile-first patterns, excellent form/interaction components, clear feedback mechanisms, and strong accessibility features perfect for quiz applications.

**Core Principles:**
- Mobile-first, distraction-free learning experience
- Clear visual hierarchy for quiz content
- Subject-based color theming for engagement
- Instant, unambiguous feedback during quizzes

## Color Palette

**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 220 13% 18%
- Text Secondary: 220 9% 46%
- Border: 220 13% 91%

**Dark Mode:**
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Border: 217 33% 24%

**Subject Theme Colors** (customizable per subject in admin):
- Business Law: 217 91% 60% (Blue)
- Corporate Governance: 142 71% 45% (Green)
- Taxation: 262 83% 58% (Purple)
- General: 24 95% 53% (Orange)

**Functional Colors:**
- Success: 142 76% 36%
- Error: 0 72% 51%
- Warning: 38 92% 50%
- Premium Gold: 43 96% 56%

**Status Indicators:**
- Free Badge: 142 71% 45% with 142 71% 45% / 10% background
- Premium Badge: 43 96% 56% with 43 96% 56% / 10% background

## Typography

**Font Stack:**
- Primary: 'Inter' from Google Fonts (400, 500, 600, 700)
- Monospace: 'JetBrains Mono' for timer/scores (500, 600)

**Type Scale:**
- Hero/Display: text-4xl md:text-5xl font-bold (questions on quiz page)
- H1: text-3xl md:text-4xl font-bold
- H2: text-2xl md:text-3xl font-semibold
- H3: text-xl md:text-2xl font-semibold
- Body Large: text-base md:text-lg
- Body: text-sm md:text-base
- Caption: text-xs md:text-sm text-muted-foreground

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Tight spacing: p-2, gap-2 (mobile components)
- Standard spacing: p-4, gap-4 (cards, sections)
- Generous spacing: p-6, gap-6 (desktop layouts)
- Section spacing: py-12 md:py-20

**Mobile-First Breakpoints:**
- Base (mobile): < 640px - Single column, full width
- md (tablet): 768px - Two columns where appropriate
- lg (desktop): 1024px - Full layout width max-w-7xl

**Container Strategy:**
- App container: max-w-7xl mx-auto px-4 md:px-6
- Quiz content: max-w-2xl mx-auto (optimal reading width)
- Admin panels: max-w-6xl mx-auto

## Component Library

**Navigation:**
- Mobile: Bottom tab bar (4 icons: Dashboard, Profile, Leaderboard, Settings)
- Desktop: Left sidebar with same navigation + admin link
- Admin: Top bar with logo, admin menu, logout

**Quiz Cards:**
- Subject card: Rounded-xl, subtle shadow, subject theme color accent on left border
- Question card: Full-height on mobile (min-h-screen), centered content, max-w-2xl
- Option cards: Rounded-lg, hover:ring-2, selected state with theme color fill

**Buttons:**
- Primary: Subject theme color, rounded-lg, font-semibold
- Secondary: outline variant with theme color
- Icon buttons: rounded-full, p-2
- Premium CTA: Gold gradient background

**Forms:**
- Input fields: Rounded-md, border-2, focus:ring-2 with theme color
- OTP input: 6 individual boxes, text-center, text-2xl, monospace font
- Dark mode: Consistent background for all inputs

**Progress Indicators:**
- Quiz progress: Full-width bar, subject theme color, height h-2
- Question counter: Pill shape "3/20", top-right corner
- Timer: Monospace font, warning color when < 1 minute

**Feedback Components:**
- Correct answer: Green checkmark icon, subtle green background glow
- Incorrect answer: Red X icon, subtle red background glow
- Review flag: Yellow bookmark icon, top-right of question card

**Payment Modal:**
- Centered overlay with blur backdrop
- Subject preview, pricing, Paystack button
- Premium badge with gold accent

**Admin Dashboard:**
- Data tables: Striped rows, sortable headers, hover states
- Subject editor: Color picker for theme, toggle for Free/Premium
- Analytics cards: Grid layout, md:grid-cols-3, with icon + metric + trend

**Accessibility:**
- TTS button: Floating action button (FAB), bottom-right, speaker icon
- High contrast ratios (WCAG AA minimum)
- Focus states: 2px ring with theme color
- Skip to content link

## Interaction Patterns

**Quiz Flow:**
1. Subject selection → Payment check → Quiz start
2. Question display (one per screen)
3. Option selection → Visual feedback (if enabled)
4. Next button appears after selection
5. Submit → Results screen with score breakdown

**Micro-interactions:**
- Option selection: Scale 0.98 on click, theme color fill on selected
- Card hover: Subtle lift (translate-y-1), shadow increase
- Button states: Built-in hover/active, no custom interactions on images
- Loading: Skeleton screens matching content layout

**Animations:** Minimal, performance-focused
- Page transitions: Fade 200ms
- Modal entrance: Scale from 0.95, fade 150ms
- Success/error toasts: Slide from top, 300ms

## Images

**Hero Section (Landing/Marketing):**
- Large hero image: Students/learning scene, 60vh on mobile, 80vh on desktop
- Overlay: Dark gradient bottom-to-top for text readability
- Position: Background cover, center
- CTA buttons on image: Blurred glass background, no hover interactions

**Subject Cards:**
- Icon-based illustrations (not photos): Use Heroicons for subjects
- Premium subjects: Gold corner ribbon or badge overlay

**Profile/Dashboard:**
- Avatar placeholders: Initials in circle with subject theme color
- Achievement badges: Icon + color, no photos

**Admin Analytics:**
- Charts/graphs only, no decorative images
- Data visualization using subject theme colors

## Design Specifications

**Mobile Quiz Screen:**
- Full-screen question (min-h-screen)
- Progress bar: Fixed top, w-full, h-2
- Question: text-2xl, centered vertically
- Options: List below, gap-3, full-width
- Navigation: Fixed bottom bar with "Mark for Review" + "Next"

**Subject Dashboard:**
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card padding: p-6
- Free/Premium badge: Absolute top-right
- Quiz list: Collapsed initially, expand on card click

**Results Screen:**
- Score: Large text-6xl, monospace, centered
- Pass/Fail: Color-coded banner, full-width
- Breakdown: Table with question review
- Retry CTA: Primary button, bottom-fixed on mobile

**Dark Mode Implementation:**
- Consistent dark backgrounds for all inputs and surfaces
- Subject theme colors maintain same hue, adjusted lightness
- Reduced shadow intensity, use borders for depth