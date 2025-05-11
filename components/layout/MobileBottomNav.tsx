import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Users, Calendar, FileText, Settings } from "lucide-react";

export function MobileBottomNav() {
  const router = useRouter();
  
  const routes = [
    { href: "/", label: "Home", icon: Home },
    { href: "/patients", label: "Patients", icon: Users },
    { href: "/schedule", label: "Schedule", icon: Calendar, highlight: true },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 pb-2">
      <nav className="flex justify-around items-center h-16 mb-1">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <Link 
              key={route.href}
              href={route.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive(route.href)
                  ? "text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              } ${
                route.highlight ? "font-semibold" : ""
              }`}
            >
              <span className={
                isActive(route.href)
                  ? "flex items-center justify-center rounded-full bg-primary text-white h-10 w-10 border-2 border-primary shadow-md"
                  : "flex items-center justify-center h-10 w-10"
              }>
                <Icon className={
                  isActive(route.href)
                    ? "h-6 w-6 text-white"
                    : `${route.highlight ? "h-6 w-6" : "h-5 w-5"}`
                } />
              </span>
              <span className={
                isActive(route.href)
                  ? "text-xs mt-1 font-semibold text-white drop-shadow-sm"
                  : "text-xs mt-1 text-gray-500 dark:text-gray-400"
              }>{route.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
