import { useState, useEffect } from "react";

type MediaQueryOptions = {
  query: string;
  defaultValue?: boolean;
};

/**
 * Custom hook for responsive media queries
 * @param options Media query options
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery({ 
  query, 
  defaultValue = false 
}: MediaQueryOptions): boolean {
  // Always initialize with defaultValue for SSR consistency
  const [matches, setMatches] = useState<boolean>(defaultValue);
  // Track if we're on the client side
  const [isClient, setIsClient] = useState<boolean>(false);

  // Set isClient to true once the component is mounted
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Skip effect on server side
    if (!isClient) return;

    // Create media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }

    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", listener);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query, isClient]);

  return matches;
}

// Note: Predefined media query hooks have been moved to their own files
// to avoid duplicate hook definitions
