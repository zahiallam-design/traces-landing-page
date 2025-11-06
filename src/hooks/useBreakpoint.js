import { useState, useEffect } from 'react';

// Custom breakpoints as specified
const breakpoints = {
  xs: 0,
  ss: 300,
  sm: 600,
  ms: 750,
  md: 900,
  ml: 1000,
  lg: 1200,
  mx: 1300,
  xt: 1440,
  xl: 1728,
  xxl: 1820,
};

/**
 * Custom hook to get current breakpoint based on window width
 * @returns {string} Current breakpoint name (xs, ss, sm, ms, md, ml, lg, mx, xt, xl, xxl)
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'xs';
    return getBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Get breakpoint name based on width
 */
function getBreakpoint(width) {
  const entries = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
  
  for (const [name, value] of entries) {
    if (width >= value) {
      return name;
    }
  }
  
  return 'xs';
}

/**
 * Hook to check if current breakpoint matches conditions
 * @param {string|string[]} conditions - Breakpoint name(s) to check
 * @param {string} operator - 'up' (>=) or 'down' (<=)
 * @returns {boolean}
 */
export function useMediaQuery(conditions, operator = 'up') {
  const breakpoint = useBreakpoint();
  const currentValue = breakpoints[breakpoint] || 0;
  
  if (Array.isArray(conditions)) {
    return conditions.some(condition => {
      const conditionValue = breakpoints[condition] || 0;
      return operator === 'up' 
        ? currentValue >= conditionValue 
        : currentValue <= conditionValue;
    });
  }
  
  const conditionValue = breakpoints[conditions] || 0;
  return operator === 'up' 
    ? currentValue >= conditionValue 
    : currentValue <= conditionValue;
}

// Export breakpoints for use in components
export { breakpoints };

