import { useState, useEffect } from "react";

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Only show splash screen for a short time
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-24 h-24 mb-4">
        <img 
          src="/icons/icon-512x512.png" 
          alt="GlobalRad Logo" 
          className="w-full h-full"
        />
      </div>
      <h1 className="text-2xl font-bold text-primary mb-2">GlobalRad</h1>
      <p className="text-gray-500 dark:text-gray-400">Imaging Hub</p>
      <div className="mt-8 w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-pulse"></div>
      </div>
    </div>
  );
}
