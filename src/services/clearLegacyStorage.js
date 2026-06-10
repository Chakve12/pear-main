const LEGACY_KEYS = [
  'pear-elite-store-v2',
  'pear_chat_messages',
  'pear_images',
  'pear_local_users',
  'pear_local_session',
]

export function clearLegacyStorage() {
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}
