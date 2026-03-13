import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslations } from 'next-intl';
import { useTheme } from './ThemeProvider';
import { type ColorScheme } from '@/types/theme';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSubmit: (email: string, password: string) => Promise<void>;
}

const MIN_PASSWORD_LENGTH = 6;

export function AuthForm({ type, onSubmit }: AuthFormProps): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useTranslations('auth.form'); // Use useTranslations hook

  const handleSubmit = async (): Promise<void> => {
    setError('');
    if (!email || !password) {
      setError(t('error.emptyFields'));
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('error.invalidEmail'));
      return;
    }
    // Password strength for signup
    if (type === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      setError(t('error.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(email, password);
    } catch (e: unknown) {
      console.error('AuthForm submission error:', e);
      setError(t('error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
        placeholder={t('emailPlaceholder')}
        placeholderTextColor={colors.inputPlaceholder}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel={t('emailPlaceholder')}
        editable={!isLoading}
      />
      <View style={[styles.passwordContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.inputText }]}
          placeholder={t('passwordPlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel={t('passwordPlaceholder')}
          editable={!isLoading}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
          accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
          disabled={isLoading}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color={colors.icon}
          />
        </Pressable>
      </View>

      <Pressable style={[styles.button, { backgroundColor: colors.buttonBackground }]} onPress={handleSubmit} disabled={isLoading}>
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          {isLoading ? t('loading') : (type === 'login' ? useTranslations('auth.login')('button') : useTranslations('auth.signup')('button'))}
        </Text>
      </Pressable>

      <View style={styles.socialLoginContainer}>
        <Text style={[styles.orText, { color: colors.secondaryText }]}>{t('or')}</Text>
        <Pressable style={[styles.socialButton, { backgroundColor: colors.googleButtonBackground }]} onPress={() => { console.log('Google Login'); }} accessibilityLabel={t('googleLogin')} disabled={isLoading}>
          <MaterialCommunityIcons name="google" size={24} color={colors.googleButtonText} style={styles.socialIcon} />
          <Text style={[styles.socialButtonText, { color: colors.googleButtonText }]}>
            {t('googleLogin')}
          </Text>
        </Pressable>
        {/* Add other social login buttons if needed */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  orText: {
    marginBottom: 15,
    fontSize: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

function getColors(theme: ColorScheme): {
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  buttonBackground: string;
  buttonText: string;
  googleButtonBackground: string;
  googleButtonText: string;
  icon: string;
  error: string;
  secondaryText: string;
} {
  if (theme === 'dark') {
    return {
      inputBackground: '#374151',
      inputText: '#F9FAFB',
      inputPlaceholder: '#9CA3AF',
      inputBorder: '#4B5563',
      buttonBackground: '#22D3EE', // Cyan
      buttonText: '#1F2937',
      googleButtonBackground: '#DB4437', // Google Red
      googleButtonText: '#FFFFFF',
      icon: '#D1D5DB',
      error: '#EF4444', // Red
      secondaryText: '#D1D5DB',
    };
  }
  return {
    inputBackground: '#F9FAFB',
    inputText: '#1F2937',
    inputPlaceholder: '#6B7280',
    inputBorder: '#E5E7EB',
    buttonBackground: '#22D3EE', // Cyan
    buttonText: '#FFFFFF',
    googleButtonBackground: '#DB4437', // Google Red
    googleButtonText: '#FFFFFF',
    icon: '#6B7280',
    error: '#EF4444', // Red
    secondaryText: '#6B7280',
  };
}



