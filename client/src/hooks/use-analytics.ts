import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>('');
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (initialLoadRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
      initialLoadRef.current = false;
      return;
    }

    if (location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};
