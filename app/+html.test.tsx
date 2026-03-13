import React from 'react';
import { render } from '@testing-library/react-native';
import Root from './+html';
import { useLocale } from 'next-intl';
import { Platform } from 'react-native';

// Mock external dependencies
jest.mock('next-intl', () => ({
  useLocale: jest.fn(() => 'en'),
}));
jest.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <mock-theme-provider>{children}</mock-theme-provider>,
  InitialTheme: () => <mock-initial-theme />,
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => <mock-gesture-handler-root-view>{children}</mock-gesture-handler-root-view>,
}));

describe('Root (+html.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocale as jest.Mock).mockReturnValue('en');
    // Default to web platform for these tests as +html.tsx is primarily for web
    Object.defineProperty(Platform, 'OS', { get: () => 'web' });
  });

  it('renders with default language and ltr direction', () => {
    const { container } = render(<Root><div>Test Child</div></Root>);
    expect(container.parentElement?.parentElement?.getAttribute('lang')).toBe('en');
    expect(container.parentElement?.parentElement?.getAttribute('dir')).toBe('ltr');
    expect(container.getByText('Test Child')).toBeVisible();
    expect(container.getByText('mock-theme-provider')).toBeVisible();
    expect(container.getByText('mock-initial-theme')).toBeVisible();
    expect(container.getByText('mock-gesture-handler-root-view')).toBeVisible();
  });

  it('renders with Arabic language and rtl direction', () => {
    (useLocale as jest.Mock).mockReturnValue('ar');
    const { container } = render(<Root><div>Test Child</div></Root>);
    expect(container.parentElement?.parentElement?.getAttribute('lang')).toBe('ar');
    expect(container.parentElement?.parentElement?.getAttribute('dir')).toBe('rtl');
  });

  it('includes meta tags in head', () => {
    const { container } = render(<Root><div>Test Child</div></Root>);
    const head = container.parentElement?.parentElement?.querySelector('head');
    expect(head).not.toBeNull();
    expect(head?.querySelector('meta[charset="utf-8"]')).toBeInTheDocument();
    expect(head?.querySelector('meta[http-equiv="X-UA-Compatible"][content="IE=edge"]')).toBeInTheDocument();
    expect(head?.querySelector('meta[name="viewport"][content="width=device-width, initial-scale=1, shrink-to-fit=no"]')).toBeInTheDocument();
  });

  it('applies overflow: hidden to body style', () => {
    const { container } = render(<Root><div>Test Child</div></Root>);
    const body = container.parentElement?.parentElement?.querySelector('body');
    expect(body).toHaveStyle('overflow: hidden;');
  });
});

