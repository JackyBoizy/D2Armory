// frontend/src/main.jsx
import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  // If Vite template missing, create a root element so it still works in plain HTML
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
}

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// optional: accept HMR (Vite handles this automatically, but keep for safety)
if (import.meta.hot) {
  import.meta.hot.accept();
}
