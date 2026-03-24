import Head from "next/head";
import Link from "next/link";
import { Button, Title, Text, Center, Stack } from "@mantine/core";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found - GlobalRad</title>
        <meta name="description" content="The page you are looking for does not exist" />
      </Head>
      <Center style={{ minHeight: '100vh', padding: '1rem' }}>
        <Stack align="center" gap="md">
          <Title order={1} style={{ fontSize: '3.75rem', fontWeight: 700, color: 'var(--mantine-color-primary)' }}>404</Title>
          <Title order={2} style={{ fontSize: '1.5rem', fontWeight: 600 }}>Page Not Found</Title>
          <Text c="dimmed" maw={400} ta="center">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </Text>
          <Link href="/" passHref>
            <Button mt="md">Return to Home</Button>
          </Link>
        </Stack>
      </Center>
    </>
  );
}
