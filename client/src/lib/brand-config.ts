export interface BrandConfig {
  appName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}

export const brandConfig: BrandConfig = {
  appName: import.meta.env.VITE_BRAND_NAME || "Asset Tracker Pro",
  tagline: import.meta.env.VITE_BRAND_TAGLINE || "Workforce & Equipment",
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "#3182CE",
  secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || "#38B2AC",
  logoUrl: import.meta.env.VITE_LOGO_URL || "https://cdn-icons-png.flaticon.com/512/2920/2920579.png",
};
