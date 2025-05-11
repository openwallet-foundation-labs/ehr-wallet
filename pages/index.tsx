
import Dashboard from "./Dashboard";
import { MainLayout } from "@/components/layout/MainLayout";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>RadGlobal RIS - Imaging Hub</title>
        <meta name="description" content="Modern radiology information system for patient management and PACS integration" />
      </Head>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </>
  );
}
