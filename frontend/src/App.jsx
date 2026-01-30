// This file is kept for backwards compatibility but is no longer used.
// The application now uses RouterProvider in main.jsx with the router defined in router.jsx.
// All context providers are wrapped in main.jsx.

export default function App() {
    console.warn("App.jsx is deprecated. The application now uses React Router. See main.jsx for the new entry point.");
    return null;
}
