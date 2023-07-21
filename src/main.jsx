import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.jsx";
import ThemeProvider from "./components/theme-provider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <App />
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
