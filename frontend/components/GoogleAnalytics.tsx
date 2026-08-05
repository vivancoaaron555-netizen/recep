'use client';

import { useEffect, useState } from 'react';

const GA_ID = 'G-MZEX7HXH2V';
const STORAGE_KEY = 'recept-ai-cookies-consent';

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const readConsent = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setEnabled(stored === 'accepted');
    };

    readConsent();

    const onConsentChange = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      setEnabled(value === 'accepted');
    };

    window.addEventListener('recept-consent-change', onConsentChange);
    window.addEventListener('storage', readConsent);
    return () => {
      window.removeEventListener('recept-consent-change', onConsentChange);
      window.removeEventListener('storage', readConsent);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    };
    w.gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 500,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    w.gtag('js', new Date());
    w.gtag('config', GA_ID, { anonymize_ip: true });

    return () => {
      document.head.querySelectorAll(`script[src*="gtag/js?id=${GA_ID}"]`).forEach((s) => s.remove());
    };
  }, [enabled]);

  return null;
}