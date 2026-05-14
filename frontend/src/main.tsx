import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Inject external fonts
const fontLink1 = document.createElement('link');
fontLink1.rel = 'stylesheet';
fontLink1.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap';
document.head.appendChild(fontLink1);

const fontLink2 = document.createElement('link');
fontLink2.rel = 'stylesheet';
fontLink2.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap';
document.head.appendChild(fontLink2);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
