'use client';

import { useLanguage } from '../../../_i18n/LanguageProvider';

type PortalFrameProps = {
  src: string;
};

export function PortalFrame({ src }: PortalFrameProps) {
  const { t } = useLanguage();

  return (
    <main className="portal-main">
      <iframe
        id="portal-panel"
        className="portal-panel"
        src={src}
        title={t('monitoring.frameTitle')}
        loading="lazy"
      />
    </main>
  );
}
