import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

try { document.documentElement.classList.toggle('reduce-motion', localStorage.getItem('daylight.reduced') === 'true'); } catch { /* Browser may disable preferences storage. */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>,
);
