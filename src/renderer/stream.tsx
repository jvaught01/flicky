import React from 'react';
import ReactDOM from 'react-dom/client';
import { StreamApp } from './components/StreamApp';
import './styles/design-system.css';
import './styles/stream.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StreamApp />
  </React.StrictMode>,
);
