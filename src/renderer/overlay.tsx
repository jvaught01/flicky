import React from 'react';
import ReactDOM from 'react-dom/client';
import { OverlayApp } from './components/OverlayApp';
import './styles/design-system.css';
import './styles/overlay.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OverlayApp />
  </React.StrictMode>,
);
