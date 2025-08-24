import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App";
import "./src/index.css";

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");

createRoot(el).render(<App />);