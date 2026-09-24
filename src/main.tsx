import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './hooks/useAppData';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root was not found');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
