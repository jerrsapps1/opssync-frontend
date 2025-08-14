// Client-side feature flags from Vite environment variables
export const FEATURES = {
  SUPERVISOR: import.meta.env.VITE_FEATURE_SUPERVISOR === '1',
  MANAGER: import.meta.env.VITE_FEATURE_MANAGER === '1',
  SLA: import.meta.env.VITE_FEATURE_SLA === '1', 
  REMINDERS: import.meta.env.VITE_FEATURE_REMINDERS === '1',
  ESCALATIONS: import.meta.env.VITE_FEATURE_ESCALATIONS === '1',
  WEEKLY_DIGEST: import.meta.env.VITE_FEATURE_WEEKLY_DIGEST === '1',
};

// Default to all features enabled for development if no env vars set
if (import.meta.env.DEV) {
  const hasAnyFeatureFlag = Object.keys(import.meta.env).some(key => key.startsWith('VITE_FEATURE_'));
  if (!hasAnyFeatureFlag) {
    Object.keys(FEATURES).forEach(key => {
      (FEATURES as any)[key] = true;
    });
  }
}

console.log('🎛️ Client feature flags:', FEATURES);