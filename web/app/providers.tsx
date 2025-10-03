'use client';

import type { PropsWithChildren } from 'react';

import { LanguageProvider } from './_i18n/LanguageProvider';
import { PortalConfigProvider } from './_settings/PortalConfigProvider';

export function AppProviders({ children }: PropsWithChildren<{}>) {
  return (
    <LanguageProvider>
      <PortalConfigProvider>{children}</PortalConfigProvider>
    </LanguageProvider>
  );
}
