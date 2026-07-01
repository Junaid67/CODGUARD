import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppBridgeProvider } from './providers/AppBridgeProvider';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppBridgeProvider>
        <App />
      </AppBridgeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
