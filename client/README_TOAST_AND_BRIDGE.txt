Toasts + Realtime Bridge
------------------------
Mount both providers once at the app root:

import { ToastProvider } from "@/ui/toast";
import RealtimeBridge from "@/realtime/RealtimeBridge";

<QueryClientProvider client={queryClient}>
  <ToastProvider />
  <RealtimeBridge />
  {/* ...rest of app */}
</QueryClientProvider>
