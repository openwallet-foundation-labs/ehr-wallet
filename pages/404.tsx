import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found - GlobalRad</title>
        <meta name="description" content="The page you are looking for does not exist" />
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/" passHref>
          <Button>Return to Home</Button>
        </Link>
      </div>
    </>
  );
}
