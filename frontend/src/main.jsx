import { createRoot } from 'react-dom/client';

import './index.css';
import './assets/style/bar.css';
import './assets/style/button.css';
import './assets/style/card.css';
import './assets/style/form.css';
import './assets/style/tab-content.css';
import './assets/style/table.css';
import './assets/style/tag.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <App />,
)
