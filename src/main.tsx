import { createRoot } from "react-dom/client";

import "@fontsource/playwrite-nz-basic";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>
);
