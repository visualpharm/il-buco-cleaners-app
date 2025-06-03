'use client';

import { useCallback } from 'react';
import { trackClick as trackClickApi } from '@/lib/analytics';

interface ClickEvent extends MouseEvent {
  target: HTMLElement;
}

export interface ClickTrackerOptions {
  elementId?: string;
  elementType?: string;
  pageUrl?: string;
  xPosition?: number;
  yPosition?: number;
  screenResolution?: string;
  userAgent?: string;
  referrer?: string;
}

interface ClickTrackerReturn {
  trackElement: (element: HTMLElement | null) => (() => void) | undefined;
  trackClick: (options: ClickTrackerOptions) => Promise<boolean>;
}

export function useClickTracker(): ClickTrackerReturn {
  // Function to handle click events on tracked elements
  const handleTrackedClick = useCallback(async (event: MouseEvent) => {
    try {
      const target = event.target as HTMLElement;
      
      // Get element details
      const elementId = target.id || target.getAttribute('data-track-id') || '';
      const elementType = target.tagName.toLowerCase();
      
      // Only track if element has an ID or data-track-id attribute
      if (!elementId) return;
      
      // Track the click
      await trackClickApi({
        elementId,
        elementType,
        pageUrl: window.location.pathname,
        xPosition: event.clientX,
        yPosition: event.clientY,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  // Function to add click listener to an element
  const trackElement = useCallback((element: HTMLElement | null): (() => void) | undefined => {
    if (!element) return undefined;
    
    const clickHandler = (event: Event) => {
      handleTrackedClick(event as MouseEvent);
    };
    
    element.addEventListener('click', clickHandler);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('click', clickHandler);
    };
  }, [handleTrackedClick]);

  // Function to manually track a click with custom data
  const trackClick = useCallback(async (options: ClickTrackerOptions): Promise<boolean> => {
    try {
      const result = await trackClickApi({
        elementId: options.elementId || 'custom',
        elementType: options.elementType || 'custom',
        pageUrl: options.pageUrl || window.location.pathname,
        xPosition: options.xPosition,
        yPosition: options.yPosition,
        screenResolution: options.screenResolution || 
          `${window.screen.width}x${window.screen.height}`,
        userAgent: options.userAgent || navigator.userAgent,
        referrer: options.referrer || document.referrer,
      });
      
      return result;
    } catch (error) {
      console.error('Error tracking custom click:', error);
      return false;
    }
  }, []);

  return { trackElement, trackClick };
}
