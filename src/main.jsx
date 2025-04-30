import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "material-design-lite/material.min.css";
import "material-design-lite/material.min.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize MDL components after the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  if (window.componentHandler) {
    window.componentHandler.upgradeAllRegistered();
  }
});

