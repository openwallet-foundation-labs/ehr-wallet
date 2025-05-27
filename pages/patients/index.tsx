import PatientList from "../../components/PatientList";
import { MainLayout } from "../../components/layout/MainLayout";
import Head from "next/head";

export default function PatientsPage() {
  return (
    <>
      <Head>
        <title>Patient List - GlobalRad</title>
        <meta name="description" content="View and manage patients in the GlobalRad system" />
      </Head>
      <PatientList />
    </>
  );
}
