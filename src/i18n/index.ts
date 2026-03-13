// This file serves as the client-side entry point for next-intl.
// It re-exports necessary hooks and utilities for client components.
// For server components, `src/i18n/server.ts` should be used.

export { useTranslations, useLocale, useMessages } from 'next-intl';

// For language switching on the client, `next-intl` typically uses `useRouter` from `next/navigation`
// to change the `locale` parameter in the URL.
// Example:
// import { useRouter } from 'next/navigation';
// import { useLocale } from 'next-intl';
// const router = useRouter();
// const locale = useLocale();
// const changeLanguage = (newLocale: string) => {
//   router.replace('/', { locale: newLocale });
// };

// For RTL detection, `useLocale()` can be used: `const isRTL = useLocale() === 'ar';`
// The `dir` attribute on the `<html>` tag is managed by `next-intl`'s root layout.
// This is consistent with the "RTL対応ルール" in CLAUDE.md.
