import { ReactNode } from "react";
import { MainLayout } from "./MainLayout";
import { useRouter } from "next/router";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const router = useRouter();
  
  // Pages that should use the MainLayout
  const pagesWithLayout = [
    "/Dashboard",
    "/PatientList",
    "/PatientRegister",
    "/ScheduleExam",
    "/settings",
    "/patients/register",
    "/patients",
    "/analytics"
    // Add other pages that should use the MainLayout
    // Note: "/" (home page) is excluded because it uses PatientLayout which already includes MainLayout
  ];
  
  // Check if current path should use MainLayout
  const shouldUseLayout = pagesWithLayout.some(path => 
    router.pathname === path || router.pathname.startsWith(`${path}/`)
  );
  
  // If the current page should use the layout, wrap it with MainLayout
  // Otherwise, render the page without the layout
  return shouldUseLayout ? <MainLayout>{children}</MainLayout> : <>{children}</>;
};
