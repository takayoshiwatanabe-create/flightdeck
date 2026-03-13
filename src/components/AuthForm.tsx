import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations, useLocale } from 'next-intl'; // Ensure useLocale is imported
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
// Removed useLocale from here as it's already imported above.

interface AuthFormProps {
  type: 'login' | 'signup';
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function AuthForm({ type, onSubmit }: AuthFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('auth.form');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  const validate = (): boolean => {
    if (!email || !password) {
      setError(t('error.emptyFields'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('error.invalidEmail'));
      return false;
    }
    if (type === 'signup' && password.length < 6) {
      setError(t('error.passwordTooShort'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(email, password);
    } catch (e: unknown) {
      console.error('Auth submission error:', e);
      setError(t('error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { direction }]}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.inputText,
            borderColor: colors.inputBorder,
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        ]}
        placeholder={t('emailPlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        accessibilityLabel={t('emailPlaceholder')}
      />
      <View style={[styles.passwordContainer, { borderColor: colors.inputBorder }]}>
        <TextInput
          style={[
            styles.passwordInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.inputText,
              textAlign: direction === 'rtl' ? 'right' : 'left',
            },
          ]}
          placeholder={t('passwordPlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          accessibilityLabel={t('passwordPlaceholder')}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.passwordToggle}
          accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color={colors.icon}
          />
        </Pressable>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: pressed || isLoading ? 0.7 : 1,
          },
        ]}
        onPress={() => void handleSubmit()}
        disabled={isLoading}
        accessibilityLabel={type === 'login' ? tAuth('login.button') : tAuth('signup.button')}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {type === 'login' ? tAuth('login.button') : tAuth('signup.button')}
          </Text>
        )}
      </Pressable>

      <Text style={[styles.orText, { color: colors.secondaryText }]}>{t('or')}</Text>

      <Pressable
        style={({ pressed }) => [
          styles.googleButton,
          {
            backgroundColor: colors.googleButtonBackground,
            borderColor: colors.googleButtonBorder,
            opacity: pressed || isLoading ? 0.7 : 1,
          },
        ]}
        onPress={() => {
          /* TODO: Implement Google Sign-In */
        }}
        disabled={isLoading}
        accessibilityLabel={t('googleLogin')}
      >
        <MaterialCommunityIcons name="google" size={24} color={colors.googleButtonText} />
        <Text style={[styles.googleButtonText, { color: colors.googleButtonText }]}>
          {t('googleLogin')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  input: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  passwordToggle: {
    padding: 5,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444', // Red-500
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
});

function getColors(theme: ColorScheme): {
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  primary: string;
  buttonText: string;
  secondaryText: string;
  icon: string;
  googleButtonBackground: string;
  googleButtonBorder: string;
  googleButtonText: string;
} {
  if (theme === 'dark') {
    return {
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      primary: '#22D3EE',
      buttonText: '#1F2937',
      secondaryText: '#D1D5DB',
      icon: '#9CA3AF',
      googleButtonBackground: '#1F2937',
      googleButtonBorder: '#4B5563',
      googleButtonText: '#F9FAFB',
    };
  }
  return {
    inputBackground: '#F3F4F6',
    inputText: '#1F2937',
    inputPlaceholder: '#6B7280',
    inputBorder: '#E5E7EB',
    primary: '#22D3EE',
    buttonText: '#FFFFFF',
    secondaryText: '#6B7280',
    icon: '#6B7280',
    googleButtonBackground: '#FFFFFF',
    googleButtonBorder: '#D1D5DB',
    googleButtonText: '#1F2937',
  };
}

