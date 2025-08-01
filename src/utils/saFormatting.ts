// South African localization utilities

/**
 * Format currency in South African Rand (ZAR)
 */
export const formatZAR = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date and time for South African timezone (SAST - UTC+2)
 */
export const formatSADateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24-hour format
  }).format(dateObj);
};

/**
 * Format date only for South African timezone
 */
export const formatSADate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Format time only for South African timezone
 */
export const formatSATime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24-hour format
  }).format(dateObj);
};

/**
 * Get current South African time
 */
export const getSACurrentTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Johannesburg"}));
};

/**
 * Convert any date to South African timezone
 */
export const toSATimezone = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.toLocaleString("en-US", {timeZone: "Africa/Johannesburg"}));
};