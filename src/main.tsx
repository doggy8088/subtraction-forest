import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

const root = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if (root.dataset.prerendered === 'true') ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
