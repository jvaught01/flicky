import React from 'react';
import ReactDOM from 'react-dom/client';
import { PanelApp } from './components/PanelApp';
import './styles/design-system.css';
import './styles/panel.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PanelApp />
  </React.StrictMode>,
);
