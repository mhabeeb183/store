import React from "react";
import "./i18n";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import axios from "axios";
import { logout } from "./redux/authSlice";

import { Provider } from "react-redux";
import { store } from "./redux/store";

import { BrowserRouter } from "react-router-dom";

// Global Axios Request Interceptor to dynamically rewrite localhost:5000 to correct backend host
axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.includes("localhost:5000")) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL;
      const backendUrl = socketUrl && !socketUrl.includes("localhost")
        ? socketUrl
        : `${window.location.protocol}//${window.location.host}`;
      config.url = config.url.replace("http://localhost:5000", backendUrl);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Axios Interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);