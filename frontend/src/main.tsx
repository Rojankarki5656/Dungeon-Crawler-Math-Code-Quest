import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useGameStore } from './state/store';


if (import.meta.env.DEV) {
  (window as any).__dcqStore = useGameStore;
}

// Prevent arrow-key page scrolling — but only when the user is NOT typing.
window.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement | null;
  const tag = t?.tagName;
  const isFormField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable;
  if (isFormField) return;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });

// Kill the browser context menu — this is a game, not a document.
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Prevent arrow-key page scrolling.
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') e.preventDefault();
  }
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);