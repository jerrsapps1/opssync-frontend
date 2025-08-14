// Global feature flags from environment variables
export const features = {
  SUPERVISOR: process.env.FEATURE_SUPERVISOR === '1',
  MANAGER: process.env.FEATURE_MANAGER === '1', 
  SLA: process.env.FEATURE_SLA === '1',
  REMINDERS: process.env.FEATURE_REMINDERS === '1',
  ESCALATIONS: process.env.FEATURE_ESCALATIONS === '1',
  WEEKLY_DIGEST: process.env.FEATURE_WEEKLY_DIGEST === '1',
  WALLETS_INFO: process.env.FEATURE_WALLETS_INFO === '1',
};

// Default to all features enabled for development if no env vars set
if (process.env.NODE_ENV === 'development') {
  const hasAnyFeatureFlag = Object.keys(process.env).some(key => key.startsWith('FEATURE_'));
  if (!hasAnyFeatureFlag) {
    Object.keys(features).forEach(key => {
      (features as any)[key] = true;
    });
  }
}

console.log('🎛️ Feature flags:', features);