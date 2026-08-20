import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n.js'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import { ToastProvider } from './context/ToastContext.jsx'

// Intercept relative fetch requests to prepend dynamic VITE_API_URL
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  if (typeof input === "string" && (input.startsWith("/api") || input.startsWith("/orders"))) {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    input = `${baseUrl}${input}`;
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </Provider>
  </StrictMode>,
)