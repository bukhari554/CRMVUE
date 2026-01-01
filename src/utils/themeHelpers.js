// src/utils/themeHelpers.js
import THEME_CONFIG from '@/Data/themeConfig.js';

/**
 * Get color value from theme config
 */
export const getColor = (colorName) => {
  return THEME_CONFIG.colors[colorName] || colorName;
};

/**
 * Get gradient value from theme config
 */
export const getGradient = (gradientName) => {
  return THEME_CONFIG.gradients[gradientName] || gradientName;
};

/**
 * Get border radius value
 */
export const getBorderRadius = (size) => {
  return THEME_CONFIG.borderRadius[size] || size;
};

/**
 * Get shadow value
 */
export const getShadow = (size) => {
  return THEME_CONFIG.shadows[size] || size;
};

/**
 * Get spacing value
 */
export const getSpacing = (size) => {
  return THEME_CONFIG.spacing[size] || size;
};

/**
 * Generate card styles
 */
export const generateCardStyles = (options = {}) => {
  const {
    variant = 'default',
    rounded = 'lg',
    shadow = 'sm',
    padding = 'lg',
    color = 'white',
    borderColor = '#e9ecef',
    fullHeight = false,
  } = options;

  const styles = {
    borderRadius: getBorderRadius(rounded),
    padding: getSpacing(padding),
    transition: THEME_CONFIG.transitions.base,
  };

  // Variant styles
  switch (variant) {
    case 'gradient':
      styles.background = getGradient(color);
      styles.color = 'white';
      styles.boxShadow = getShadow(shadow);
      styles.border = 'none';
      break;

    case 'bordered':
      styles.backgroundColor = 'white';
      styles.border = `1px solid ${borderColor}`;
      styles.boxShadow = 'none';
      break;

    case 'shadow':
      styles.backgroundColor = color === 'white' ? 'white' : getColor(color);
      styles.boxShadow = getShadow(shadow);
      styles.border = 'none';
      break;

    case 'flat':
      styles.backgroundColor = color === 'white' ? 'white' : getColor(color);
      styles.boxShadow = 'none';
      styles.border = 'none';
      break;

    default: // 'default'
      styles.backgroundColor = 'white';
      styles.boxShadow = getShadow(shadow);
      styles.border = 'none';
  }

  if (fullHeight) {
    styles.height = '100%';
  }

  return styles;
};

/**
 * Generate button styles
 */
export const generateButtonStyles = (options = {}) => {
  const {
    variant = 'solid',
    color = 'primary',
    size = 'md',
    rounded = 'md',
    fullWidth = false,
  } = options;

  const baseColor = getColor(color);
  const styles = {
    borderRadius: getBorderRadius(rounded),
    transition: THEME_CONFIG.transitions.base,
    fontWeight: THEME_CONFIG.typography.fontWeight.semibold,
  };

  // Size styles
  const sizeMap = {
    xs: { padding: '0.25rem 0.5rem', fontSize: THEME_CONFIG.typography.fontSize.xs },
    sm: { padding: '0.375rem 0.75rem', fontSize: THEME_CONFIG.typography.fontSize.sm },
    md: { padding: '0.5rem 1rem', fontSize: THEME_CONFIG.typography.fontSize.base },
    lg: { padding: '0.625rem 1.25rem', fontSize: THEME_CONFIG.typography.fontSize.lg },
    xl: { padding: '0.75rem 1.5rem', fontSize: THEME_CONFIG.typography.fontSize.xl },
  };
  Object.assign(styles, sizeMap[size]);

  // Variant styles
  switch (variant) {
    case 'gradient':
      styles.background = getGradient(color);
      styles.color = 'white';
      styles.border = 'none';
      break;
    case 'outline':
      styles.backgroundColor = 'transparent';
      styles.color = baseColor;
      styles.border = `2px solid ${baseColor}`;
      break;
    case 'ghost':
      styles.backgroundColor = 'transparent';
      styles.color = baseColor;
      styles.border = 'none';
      break;
    case 'link':
      styles.backgroundColor = 'transparent';
      styles.color = baseColor;
      styles.border = 'none';
      styles.textDecoration = 'underline';
      break;
    default: // solid
      styles.backgroundColor = baseColor;
      styles.color = 'white';
      styles.border = 'none';
  }

  if (fullWidth) {
    styles.width = '100%';
  }

  return styles;
};