import "@/lib/crypto-polyfill";
import "@fontsource/inter";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SessionWrapper } from "@/components/SessionWrapper";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Head from "next/head";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { usePWA } from "@/hooks/use-pwa";
import { AppLayout } from "@/components/layout/AppLayout";
import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { MetaMaskProvider } from "@/components/web3/MetaMaskProvider";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { theme } from "@/lib/theme";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const [showSplash, setShowSplash] = useState(true);
  const { isStandalone } = usePWA();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>EHR Wallet - Patient Health Data</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GlobalRad" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <ColorSchemeScript defaultColorScheme="light" />
      </Head>
      <SessionProvider session={pageProps.session}>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme} defaultColorScheme="light">
            <Notifications position="top-right" />
            <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
              <TooltipProvider>
                {showSplash && isStandalone && <SplashScreen />}

                <OfflineIndicator />

                <UpdateNotification />

                <SessionWrapper>
                  <AppLayout>
                    <MetaMaskProvider>
                      <Component {...pageProps} />
                    </MetaMaskProvider>
                  </AppLayout>
                </SessionWrapper>

                <InstallPrompt />

                <Toaster />
                <Sonner />
              </TooltipProvider>
            </ThemeProvider>
          </MantineProvider>
        </QueryClientProvider>
      </SessionProvider>
    </>
  );
}
