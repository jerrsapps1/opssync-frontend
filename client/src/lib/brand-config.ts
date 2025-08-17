export interface BrandConfig {
  appName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}

export const brandConfig: BrandConfig = {
  appName: import.meta.env.VITE_BRAND_NAME || "OpsSync.ai",
  tagline: import.meta.env.VITE_BRAND_TAGLINE || "Repair Shop Management",
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "#4A90E2",
  secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || "#BB86FC",
  logoUrl: import.meta.env.VITE_LOGO_URL || "https://cdn-icons-png.flaticon.com/512/2920/2920579.png",
};
