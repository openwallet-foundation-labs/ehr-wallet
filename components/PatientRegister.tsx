import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { TextInput, Textarea, Button, Select, Card, Group, Stack, Text, Alert, Flex } from '@mantine/core';
import { User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const PatientRegister = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle select change
  const handleSelectChange = (value: string | null) => {
    setFormData(prev => ({
      ...prev,
      gender: value || ''
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.gender) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data for API
      const patientData = {
        name: `${formData.firstName} ${formData.lastName}`,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address
      };

      // Submit data to API
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register patient');
      }

      const result = await response.json();
      setSuccess(true);

      // Redirect to patient list after short delay
      setTimeout(() => {
        router.push('/PatientList');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="xl">
      {/* Header section */}
      <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align="flex-start" gap="md">
        <div>
          <Text size="xl" fw={700} style={{ fontSize: '1.875rem' }}>Patient Registration</Text>
          <Text size="sm" c="dimmed">Register a new patient in the system</Text>
        </div>
      </Flex>

      {/* Success message */}
      {success && (
        <Alert color="green" icon={<CheckCircle size={16} />} title="Registration successful">
          Patient has been registered successfully. Redirecting to patient list...
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert color="red" icon={<AlertCircle size={16} />} title="Error">
          {error}
        </Alert>
      )}

      <Card withBorder>
        <Card.Section p="lg" withBorder>
          <Group gap="xs">
            <User size={20} color="var(--mantine-color-blue-6)" />
            <Text size="lg" fw={600}>Patient Information</Text>
          </Group>
        </Card.Section>
        <Card.Section p="lg">
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <Group grow>
                <div>
                  <TextInput
                    label="First Name"
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <TextInput
                    label="Last Name"
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </Group>

              <Group grow>
                <div>
                  <TextInput
                    label="Date of Birth"
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Select
                    label="Gender"
                    id="gender"
                    placeholder="Select gender"
                    value={formData.gender}
                    onChange={handleSelectChange}
                    data={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    required
                  />
                </div>
              </Group>

              <Group grow>
                <div>
                  <TextInput
                    label="Phone Number"
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <TextInput
                    label="Email"
                    id="email"
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </Group>

              <div>
                <Textarea
                  label="Address"
                  id="address"
                  rows={3}
                  placeholder="Full address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <Group justify="flex-end" gap="md">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/PatientList')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  leftSection={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : undefined}
                >
                  {isSubmitting ? 'Processing...' : 'Register Patient'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card.Section>
      </Card>
    </Stack>
  );
};

export default PatientRegister;
