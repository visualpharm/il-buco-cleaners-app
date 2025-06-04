// Date and time formatting utilities for Il Buco Cleaners
// This file contains all date/time formatting functions used across the application

/**
 * Format time without seconds (e.g., "14:22")
 */
export const formatTimeShort = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Format time with seconds (e.g., "14:22:30")
 */
export const formatTimeFull = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format duration in MM:SS format (e.g., "0:15", "2:30")
 */
export const formatDurationShort = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format duration in verbose format (e.g., "2m 30s")
 */
export const formatDurationVerbose = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/**
 * Format duration in HH:MM format for longer durations (e.g., "1:25")
 */
export const formatDurationHours = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Format date for display (e.g., "Today 14:22", "Yesterday 09:15", "Jan 15, 10:30")
 */
export const formatDateDisplay = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();
  
  const timeStr = formatTimeShort(date);
  
  if (isSameDay(date, today)) {
    return `Today ${timeStr}`;
  } else if (isSameDay(date, yesterday)) {
    return `Yesterday ${timeStr}`;
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${timeStr}`;
  }
};

/**
 * Format date for page titles in Spanish (e.g., "Hoy", "Ayer", "Jun 2", "Dic 2, 2024")
 */
export const formatDateTitle = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();
  
  const isSameYear = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear();
  
  if (isSameDay(date, today)) {
    return 'Hoy';
  } else if (isSameDay(date, yesterday)) {
    return 'Ayer';
  } else if (isSameDay(date, dayBeforeYesterday)) {
    return 'Antes de ayer';
  } else {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (isSameYear(date, today)) {
      // Same year: "Jun 2", "Dic 15"
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    } else {
      // Different year: "Dic 2, 2024"
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
  }
};

/**
 * Format date for URLs (YYYY-MM-DD)
 */
export const formatDateForUrl = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if a duration seems unusual (too short or too long)
 */
export const isWeirdDuration = (ms: number): boolean => {
  return ms < 10000 || ms > 600000; // Less than 10 seconds or more than 10 minutes
};

/**
 * Format date for local display (e.g., "15/01/2024")
 */
export const formatDateLocal = (date: Date): string => {
  return date.toLocaleDateString('es-ES');
};

/**
 * Format full date and time for display (e.g., "15/01/2024 14:22")
 */
export const formatDateTimeFull = (date: Date): string => {
  return `${formatDateLocal(date)} ${formatTimeShort(date)}`;
};