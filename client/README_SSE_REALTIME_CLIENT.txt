Client SSE Setup
-----------------
1) Add the bridge once under your App layout (inside QueryClientProvider):
   import RealtimeBridge from "@/realtime/RealtimeBridge";

   function AppRoot() {
     return (
       <QueryClientProvider client={queryClient}>
         <RealtimeBridge />
         {/* the rest of your app */}
       </QueryClientProvider>
     );
   }

2) No further changes needed. Assignment/Archive/Restore/Remove events
   will update React Query caches instantly across all open tabs.

3) To broadcast more things later, just emit from the server:
   broadcast({ type: "entity.updated", entity: "project", id, ...fields });
