import { useState } from 'react';
import { useSession } from 'next-auth/react';
import PatientLayout from '@/components/layout/PatientLayout';
import { Card, Text, Button, Switch, TextInput, Divider, Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function PatientSettingsPage() {
  const { data: session } = useSession();

  // Profile settings
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [dataAccessAlerts, setDataAccessAlerts] = useState(true);

  // Privacy settings
  const [autoApproveProviders, setAutoApproveProviders] = useState(false);
  const [shareAnonymizedData, setShareAnonymizedData] = useState(false);

  // Handle profile update
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API to update the user profile
    notifications.show({
      title: 'Profile Updated',
      message: 'Your profile information has been updated successfully.',
    });
  };

  // Handle notification settings update
  const handleNotificationUpdate = () => {
    // In a real app, this would call an API to update notification preferences
    notifications.show({
      title: 'Notification Settings Updated',
      message: 'Your notification preferences have been saved.',
    });
  };

  // Handle privacy settings update
  const handlePrivacyUpdate = () => {
    // In a real app, this would call an API to update privacy settings
    notifications.show({
      title: 'Privacy Settings Updated',
      message: 'Your privacy preferences have been saved.',
    });
  };

  return (
    <PatientLayout>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <Text fw={700} size="xl" mb="xs">Account Settings</Text>
        <Text c="dimmed" mb="xl">
          Manage your account preferences and settings
        </Text>

        <Tabs defaultValue="profile">
          <Tabs.List mb="xl">
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
            <Tabs.Tab value="privacy">Privacy & Security</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="profile">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={700} size="lg" mb="xs">Profile Information</Text>
              <Text size="sm" c="dimmed" mb="md">
                Update your personal information and contact details
              </Text>
              <Divider mb="md" />
              <form onSubmit={handleProfileUpdate}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Full Name</Text>
                    <TextInput
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Text size="sm" fw={500} mb={4}>Email Address</Text>
                    <TextInput
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                    />
                  </div>

                  <div>
                    <Text size="sm" fw={500} mb={4}>Phone Number</Text>
                    <TextInput
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                <Button type="submit" mt="md">Save Changes</Button>
              </form>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="notifications">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={700} size="lg" mb="xs">Notification Preferences</Text>
              <Text size="sm" c="dimmed" mb="md">
                Control how and when you receive notifications
              </Text>
              <Divider mb="md" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text size="sm" fw={500}>Email Notifications</Text>
                    <Text size="xs" c="dimmed">
                      Receive notifications via email
                    </Text>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onChange={(event) => setEmailNotifications(event.currentTarget.checked)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text size="sm" fw={500}>Appointment Reminders</Text>
                    <Text size="xs" c="dimmed">
                      Receive reminders about upcoming appointments
                    </Text>
                  </div>
                  <Switch
                    id="appointment-reminders"
                    checked={appointmentReminders}
                    onChange={(event) => setAppointmentReminders(event.currentTarget.checked)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text size="sm" fw={500}>Data Access Alerts</Text>
                    <Text size="xs" c="dimmed">
                      Get notified when someone accesses your medical data
                    </Text>
                  </div>
                  <Switch
                    id="data-access-alerts"
                    checked={dataAccessAlerts}
                    onChange={(event) => setDataAccessAlerts(event.currentTarget.checked)}
                  />
                </div>
              </div>
              <Button onClick={handleNotificationUpdate} mt="md">Save Preferences</Button>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="privacy">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={700} size="lg" mb="xs">Privacy & Security</Text>
              <Text size="sm" c="dimmed" mb="md">
                Manage your data sharing and security preferences
              </Text>
              <Divider mb="md" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text size="sm" fw={500}>Auto-approve Trusted Providers</Text>
                    <Text size="xs" c="dimmed">
                      Automatically approve data access requests from your primary care providers
                    </Text>
                  </div>
                  <Switch
                    id="auto-approve"
                    checked={autoApproveProviders}
                    onChange={(event) => setAutoApproveProviders(event.currentTarget.checked)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text size="sm" fw={500}>Share Anonymized Data</Text>
                    <Text size="xs" c="dimmed">
                      Allow your anonymized medical data to be used for research purposes
                    </Text>
                  </div>
                  <Switch
                    id="anonymized-data"
                    checked={shareAnonymizedData}
                    onChange={(event) => setShareAnonymizedData(event.currentTarget.checked)}
                  />
                </div>

                <Divider my="md" />
                <div>
                  <Text fw={500} size="md" mb="sm">Security Options</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Button variant="outline" fullWidth style={{ justifyContent: 'flex-start' }}>
                      Change Password
                    </Button>
                    <Button variant="outline" fullWidth style={{ justifyContent: 'flex-start' }}>
                      Two-Factor Authentication
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      style={{ justifyContent: 'flex-start', color: 'var(--mantine-color-red-6)' }}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
              <Button onClick={handlePrivacyUpdate} mt="md">Save Settings</Button>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </div>
    </PatientLayout>
  );
}
