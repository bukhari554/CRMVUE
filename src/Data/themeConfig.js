// src/Data/themeConfig.js

export const THEME_CONFIG = {
  // Colors
  colors: {
    primary: '#344767',
    secondary: '#8392ab',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#344767',
    muted: '#67748e',
    white: '#ffffff',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(310deg, #7928ca, #ff0080)',
    success: 'linear-gradient(310deg, #17ad37, #98ec2d)',
    danger: 'linear-gradient(310deg, #ea0606, #ff667c)',
    warning: 'linear-gradient(310deg, #f53939, #fbcf33)',
    info: 'linear-gradient(310deg, #2152ff, #21d4fd)',
    dark: 'linear-gradient(310deg, #141727, #3a416f)',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.375rem',      // 6px
    md: '0.5rem',        // 8px
    lg: '0.75rem',       // 12px - Default for CRM
    xl: '1rem',          // 16px
    '2xl': '1.5rem',     // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.15)',
    '2xl': '0 20px 40px rgba(0, 0, 0, 0.2)',
  },

  // Spacing
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },

  // Typography
  typography: {
    fontFamily: {
      base: '"Open Sans", sans-serif',
      heading: '"Roboto", sans-serif',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Transitions
  transitions: {
    fast: 'all 0.15s ease-in-out',
    base: 'all 0.3s ease-in-out',
    slow: 'all 0.5s ease-in-out',
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Card Defaults (CRM specific)
  cardDefaults: {
    borderRadius: 'lg',
    shadow: 'sm',
    padding: 'lg',
    variant: 'default',
  },

  // Button Defaults (CRM specific)
  buttonDefaults: {
    borderRadius: 'md',
    size: 'md',
    variant: 'solid',
  },
};

export default THEME_CONFIG;