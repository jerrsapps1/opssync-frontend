import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ToastProvider } from "./ui/toast";
import RealtimeBridge from "./realtime/RealtimeBridge";
import "./index.css";
import "./styles/dnd.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ToastProvider />
    <RealtimeBridge />
    <App />
  </QueryClientProvider>
);
