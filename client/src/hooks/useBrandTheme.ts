import { useEffect } from 'react';

interface BrandConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  headerBgColor?: string;
  sidebarBgColor?: string;
  buttonRadius?: number;
  fontFamily?: string;
}

export function useBrandTheme(brandConfig: BrandConfig) {
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply brand colors to CSS variables
    if (brandConfig.primaryColor) {
      root.style.setProperty('--brand-primary', brandConfig.primaryColor);
    }
    
    if (brandConfig.secondaryColor) {
      root.style.setProperty('--brand-secondary', brandConfig.secondaryColor);
    }
    
    if (brandConfig.accentColor) {
      root.style.setProperty('--brand-accent', brandConfig.accentColor);
    }
    
    if (brandConfig.textColor) {
      root.style.setProperty('--brand-text', brandConfig.textColor);
    }
    
    if (brandConfig.headerBgColor) {
      root.style.setProperty('--brand-header-bg', brandConfig.headerBgColor);
    }
    
    if (brandConfig.sidebarBgColor) {
      root.style.setProperty('--brand-sidebar-bg', brandConfig.sidebarBgColor);
    }
    
    if (brandConfig.buttonRadius !== undefined) {
      root.style.setProperty('--brand-button-radius', `${brandConfig.buttonRadius}px`);
    }
    
    if (brandConfig.fontFamily) {
      root.style.setProperty('--brand-font-family', brandConfig.fontFamily);
    }
    
    // Apply dynamic radius to buttons if specified
    if (brandConfig.buttonRadius !== undefined) {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        if (!button.style.borderRadius) {
          button.style.borderRadius = `${brandConfig.buttonRadius}px`;
        }
      });
    }
    
  }, [brandConfig]);
}