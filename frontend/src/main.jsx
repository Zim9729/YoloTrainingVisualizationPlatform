import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './index.css';
import './assets/style/bar.css';
import './assets/style/button.css';
import './assets/style/card.css';
import './assets/style/form.css';
import './assets/style/tab-content.css';
import './assets/style/table.css';
import './assets/style/tag.css';
import './assets/style/animation.css';
import './assets/style/toast.css';
import './assets/style/modal.css';
import './assets/style/glassmorphism.css';

import { router } from './router.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ApiErrorListener } from './components/ApiErrorListener';

// 根应用组件 - 包含所有全局 Provider
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ApiErrorListener />
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')).render(<App />);
