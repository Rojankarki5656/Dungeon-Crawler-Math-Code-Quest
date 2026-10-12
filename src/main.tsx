import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useGameStore } from './state/store';


if (import.meta.env.DEV) {
  (window as any).__dcqStore = useGameStore;
}

// Prevent browser scrolling from game keys without interfering with form inputs.
window.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  const isFormField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' ||
    target?.tagName === 'SELECT' || Boolean(target?.isContentEditable);
  if (isFormField) return;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });

// Kill the browser context menu — this is a game, not a document.
window.addEventListener('contextmenu', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);