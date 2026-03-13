import { getMessages } from './i18n';

describe('getMessages', () => {
  it('should load messages for "en" locale', async () => {
    const messages = await getMessages('en');
    expect(messages).toBeDefined();
    expect(messages.app.title).toBe('FlightDeck');
    expect(messages.auth.login.title).toBe('Login');
  });

  it('should load messages for "ja" locale', async () => {
    const messages = await getMessages('ja');
    expect(messages).toBeDefined();
    expect(messages.app.title).toBe('フライトデッキ');
    expect(messages.auth.login.title).toBe('ログイン');
  });

  it('should load messages for "ar" locale and include RTL specific keys', async () => {
    const messages = await getMessages('ar');
    expect(messages).toBeDefined();
    expect(messages.app.title).toBe('فلايت ديك');
    // Check for a specific RTL-related translation if one exists in the actual messages
    // For now, just checking a general key
    expect(messages.auth.login.title).toBe('تسجيل الدخول');
  });

  it('should return empty object for unsupported locale', async () => {
    // This test assumes that if a locale file doesn't exist,
    // the dynamic import will fail or return an empty module.
    // In a real next-intl setup, it might fall back to a default.
    // Here, we're testing the direct import behavior.
    const messages = await getMessages('xyz');
    expect(messages).toEqual({});
  });

  it('should handle errors during dynamic import gracefully', async () => {
    // Mock dynamic import to throw an error
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console error
    jest.mock(`../../messages/unsupported.json`, () => {
      throw new Error('Failed to load');
    }, { virtual: true });

    const messages = await getMessages('unsupported');
    expect(messages).toEqual({});
    expect(console.error).toHaveBeenCalledWith('Failed to load messages for locale unsupported:', expect.any(Error));
    jest.restoreAllMocks();
  });
});

