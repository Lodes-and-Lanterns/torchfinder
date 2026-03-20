import LZString from '../dependencies/lz-string.js?v=3b3e6c26';

const STORAGE_KEY = 'torchfinder-lists';

// Encoding
///////////

// Encodes an ordered array of entry IDs to a versioned, URL-safe compressed string.
// Uses LZ-string compression, which significantly reduces URL length for larger lists.
export function encodeListPayload(ids) {
  if (!ids.length) return 'v1:';
  return 'v1:' + LZString.compressToEncodedURIComponent(ids.join(','));
}

// Decodes a versioned payload back to an array of entry IDs.
// Returns an empty array for unknown versions or malformed input.
export function decodeListPayload(payload) {
  if (!payload || !payload.startsWith('v1:')) return [];
  const compressed = payload.slice(3);
  if (!compressed) return [];
  try {
    const decoded = LZString.decompressFromEncodedURIComponent(compressed);
    return decoded ? decoded.split(',').filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Storage
//////////

export function getLists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLists(lists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

export function getList(id) {
  return getLists().find((l) => l.id === id) || null;
}

// Creates or updates a list. Sets timestamps appropriately.
export function saveList(list) {
  const lists = getLists();
  const idx = lists.findIndex((l) => l.id === list.id);
  const now = new Date().toISOString();
  if (idx === -1) {
    lists.push({ ...list, createdAt: now, updatedAt: now, lastAccessedAt: now });
  } else {
    lists[idx] = { ...lists[idx], ...list, updatedAt: now, lastAccessedAt: now };
  }
  setLists(lists);
}

export function deleteList(id) {
  setLists(getLists().filter((l) => l.id !== id));
}

// Updates lastAccessedAt without changing other fields.
export function touchList(id) {
  const lists = getLists();
  const idx = lists.findIndex((l) => l.id === id);
  if (idx !== -1) {
    lists[idx].lastAccessedAt = new Date().toISOString();
    setLists(lists);
  }
}

// Returns up to n lists sorted by most recently accessed.
export function getRecentLists(n = 5) {
  return getLists()
    .sort((a, b) => (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || ''))
    .slice(0, n);
}

export function generateListId() {
  return Math.random().toString(36).slice(2, 10);
}

export function clearAllLists() {
  setLists([]);
}

// Returns true if any saved list has the given name (case-insensitive),
// optionally ignoring a specific list ID (used when renaming).
export function listNameExists(name, excludeId = null) {
  const normalized = (name || '').trim().toLowerCase();
  return getLists().some(
    (l) => (l.name || '').trim().toLowerCase() === normalized && l.id !== excludeId,
  );
}

// Export / Import
//////////////////

// Merges an incoming list array into localStorage.
// For ID collisions, keeps whichever has the newer updatedAt timestamp.
// Returns the number of lists added or updated.
export function importLists(incoming) {
  if (!Array.isArray(incoming)) return 0;

  const existing = getLists();
  const map = new Map(existing.map((l) => [l.id, l]));
  let count = 0;

  for (const l of incoming) {
    if (!l.id || !Array.isArray(l.entries)) continue;
    const current = map.get(l.id);
    if (!current || (l.updatedAt || '') > (current.updatedAt || '')) {
      map.set(l.id, { ...l });
      ++count;
    }
  }

  setLists([...map.values()]);

  return count;
}

// Saved state
//////////////

// Compares the current in-memory list state against localStorage.
// Returns 'saved', 'modified', or 'unsaved'.
export function getListSavedState(id, entries) {
  if (!id) return 'unsaved';

  const saved = getList(id);
  if (!saved) return 'unsaved';

  if (JSON.stringify(saved.entries) === JSON.stringify(entries)) return 'saved';

  return 'modified';
}
