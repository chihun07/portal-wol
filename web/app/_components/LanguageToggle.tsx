'use client';

import { useMemo } from 'react';

import { useLanguage } from '../_i18n/LanguageProvider';

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();

  const { code, label } = useMemo(() => {
    if (language === 'ko') {
      return {
        code: t('common.language.shortKorean'),
        label: t('common.language.switchToEnglish')
      };
    }
    return {
      code: t('common.language.shortEnglish'),
      label: t('common.language.switchToKorean')
    };
  }, [language, t]);

  return (
    <button
      type="button"
      className={`language-toggle${className ? ` ${className}` : ''}`}
      data-language={language}
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
    >
      <span className="language-toggle__code">{code}</span>
    </button>
  );
}
