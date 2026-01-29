# YOLO Training Platform - Modern UI Usage Guide

**Created:** 2026-01-20
**Version:** 3.0

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [New CSS Files](#new-css-files)
3. [Button Styles](#button-styles)
4. [Card Styles](#card-styles)
5. [Table Styles](#table-styles)
6. [Form Styles](#form-styles)
7. [Animations](#animations)
8. [Toast Notifications](#toast-notifications)
9. [Dark Mode](#dark-mode)
10. [Component Examples](#component-examples)

---

## 🚀 Quick Start

### Import New Styles

Add these imports to your main entry file (e.g., `main.jsx` or `App.jsx`):

```javascript
import './assets/style/button.css';
import './assets/style/card.css';
import './assets/style/table.css';
import './assets/style/form.css';
import './assets/style/animation.css';
import './assets/style/toast.css';
```

---

## 📁 New CSS Files

### 1. **animation.css**
Loading states, progress indicators, and micro-interactions.

### 2. **toast.css**
Toast notification system and tooltips.

---

## 🔘 Button Styles

### Gradient Buttons

Add modern gradient effects to your buttons:

```jsx
<button className="btn gradient">Primary Gradient</button>
<button className="btn gradient-blue">Blue Gradient</button>
<button className="btn gradient-success">Success Gradient</button>
<button className="btn gradient-forest">Forest Gradient</button>
<button className="btn gradient-sunset">Sunset Gradient</button>
```

### Glassmorphism Button

```jsx
<button className="btn glass">Glass Button</button>
```

### Icon-Only Button

```jsx
<button className="btn icon-only" aria-label="Settings">
  <img src="/icons/settings.svg" className="icon" alt="" />
</button>
```

---

## 🃏 Card Styles

### Glassmorphism Card

```jsx
<div className="card glass">
  <h3 className="title">Glass Effect Card</h3>
  <p className="content">Modern glassmorphism effect</p>
</div>
```

### Modern Card with Left Border

```jsx
<div className="card modern">
  <h3 className="title">Modern Card</h3>
  <p className="content">Appears on hover</p>
</div>
```

### Card with Icon Background

```jsx
<div className="card">
  <div className="card-icon-bg">
    <img src="/icons/chart.svg" className="icon" alt="" />
  </div>
  <h3 className="title">Statistics</h3>
  <p className="content">Your metrics here</p>
</div>
```

### Metric Card

```jsx
<div className="metric-card">
  <div className="metric-label">Training Accuracy</div>
  <div className="metric-value">94.5%</div>
  <div className="metric-change positive">↑ 2.3%</div>
</div>
```

### Interactive Card

```jsx
<div className="card clickable">
  <h3 className="title">Click Me</h3>
  <p className="content">Enhanced hover effect</p>
</div>
```

---

## 📊 Table Styles

### Modern Table with Gradient Header

```jsx
<table className="modern">
  <thead>
    <tr>
      <th>Model Name</th>
      <th>Accuracy</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>YOLOv8</td>
      <td>94.5%</td>
      <td><span className="status-badge success">Active</span></td>
    </tr>
  </tbody>
</table>
```

### Status Badges

```jsx
<span className="status-badge success">Success</span>
<span className="status-badge error">Error</span>
<span className="status-badge warning">Warning</span>
<span className="status-badge info">Info</span>
<span className="status-badge neutral">Neutral</span>
```

### Sortable Table Headers

```jsx
<th className="sortable">Name</th>
<th className="sortable asc">Age ↑</th>
<th className="sortable desc">Date ↓</th>
```

---

## 📝 Form Styles

### Floating Label Form

```jsx
<div className="form-group modern">
  <input type="text" id="username" placeholder=" " required />
  <label for="username">Username</label>
</div>
```

### Form with Icon

```jsx
<div className="form-group with-icon">
  <span className="form-icon">🔍</span>
  <input type="text" id="search" placeholder=" " />
  <label for="search">Search</label>
</div>
```

### Search Box

```jsx
<div className="search-box">
  <span className="search-icon">🔍</span>
  <input type="text" placeholder="Search models..." />
</div>
```

### Toggle Switch

```jsx
<label className="toggle-switch">
  <input type="checkbox" />
  <span className="toggle-slider"></span>
</label>
```

### Form Sections

```jsx
<div className="form-section">
  <h3 className="form-section-title">Training Configuration</h3>
  <div className="form-row">
    <div className="form-group">
      <label>Epochs</label>
      <input type="number" value="100" />
    </div>
    <div className="form-group">
      <label>Batch Size</label>
      <input type="number" value="32" />
    </div>
  </div>
</div>
```

---

## ✨ Animations

### Loading Spinner

```jsx
<div className="spinner"></div>
<div className="spinner sm"></div>
<div className="spinner lg"></div>
```

### Skeleton Loading

```jsx
<div className="skeleton skeleton-text"></div>
<div className="skeleton skeleton-title"></div>
<div className="skeleton skeleton-avatar"></div>
```

### Progress Bar

```jsx
<div className="progress-bar">
  <div className="progress-bar-fill" style={{ width: '75%' }}></div>
</div>
```

### Steps Indicator

```jsx
<div className="steps">
  <div className="step completed">
    <div className="step-circle">1</div>
    <div className="step-label">Upload</div>
  </div>
  <div className="step active">
    <div className="step-circle">2</div>
    <div className="step-label">Train</div>
  </div>
  <div className="step">
    <div className="step-circle">3</div>
    <div className="step-label">Deploy</div>
  </div>
</div>
```

### Empty State

```jsx
<div className="empty-state">
  <div className="empty-state-icon">📭</div>
  <h3 className="empty-state-title">No Models Found</h3>
  <p className="empty-state-description">
    Upload your first model to get started.
  </p>
</div>
```

### Micro-interactions

```jsx
<div className="hover-lift">Lifts on hover</div>
<div className="hover-glow">Glows on hover</div>
<div className="shake">Shakes on error</div>
<div className="pulse">Pulses continuously</div>
```

### Status Indicators

```jsx
<span className="status-indicator active"></span> {/* Green, pulsing */}
<span className="status-indicator inactive"></span> {/* Gray */}
<span className="status-indicator error"></span> {/* Red */}
```

---

## 🔔 Toast Notifications

### Basic Toast

```jsx
<div className="toast-container">
  <div className="toast success">
    <div className="toast-icon">✓</div>
    <div className="toast-content">
      <div className="toast-title">Success!</div>
      <div className="toast-message">Your model has been trained.</div>
    </div>
    <button className="toast-close">✕</button>
  </div>
</div>
```

### Toast Variants

```jsx
<div className="toast success">Success message</div>
<div className="toast error">Error message</div>
<div className="toast warning">Warning message</div>
<div className="toast info">Info message</div>
```

### Toast Positions

```jsx
<div className="toast-container"> {/* Top-right (default) */}
<div className="toast-container top-left">
<div className="toast-container bottom-right">
<div className="toast-container bottom-left">
```

### Toast with Progress

```jsx
<div className="toast">
  <div className="toast-content">...</div>
  <div className="toast-progress" style={{ animationDuration: '5s' }}></div>
</div>
```

### Tooltips

```jsx
<div className="tooltip">
  <button>Hover me</button>
  <div className="tooltip-content">Tooltip text</div>
</div>

<div className="tooltip top">Top tooltip</div>
<div className="tooltip bottom">Bottom tooltip</div>
<div className="tooltip left">Left tooltip</div>
<div className="tooltip right">Right tooltip</div>
```

---

## 🌙 Dark Mode

### Automatic Dark Mode

Dark mode is automatically enabled based on system preferences using `@media (prefers-color-scheme: dark)`.

### Manual Dark Mode Toggle

```jsx
// Toggle dark mode on body
document.body.classList.toggle('dark-mode');

// In React
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  if (darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}, [darkMode]);

// Toggle button
<button onClick={() => setDarkMode(!darkMode)}>
  {darkMode ? '☀️' : '🌙'}
</button>
```

---

## 💡 Component Examples

### Example 1: Modern Dashboard Card

```jsx
<div className="metric-card">
  <div className="card-icon-bg">
    <img src="/icons/accuracy.svg" className="icon" alt="" />
  </div>
  <div className="metric-label">Model Accuracy</div>
  <div className="metric-value">94.5%</div>
  <div className="metric-change positive">
    ↑ 2.3% from last week
  </div>
</div>
```

### Example 2: Training Progress

```jsx
<div className="card modern">
  <h3 className="title">Training Progress</h3>
  <div className="steps">
    <div className="step completed">
      <div className="step-circle">✓</div>
      <div className="step-label">Data Prep</div>
    </div>
    <div className="step active">
      <div className="step-circle">2</div>
      <div className="step-label">Training</div>
    </div>
    <div className="step">
      <div className="step-circle">3</div>
      <div className="step-label">Validation</div>
    </div>
  </div>
  <div className="progress-bar">
    <div className="progress-bar-fill" style={{ width: '65%' }}></div>
  </div>
</div>
```

### Example 3: Model List Table

```jsx
<table className="modern">
  <thead>
    <tr>
      <th className="sortable">Model Name</th>
      <th className="sortable">Accuracy</th>
      <th className="sortable">Date</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>YOLOv8-Custom</td>
      <td>94.5%</td>
      <td>2026-01-20</td>
      <td><span className="status-badge success">Active</span></td>
      <td className="table-actions">
        <button className="btn sm">View</button>
        <button className="btn sm secondary">Edit</button>
      </td>
    </tr>
  </tbody>
</table>
```

### Example 4: Settings Form

```jsx
<div className="form-section">
  <h3 className="form-section-title">Training Settings</h3>
  <div className="form-row">
    <div className="form-group modern">
      <input type="number" id="epochs" placeholder=" " defaultValue="100" />
      <label for="epochs">Epochs</label>
    </div>
    <div className="form-group modern">
      <input type="number" id="batch" placeholder=" " defaultValue="32" />
      <label for="batch">Batch Size</label>
    </div>
  </div>
  <div className="form-group modern">
    <select id="optimizer">
      <option value="adam">Adam</option>
      <option value="sgd">SGD</option>
      <option value="adamw">AdamW</option>
    </select>
    <label for="optimizer">Optimizer</label>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <label className="toggle-switch">
      <input type="checkbox" defaultChecked />
      <span className="toggle-slider"></span>
    </label>
    <span>Enable data augmentation</span>
  </div>
</div>
```

---

## 🎨 CSS Variables Reference

### Gradients

- `--gradient-primary` - Purple gradient (667eea → 764ba2)
- `--gradient-success` - Green gradient (84fab0 → 8fd3f4)
- `--gradient-warning` - Orange/pink gradient (fccb90 → d57eeb)
- `--gradient-blue` - Blue gradient (234B7E → 3B5F94 → 5A7BA8)
- `--gradient-ocean` - Ocean gradient (667eea → 764ba2)
- `--gradient-sunset` - Sunset gradient (f093fb → f5576c)
- `--gradient-forest` - Forest gradient (11998e → 38ef7d)

### Enhanced Shadows

- `--shadow-2xl` - Extra large shadow (25px blur)
- `--shadow-inner` - Inset shadow for pressed states

---

## ✅ Best Practices

### DO's ✅

1. **Use semantic HTML** - `<button>` for actions, `<a>` for links
2. **Add touch targets** - Minimum 44px for mobile
3. **Include focus states** - All interactive elements
4. **Use proper labels** - Associate labels with form inputs
5. **Provide feedback** - Loading, success, error states
6. **Test dark mode** - Ensure contrast in both modes

### DON'Ts ❌

1. **Don't use emoji icons** - Use SVG icons instead
2. **Don't use scale()** - Causes layout shift
3. **Don't skip accessibility** - Add ARIA labels where needed
4. **Don't hardcode values** - Use CSS variables
5. **Don't over-animate** - Keep between 150-300ms
6. **Don't ignore mobile** - Test on small screens

---

## 🔄 Migration from Old Styles

### Update Existing Buttons

**Before:**
```jsx
<button className="btn">Click</button>
```

**After (with gradient):**
```jsx
<button className="btn gradient">Click</button>
```

### Update Tables

**Before:**
```jsx
<table>
  <thead>
    <tr>
      <th>Name</th>
    </tr>
  </thead>
</table>
```

**After:**
```jsx
<table className="modern">
  <thead>
    <tr>
      <th className="sortable">Name</th>
    </tr>
  </thead>
</table>
```

### Update Cards

**Before:**
```jsx
<div className="card">
  <h3>Title</h3>
</div>
```

**After:**
```jsx
<div className="card modern">
  <h3 className="title">Title</h3>
</div>
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

---

## 🌐 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (with -webkit- prefixes)
- IE11: ❌ Not supported (use CSS variables with care)

---

## 📚 Additional Resources

- [Design System v2.0](./DESIGN_SYSTEM.md)
- [CSS Variables](./index.css)
- [Component Examples](./src/components/)

---

**Last Updated:** 2026-01-20
**Version:** 3.0
