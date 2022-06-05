import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { MoralisProvider } from "react-moralis";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MoralisProvider serverUrl="https://jn8bj017hxso.usemoralis.com:2053/server" appId="814p0lAHfYBrJQHA8u3c83o3Uo2fSzGsdsHq5AOy">
      <App />
    </MoralisProvider>
  </React.StrictMode>
);
