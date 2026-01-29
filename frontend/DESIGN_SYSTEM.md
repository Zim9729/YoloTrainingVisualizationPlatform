# YOLO Training Platform - Design System

**Version:** 2.0
**Last Updated:** 2026-01-20

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Shadows](#shadows)
5. [Border Radius](#border-radius)
6. [Components](#components)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Best Practices](#best-practices)

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| `--main-color` | #234B7E | Primary actions, navigation, branding |
| `--main-light` | #3B5F94 | Hover states, secondary actions |
| `--main-lighter` | #5A7BA8 | Disabled states, backgrounds |
| `--hover-color` | #1A3A6D | Hover interactions |
| `--active-color` | #162A4D | Active/pressed states |

### Neutral Colors

| Color | Hex | Usage |
|-------|-----|-------|
| `--background-color` | #ffffff | Main background |
| `--secondary-color` | #F8F9FA | Card backgrounds, secondary backgrounds |
| `--light-color` | #E9ECEF | Borders, dividers |
| `--border-color` | #DEE2E6 | Input borders, table borders |
| `--text-color` | #212529 | Primary text (WCAG AA: 15.3:1) |
| `--secondary-text-color` | #495057 | Secondary text (WCAG AA: 8.2:1) |
| `--tertiary-text-color` | #6C757D | Tertiary text, placeholders |

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| `--red-color` | #DC3545 | Error states, destructive actions |
| `--red-hover-color` | #C82333 | Error hover states |
| `--red-light` | #F8D7DA | Error backgrounds |
| `--green-color` | #28A745 | Success states |
| `--green-hover-color` | #218838 | Success hover states |
| `--green-light` | #D4EDDA | Success backgrounds |
| `--yellow-color` | #FFC107 | Warning states |
| `--yellow-hover-color` | #E0A800 | Warning hover states |
| `--yellow-light` | #FFF3CD | Warning backgrounds |
| `--blue-info` | #17A2B8 | Info states |
| `--blue-info-hover` | #138496 | Info hover states |

### Color Usage Guidelines

- **Primary Actions**: Use `--main-color`
- **Secondary Actions**: Use `--secondary-color` with border
- **Destructive Actions**: Use `--red-color`
- **Success States**: Use `--green-color`
- **Warnings**: Use `--yellow-color`
- **Information**: Use `--blue-info`

---

## Typography

### Font Families

```css
--font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-family-mono: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

### Font Sizes

| Variable | Size | Usage |
|----------|------|-------|
| `--text-xs` | 12px | Fine print, captions |
| `--text-sm` | 14px | Body text, labels |
| `--text-base` | 16px | Base text size |
| `--text-lg` | 18px | Subheadings |
| `--text-xl` | 20px | Card titles |
| `--text-2xl` | 24px | Section headings |
| `--text-3xl` | 30px | Page headings |
| `--text-4xl` | 36px | Hero titles |

### Line Heights

| Variable | Value | Usage |
|----------|-------|-------|
| `--leading-tight` | 1.25 | Headings |
| `--leading-normal` | 1.5 | Body text |
| `--leading-relaxed` | 1.75 | Paragraphs with long text |

### Typography Guidelines

- Use `--text-sm` (14px) for form labels and body text
- Use `--text-lg` (18px) for section headings
- Maintain line height of 1.5 for body text for readability
- Limit text width to 65-75 characters per line for optimal readability

---

## Spacing

### Spacing Scale

| Variable | Size | Usage |
|----------|------|-------|
| `--spacing-xs` | 4px | Tight spacing between related elements |
| `--spacing-sm` | 8px | Small gaps, icon spacing |
| `--spacing-md` | 16px | Default spacing, form groups |
| `--spacing-lg` | 24px | Section spacing, card padding |
| `--spacing-xl` | 32px | Large gaps |
| `--spacing-2xl` | 48px | Component separation |
| `--spacing-3xl` | 64px | Page-level spacing |

### Spacing Guidelines

- Use `--spacing-md` (16px) for form group margins
- Use `--spacing-lg` (24px) for card padding
- Use `--spacing-xl` (32px) between major sections
- Maintain consistent spacing throughout the interface

---

## Shadows

### Shadow Scale

| Variable | CSS | Usage |
|----------|-----|-------|
| `--shadow-sm` | 0 1px 3px rgba(0,0,0,0.06) | Subtle elevation |
| `--shadow-md` | 0 4px 8px rgba(0,0,0,0.08) | Cards, buttons |
| `--shadow-lg` | 0 12px 24px rgba(0,0,0,0.10) | Dropdowns, popovers |
| `--shadow-xl` | 0 20px 40px rgba(0,0,0,0.12) | Modals, tooltips |

### Shadow Guidelines

- Use `--shadow-sm` for default card elevation
- Use `--shadow-md` on hover for interactive elements
- Use `--shadow-lg` for dropdowns and popovers
- Use `--shadow-xl` for modals and tooltips

---

## Border Radius

### Radius Scale

| Variable | Size | Usage |
|----------|------|-------|
| `--radius-sm` | 6px | Inputs, buttons, small elements |
| `--radius-md` | 10px | Cards, larger buttons |
| `--radius-lg` | 14px | Large cards, modals |
| `--radius-xl` | 20px | Hero sections, large containers |
| `--radius-full` | 9999px | Pills, badges, circles |

### Border Radius Guidelines

- Use `--radius-sm` for form inputs and buttons
- Use `--radius-md` for cards
- Use `--radius-lg` for larger containers
- Maintain consistent radius within component groups

---

## Components

### Buttons

**Base Button:**
```css
.btn {
    background-color: var(--main-color);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 20px;
    min-height: 44px; /* Touch target size */
    font-size: var(--text-sm);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-base);
}
```

**Button Variants:**
- `.btn` - Primary button
- `.btn.secondary` - Secondary button
- `.btn.r` - Red outline button (destructive)
- `.btn.success` - Success button
- `.btn.info` - Info button
- `.btn.sm` - Small button (32px min-height)
- `.btn.lg` - Large button (52px min-height)
- `.btn.full` - Full width button

**Button Behavior:**
- Hover: `translateY(-1px)` + `box-shadow: var(--shadow-md)`
- Active: `translateY(0)` + `box-shadow: var(--shadow-sm)`
- Focus: `box-shadow: var(--focus-ring)`
- Disabled: `opacity: 0.5` + `cursor: not-allowed`

### Cards

**Base Card:**
```css
.card {
    background-color: var(--background-color);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg) var(--spacing-xl);
    transition: box-shadow var(--transition-base), transform var(--transition-base);
}
```

**Card Variants:**
- `.card` - Base card
- `.card.click` - Clickable card with primary color
- `.card.hover-enabled` - Hover color change
- `.card.b-transform` - Enhanced transform
- `.info-card` - Information display card
- `.list-card` - List item card

**Card Behavior:**
- Hover: `translateY(-2px)` + `box-shadow: var(--shadow-lg)`
- Active: `translateY(0)`

### Form Inputs

**Base Input:**
```css
input[type="text"],
input[type="number"],
select,
textarea {
    padding: 10px 12px;
    font-size: var(--text-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    min-height: 44px; /* Touch target size */
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
```

**Input States:**
- Default: `border-color: var(--border-color)`
- Focus: `border-color: var(--main-color)` + `box-shadow: var(--focus-ring)`
- Error: `border-color: var(--red-color)` + `box-shadow: var(--focus-ring-error)`
- Disabled: `background-color: var(--secondary-color)` + `cursor: not-allowed`

### Tables

**Base Table:**
```css
table {
    width: 100%;
    border-collapse: collapse;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
}
```

**Table Features:**
- Sticky headers
- Row hover states
- Alternating row colors
- Responsive wrapper
- Status row variants (success, warning, error)

---

## Accessibility Guidelines

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:
- Normal text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

### Focus Indicators

All interactive elements have visible focus states:
```css
:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
}
```

### Touch Targets

All interactive elements meet minimum touch target size:
- Buttons: 44px minimum height
- Form inputs: 44px minimum height
- Links: Inherit from parent container

### Keyboard Navigation

- Tab order follows visual order
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- No keyboard traps

### Screen Readers

- Use semantic HTML elements
- Provide `aria-label` for icon-only buttons
- Use `alt` text for meaningful images
- Form inputs have associated labels

---

## Best Practices

### DO's ✅

1. **Use CSS Variables**: Always use CSS variables for colors, spacing, and other design tokens
2. **Maintain Consistency**: Use the same spacing and sizing throughout the application
3. **Provide Feedback**: All interactive elements should have hover, active, and focus states
4. **Use Transforms Wisely**: Prefer `translateY` over `scale` for hover effects (prevents layout shift)
5. **Test Contrast**: Ensure all text meets WCAG AA contrast requirements
6. **Touch-Friendly**: Maintain minimum 44px touch target size for mobile users
7. **Semantic HTML**: Use proper HTML elements (`<button>`, `<input>`, `<label>`)

### DON'Ts ❌

1. **Don't Use Scale Transforms**: `scale()` causes layout shift and looks unprofessional
2. **Don't Hardcode Values**: Avoid hardcoding colors, spacing, or sizes
3. **Don't Skip Focus States**: Always provide visible focus indicators
4. **Don't Use Emojis**: Use SVG icons instead of emoji icons
5. **Don't Ignore Accessibility**: Test with keyboard and screen reader
6. **Don't Mix Sizing**: Keep icon sizes consistent within components
7. **Don't Over Animate**: Keep animations between 150-300ms

### Performance Tips

1. **Use Transform and Opacity**: These are GPU-accelerated properties
2. **Avoid Width/Height Animations**: These trigger layout recalculation
3. **Use Will-Change Sparingly**: Only on elements that will actually animate
4. **Prefer CSS Transitions**: Over JavaScript animations for simple effects

---

## Migration Guide

### Updating Existing Components

1. Replace hardcoded colors with CSS variables
2. Update `scale()` transforms to `translateY()`
3. Add focus states with `var(--focus-ring)`
4. Ensure minimum 44px touch target size
5. Update shadows to use new shadow scale
6. Add proper ARIA labels where needed

### Example Migration

**Before:**
```css
.my-button {
    background-color: #234B7E;
    padding: 10px 20px;
    border-radius: 8px;
    transition: all 0.2s;
}

.my-button:hover {
    transform: scale(1.05);
}
```

**After:**
```css
.my-button {
    background-color: var(--main-color);
    padding: 10px 20px;
    border-radius: var(--radius-md);
    min-height: 44px;
    transition: all var(--transition-base);
}

.my-button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.my-button:focus-visible {
    box-shadow: var(--focus-ring);
}
```

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## Changelog

### Version 2.0 (2026-01-20)
- ✨ Complete design system overhaul
- ✨ Added comprehensive CSS variables
- ✨ Improved accessibility with focus rings
- ✨ Enhanced button, card, form, and table components
- ✨ Better shadow and spacing systems
- 🐛 Fixed hover effects (replaced scale with translateY)
- 📚 Added comprehensive documentation

### Version 1.0
- Initial release with basic styling
