import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

const teal: MantineColorsTuple = [
  '#e6fcf5',
  '#c3fae8',
  '#96f2d7',
  '#63e6be',
  '#38d9a9',
  '#20c997',
  '#12b886',
  '#0ca678',
  '#099268',
  '#087f5b',
];

const blue: MantineColorsTuple = [
  '#e3f2fd',
  '#bbdefb',
  '#90caf9',
  '#64b5f6',
  '#42a5f5',
  '#2196f3',
  '#1e88e5',
  '#1976d2',
  '#1565c0',
  '#0d47a1',
];

export const theme = createTheme({
  primaryColor: 'teal',
  colors: {
    teal,
    blue,
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '1.2' },
      h2: { fontSize: '1.875rem', lineHeight: '1.3' },
      h3: { fontSize: '1.5rem', lineHeight: '1.4' },
      h4: { fontSize: '1.25rem', lineHeight: '1.4' },
      h5: { fontSize: '1.125rem', lineHeight: '1.5' },
      h6: { fontSize: '1rem', lineHeight: '1.5' },
    },
  },
  defaultRadius: 'md',
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Tabs: {
      defaultProps: {
        variant: 'pills',
        radius: 'lg',
      },
      styles: {
        root: {
          gap: '8px',
        },
        tab: {
          fontWeight: 600,
          fontSize: '0.95rem',
          padding: '12px 20px',
          transition: 'all 200ms ease',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-teal-0)',
            color: 'var(--mantine-color-teal-7)',
          },
          '&[data-active]': {
            backgroundColor: 'var(--mantine-color-teal-6)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(32, 201, 151, 0.4)',
          },
        },
        list: {
          borderBottom: 'none',
        },
      },
    },
  },
});
