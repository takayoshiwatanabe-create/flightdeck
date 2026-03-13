import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { type ColorScheme } from '@/types/theme';
import { UserProfileForm } from '@/src/components/user-profile-form';
import { fetchUserProfile, updateUserProfile } from '@/src/lib/actions/user';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface UserProfile {
  name: string;
  email: string; // Read-only
  preferredLanguage: string;
}

export default function ProfileScreen(): JSX.Element {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const t = useTranslations('settings.profile');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile(): Promise<void> {
      try {
        setIsLoading(true);
        const profile = await fetchUserProfile();
        setUserProfile(profile);
      } catch (e: unknown) {
        console.error('Failed to fetch user profile:', e);
        setError(t('error.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    }
    void loadUserProfile();
  }, []);

  const handleUpdateProfile = async (updatedData: Partial<UserProfile>): Promise<void> => {
    if (!userProfile) return;

    setIsSaving(true);
    setError(null);
    try {
      const success = await updateUserProfile(updatedData);
      if (success) {
        setUserProfile(prev => (prev ? { ...prev, ...updatedData } : null));
        Alert.alert(tCommon('success'), t('updateSuccess'));
        // If language changed, prompt for restart
        if (updatedData.preferredLanguage && updatedData.preferredLanguage !== locale) {
          Alert.alert(t('languageChange'), t('languageRestart'), [
            { text: tCommon('ok'), onPress: () => router.replace(`/${updatedData.preferredLanguage}/(tabs)/settings/profile`) }
          ]);
        }
      } else {
        setError(t('error.updateFailed'));
        Alert.alert(tCommon('error'), t('error.updateFailed'));
      }
    } catch (e: unknown) {
      console.error('Failed to update user profile:', e);
      setError(t('error.generic'));
      Alert.alert(tCommon('error'), t('error.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#22D3EE" accessibilityLabel="Loading" />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.errorText }]}>{t('error.noProfile')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel={tCommon('back')}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        <Text style={[styles.backButtonText, { color: colors.text }]}>{tCommon('back')}</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>{t('title')}</Text>
      <UserProfileForm
        profile={userProfile}
        onSave={handleUpdateProfile}
        isSaving={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 5,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#EF4444',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});

function getColors(theme: ColorScheme): {
  background: string;
  text: string;
  secondaryText: string;
  errorText: string;
} {
  if (theme === 'dark') {
    return {
      background: '#121212',
      text: '#F9FAFB',
      secondaryText: '#9CA3AF',
      errorText: '#EF4444',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#1F2937',
    secondaryText: '#6B7280',
    errorText: '#EF4444',
    };
}

