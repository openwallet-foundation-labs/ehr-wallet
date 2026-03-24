import React from "react";
import { useForm } from "react-hook-form";
import { Card, Text, Button, Switch, Avatar, Divider, TextInput, Textarea, Title } from "@mantine/core";

export default function Settings() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      bio: "Radiologist at RadGlobal",
      notifications: true,
      marketing: false,
      password: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const onSubmit = (data: any) => {
    // Mock submit handler
    alert("Settings saved!\n" + JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 0.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3}>Profile</Title>
        <Text size="sm" c="dimmed" mb="md">Update your personal information.</Text>
        <Divider mb="md" />
        <form style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Avatar src="/avatar-placeholder.png" alt="User avatar" radius="xl" size="lg">
              JD
            </Avatar>
            <div>
              <Text size="sm" fw={500} mb={4}>Name</Text>
              <TextInput
                id="name"
                {...register("name", { required: true })}
                error={errors.name ? "Name is required" : undefined}
              />
            </div>
          </div>
          <div>
            <Text size="sm" fw={500} mb={4}>Email</Text>
            <TextInput
              id="email"
              type="email"
              {...register("email", { required: true })}
              error={errors.email ? "Email is required" : undefined}
            />
          </div>
          <div>
            <Text size="sm" fw={500} mb={4}>Bio</Text>
            <Textarea id="bio" {...register("bio")} />
          </div>
          <Button type="submit" loading={isSubmitting} mt="sm">Save Profile</Button>
        </form>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3}>Password</Title>
        <Text size="sm" c="dimmed" mb="md">Change your account password.</Text>
        <Divider mb="md" />
        <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Text size="sm" fw={500} mb={4}>Current Password</Text>
            <TextInput id="password" type="password" {...register("password")} />
          </div>
          <div>
            <Text size="sm" fw={500} mb={4}>New Password</Text>
            <TextInput id="newPassword" type="password" {...register("newPassword")} />
          </div>
          <div>
            <Text size="sm" fw={500} mb={4}>Confirm New Password</Text>
            <TextInput id="confirmPassword" type="password" {...register("confirmPassword")} />
          </div>
          <Button type="submit" variant="light" loading={isSubmitting}>Update Password</Button>
        </form>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3}>Preferences</Title>
        <Text size="sm" c="dimmed" mb="md">Manage your notification and marketing preferences.</Text>
        <Divider mb="md" />
        <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text size="sm" fw={500}>Email Notifications</Text>
              <Text size="xs" c="dimmed">Receive updates about appointments and reports.</Text>
            </div>
            <Switch id="notifications" {...register("notifications")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text size="sm" fw={500}>Marketing Emails</Text>
              <Text size="xs" c="dimmed">Get product news and feature updates.</Text>
            </div>
            <Switch id="marketing" {...register("marketing")} />
          </div>
          <Button type="submit" variant="outline" loading={isSubmitting}>Save Preferences</Button>
        </form>
      </Card>
    </div>
  );
}
