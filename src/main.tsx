import React from 'react';
import { createRoot } from 'react-dom/client';
import { z } from 'zod';
import { App } from './App';

// Отключаем Zod JIT чтобы избежать CSP нарушений (eval внутри JIT)
// Было в pages/_app.tsx
z.config({ jitless: true });

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
