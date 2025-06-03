'use client';

import { useEffect } from 'react';
import { useClickTracker } from '@/hooks/useClickTracker';

/**
 * Component that automatically tracks clicks on elements with data-track attribute
 * Wrap your app with this component to enable click tracking
 */
export default function ClickTracker() {
  const { trackClick } = useClickTracker();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element or any of its parents have data-track attribute
      const trackedElement = target.closest('[data-track]');
      
      if (trackedElement) {
        trackClick(event as any);
      }
    };

    // Add click event listener to the document
    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [trackClick]);

  return null;
}
