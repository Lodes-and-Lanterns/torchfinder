import { assertEquals } from '@std/assert';
import {
  encodeListPayload,
  decodeListPayload,
  getLists,
  getList,
  saveList,
  deleteList,
  touchList,
  getRecentLists,
  generateListId,
  getListSavedState,
  clearAllLists,
  importLists,
  listNameExists,
} from '../scripts/lists.js';

// Reset localStorage before each test that uses storage.
function resetStorage() {
  localStorage.clear();
}

// ENCODE_LIST_PAYLOAD
////////////////////

Deno.test('encodeListPayload: empty array returns "v1:"', () => {
  assertEquals(encodeListPayload([]), 'v1:');
});

Deno.test('encodeListPayload: produces v1: prefix', () => {
  const result = encodeListPayload(['abc', 'def']);
  assertEquals(result.startsWith('v1:'), true);
});

Deno.test('encodeListPayload: result is URL-safe (no /, =)', () => {
  // LZ-string URI-safe encoding intentionally uses + in its alphabet and
  // handles the +/space ambiguity symmetrically on decode.
  const result = encodeListPayload(['foo-bar', 'baz_qux', 'abc123']);
  assertEquals(result.includes('/'), false);
  assertEquals(result.includes('='), false);
});

Deno.test('encodeListPayload: round-trips with decodeListPayload', () => {
  const ids = ['adventure-001', 'zine-x', 'supplement-42'];
  const encoded = encodeListPayload(ids);
  assertEquals(decodeListPayload(encoded), ids);
});

Deno.test('encodeListPayload: single id round-trips', () => {
  const ids = ['only-one'];
  assertEquals(decodeListPayload(encodeListPayload(ids)), ids);
});

// DECODE_LIST_PAYLOAD
////////////////////

Deno.test('decodeListPayload: empty string returns []', () => {
  assertEquals(decodeListPayload(''), []);
});

Deno.test('decodeListPayload: null returns []', () => {
  assertEquals(decodeListPayload(null), []);
});

Deno.test('decodeListPayload: unknown version prefix returns []', () => {
  assertEquals(decodeListPayload('v2:abc'), []);
});

Deno.test('decodeListPayload: malformed compressed payload returns []', () => {
  assertEquals(decodeListPayload('v1:!!!'), []);
});

Deno.test('decodeListPayload: "v1:" (empty payload) returns []', () => {
  assertEquals(decodeListPayload('v1:'), []);
});

Deno.test('decodeListPayload: decodes multi-id payload correctly', () => {
  const ids = ['alpha', 'beta', 'gamma'];
  const encoded = encodeListPayload(ids);
  assertEquals(decodeListPayload(encoded), ids);
});

Deno.test('decodeListPayload: handles IDs with hyphens and underscores', () => {
  const ids = ['my-adventure_01', 'zine_2024-special'];
  assertEquals(decodeListPayload(encodeListPayload(ids)), ids);
});

Deno.test('encodeListPayload: compressed payload is shorter than raw joined IDs for larger lists', () => {
  const ids = [
    'beyond-the-iron-door', 'the-tomb-of-ash', 'grimoire-of-lost-souls',
    'bestiary-of-the-deep', 'compendium-of-curses', 'darkspace-primer',
    'dungeon-delver-3', 'iron-sea-chronicles', 'starfall-protocol',
    'amber-coast-hexcrawl', 'the-hollow-mountain', 'the-rat-catchers',
    'the-red-forest', 'the-sunken-chapel', 'the-sunken-district',
  ];
  const encoded = encodeListPayload(ids);
  const rawLength = ids.join(',').length;
  // Strip the "v1:" prefix before comparing
  assertEquals(encoded.slice(3).length < rawLength, true);
});

// GENERATE_LIST_ID
/////////////////

Deno.test('generateListId: returns an 8-character alphanumeric string', () => {
  const id = generateListId();
  assertEquals(typeof id, 'string');
  assertEquals(id.length, 8);
});

Deno.test('generateListId: produces unique IDs across 20 calls', () => {
  const ids = new Set(Array.from({ length: 20 }, generateListId));
  assertEquals(ids.size, 20);
});

// LOCAL_STORAGE CRUD
////////////////////

Deno.test('getLists: returns [] when storage is empty', () => {
  resetStorage();
  assertEquals(getLists(), []);
});

Deno.test('saveList: stores a new list and getLists returns it', () => {
  resetStorage();
  saveList({ id: 'abc', name: 'Test', entries: ['e1', 'e2'] });
  const lists = getLists();
  assertEquals(lists.length, 1);
  assertEquals(lists[0].id, 'abc');
  assertEquals(lists[0].name, 'Test');
  assertEquals(lists[0].entries, ['e1', 'e2']);
});

Deno.test('saveList: adds timestamps on create', () => {
  resetStorage();
  saveList({ id: 'ts1', name: 'TS', entries: [] });
  const l = getList('ts1');
  assertEquals(typeof l.createdAt, 'string');
  assertEquals(typeof l.updatedAt, 'string');
  assertEquals(typeof l.lastAccessedAt, 'string');
});

Deno.test('saveList: updates existing list without changing createdAt', () => {
  resetStorage();
  saveList({ id: 'upd', name: 'Original', entries: [] });
  const created = getList('upd').createdAt;
  saveList({ id: 'upd', name: 'Updated', entries: ['x'] });
  const updated = getList('upd');
  assertEquals(updated.name, 'Updated');
  assertEquals(updated.createdAt, created);
  assertEquals(updated.entries, ['x']);
});

Deno.test('getList: returns null for unknown id', () => {
  resetStorage();
  assertEquals(getList('nonexistent'), null);
});

Deno.test('getList: returns the correct list by id', () => {
  resetStorage();
  saveList({ id: 'find-me', name: 'Find Me', entries: ['a'] });
  saveList({ id: 'other', name: 'Other', entries: [] });
  const l = getList('find-me');
  assertEquals(l.name, 'Find Me');
});

Deno.test('deleteList: removes a list', () => {
  resetStorage();
  saveList({ id: 'del', name: 'Delete Me', entries: [] });
  deleteList('del');
  assertEquals(getList('del'), null);
  assertEquals(getLists().length, 0);
});

Deno.test('deleteList: only removes the targeted list', () => {
  resetStorage();
  saveList({ id: 'keep', name: 'Keep', entries: [] });
  saveList({ id: 'remove', name: 'Remove', entries: [] });
  deleteList('remove');
  assertEquals(getLists().length, 1);
  assertEquals(getLists()[0].id, 'keep');
});

Deno.test('touchList: updates lastAccessedAt', async () => {
  resetStorage();
  saveList({ id: 'touch', name: 'Touch', entries: [] });
  const before = getList('touch').lastAccessedAt;
  await new Promise((r) => setTimeout(r, 2));
  touchList('touch');
  const after = getList('touch').lastAccessedAt;
  assertEquals(after >= before, true);
});

Deno.test('touchList: no-op for unknown id', () => {
  resetStorage();
  touchList('ghost');
  assertEquals(getLists().length, 0);
});

Deno.test('getRecentLists: returns lists sorted by lastAccessedAt descending', () => {
  resetStorage();
  saveList({ id: 'a', name: 'A', entries: [] });
  saveList({ id: 'b', name: 'B', entries: [] });
  saveList({ id: 'c', name: 'C', entries: [] });
  // Override timestamps directly in storage
  const lists = getLists();
  const byId = Object.fromEntries(lists.map((l) => [l.id, l]));
  byId['a'].lastAccessedAt = '2024-01-01T00:00:00.000Z';
  byId['b'].lastAccessedAt = '2024-03-01T00:00:00.000Z';
  byId['c'].lastAccessedAt = '2024-02-01T00:00:00.000Z';
  localStorage.setItem('torchfinder-lists', JSON.stringify(Object.values(byId)));

  const recent = getRecentLists(5);
  assertEquals(recent[0].id, 'b');
  assertEquals(recent[1].id, 'c');
  assertEquals(recent[2].id, 'a');
});

Deno.test('getRecentLists: respects n limit', () => {
  resetStorage();
  for (let i = 0; i < 10; ++i) {
    saveList({ id: `l${i}`, name: `List ${i}`, entries: [] });
  }
  assertEquals(getRecentLists(3).length, 3);
});

// GET_LIST_SAVED_STATE
////////////////////

Deno.test('getListSavedState: returns "unsaved" when id is null', () => {
  resetStorage();
  assertEquals(getListSavedState(null, []), 'unsaved');
});

Deno.test('getListSavedState: returns "unsaved" when list not found in storage', () => {
  resetStorage();
  assertEquals(getListSavedState('missing', ['a']), 'unsaved');
});

Deno.test('getListSavedState: returns "saved" when entries match', () => {
  resetStorage();
  saveList({ id: 'saved-test', name: 'S', entries: ['a', 'b'] });
  assertEquals(getListSavedState('saved-test', ['a', 'b']), 'saved');
});

Deno.test('getListSavedState: returns "modified" when entries differ', () => {
  resetStorage();
  saveList({ id: 'mod-test', name: 'M', entries: ['a', 'b'] });
  assertEquals(getListSavedState('mod-test', ['a', 'b', 'c']), 'modified');
});

Deno.test('getListSavedState: order matters (different order = modified)', () => {
  resetStorage();
  saveList({ id: 'ord-test', name: 'O', entries: ['a', 'b'] });
  assertEquals(getListSavedState('ord-test', ['b', 'a']), 'modified');
});

// CLEAR_ALL_LISTS
////////////////

Deno.test('clearAllLists: removes all lists from storage', () => {
  resetStorage();
  saveList({ id: 'x', name: 'X', entries: [] });
  saveList({ id: 'y', name: 'Y', entries: [] });
  clearAllLists();
  assertEquals(getLists(), []);
});

Deno.test('clearAllLists: is a no-op when storage is already empty', () => {
  resetStorage();
  clearAllLists();
  assertEquals(getLists(), []);
});

// IMPORT_LISTS
//////////////

Deno.test('importLists: returns 0 for non-array input', () => {
  resetStorage();
  assertEquals(importLists(null), 0);
  assertEquals(importLists('string'), 0);
  assertEquals(importLists({}), 0);
});

Deno.test('importLists: adds new lists not already in storage', () => {
  resetStorage();
  const count = importLists([
    { id: 'new1', name: 'New 1', entries: ['a'] },
    { id: 'new2', name: 'New 2', entries: [] },
  ]);
  assertEquals(count, 2);
  assertEquals(getLists().length, 2);
});

Deno.test('importLists: skips entries missing id or entries field', () => {
  resetStorage();
  const count = importLists([
    { name: 'No ID', entries: ['a'] },       // missing id
    { id: 'no-entries', name: 'Bad' },        // missing entries
    { id: 'valid', name: 'Valid', entries: [] },
  ]);
  assertEquals(count, 1);
  assertEquals(getLists().length, 1);
  assertEquals(getLists()[0].id, 'valid');
});

Deno.test('importLists: replaces existing list when incoming updatedAt is newer', () => {
  resetStorage();
  saveList({ id: 'clash', name: 'Old Name', entries: [] });
  // Manually set a known updatedAt in the past
  const lists = getLists();
  lists[0].updatedAt = '2024-01-01T00:00:00.000Z';
  localStorage.setItem('torchfinder-lists', JSON.stringify(lists));

  const count = importLists([
    { id: 'clash', name: 'New Name', entries: ['x'], updatedAt: '2025-01-01T00:00:00.000Z' },
  ]);
  assertEquals(count, 1);
  assertEquals(getList('clash').name, 'New Name');
});

Deno.test('importLists: keeps existing list when incoming updatedAt is older', () => {
  resetStorage();
  saveList({ id: 'clash', name: 'Current Name', entries: [] });
  const lists = getLists();
  lists[0].updatedAt = '2025-06-01T00:00:00.000Z';
  localStorage.setItem('torchfinder-lists', JSON.stringify(lists));

  const count = importLists([
    { id: 'clash', name: 'Old Name', entries: ['x'], updatedAt: '2024-01-01T00:00:00.000Z' },
  ]);
  assertEquals(count, 0);
  assertEquals(getList('clash').name, 'Current Name');
});

Deno.test('importLists: merges without affecting unrelated existing lists', () => {
  resetStorage();
  saveList({ id: 'existing', name: 'Existing', entries: ['a'] });
  importLists([{ id: 'new', name: 'New', entries: [] }]);
  assertEquals(getLists().length, 2);
  assertEquals(getList('existing').name, 'Existing');
});

// LIST_NAME_EXISTS
/////////////////

Deno.test('listNameExists: returns false when storage is empty', () => {
  resetStorage();
  assertEquals(listNameExists('My List'), false);
});

Deno.test('listNameExists: returns true when name exists', () => {
  resetStorage();
  saveList({ id: 'x', name: 'My List', entries: [] });
  assertEquals(listNameExists('My List'), true);
});

Deno.test('listNameExists: match is case-insensitive', () => {
  resetStorage();
  saveList({ id: 'x', name: 'My List', entries: [] });
  assertEquals(listNameExists('my list'), true);
  assertEquals(listNameExists('MY LIST'), true);
  assertEquals(listNameExists('My List'), true);
});

Deno.test('listNameExists: match ignores surrounding whitespace', () => {
  resetStorage();
  saveList({ id: 'x', name: 'My List', entries: [] });
  assertEquals(listNameExists('  My List  '), true);
});

Deno.test('listNameExists: returns false for a different name', () => {
  resetStorage();
  saveList({ id: 'x', name: 'My List', entries: [] });
  assertEquals(listNameExists('Other List'), false);
});

Deno.test('listNameExists: excludeId ignores the specified list', () => {
  resetStorage();
  saveList({ id: 'x', name: 'My List', entries: [] });
  // When renaming list 'x' to the same name it already has; should be allowed.
  assertEquals(listNameExists('My List', 'x'), false);
});

Deno.test('listNameExists: excludeId still catches conflict with a different list', () => {
  resetStorage();
  saveList({ id: 'x', name: 'My List', entries: [] });
  saveList({ id: 'y', name: 'Other List', entries: [] });
  // Renaming 'y' to 'My List' should still conflict because 'x' has that name.
  assertEquals(listNameExists('My List', 'y'), true);
});
