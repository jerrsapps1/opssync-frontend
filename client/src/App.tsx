import React from "react";
import { Route } from "wouter";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import pages
import Dashboard from "./pages/dashboard";
import Settings from "./pages/settings";
import AcceptInvite from "./pages/AcceptInvite";
import Login from "./pages/Login";

// Query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Main App Layout
function AppLayout() {
  return (
    <div>
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/settings" component={Settings} />
      <Route path="/" component={Dashboard} />
    </div>
  );
}

// Auth wrapper
function AuthWrapper() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Login />;
  }
  
  return <AppLayout />;
}

// Root App
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper />
    </QueryClientProvider>
  );
}