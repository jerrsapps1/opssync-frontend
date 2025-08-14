import { useQuery } from "@tanstack/react-query";

interface TenantFeatures {
  supervisor?: boolean;
  manager?: boolean;
  sla?: boolean;
  reminders?: boolean;
  escalations?: boolean;
  weekly_digest?: boolean;
}

export function useTenantFeatures() {
  const { data: features, isLoading: loading, error } = useQuery<TenantFeatures>({
    queryKey: ["/api/org-admin/features"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    features: features || {},
    loading,
    error,
  };
}