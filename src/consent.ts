const COVER_CONSENT_KEY = "tf-cover-consent";

export function getCoverConsent(): string | null {
  return localStorage.getItem(COVER_CONSENT_KEY); // 'granted', 'denied', or null
}

export function setCoverConsent(value: string): void {
  localStorage.setItem(COVER_CONSENT_KEY, value);
}
