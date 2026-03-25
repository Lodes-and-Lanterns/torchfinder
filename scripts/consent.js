const COVER_CONSENT_KEY = "tf-cover-consent";

export function getCoverConsent() {
  return localStorage.getItem(COVER_CONSENT_KEY); // 'granted', 'denied', or null
}

export function setCoverConsent(value) {
  localStorage.setItem(COVER_CONSENT_KEY, value);
}
