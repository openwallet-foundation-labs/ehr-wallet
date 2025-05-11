import PatientRegister from "../../components/PatientRegister";
import { MainLayout } from "../../components/layout/MainLayout";
import Head from "next/head";

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Register Patient - RadGlobal RIS</title>
        <meta name="description" content="Register new patients in the RadGlobal RIS system" />
      </Head>
      <MainLayout>
        <PatientRegister />
      </MainLayout>
    </>
  );
}
