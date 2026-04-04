var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../.cache/deno/deno_esbuild/registry.npmjs.org/lz-string@1.5.0/node_modules/lz-string/libs/lz-string.js
var require_lz_string = __commonJS({
  "../../../.cache/deno/deno_esbuild/registry.npmjs.org/lz-string@1.5.0/node_modules/lz-string/libs/lz-string.js"(exports, module) {
    var LZString2 = (function() {
      var f = String.fromCharCode;
      var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
      var baseReverseDic = {};
      function getBaseValue(alphabet, character) {
        if (!baseReverseDic[alphabet]) {
          baseReverseDic[alphabet] = {};
          for (var i = 0; i < alphabet.length; i++) {
            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
          }
        }
        return baseReverseDic[alphabet][character];
      }
      var LZString3 = {
        compressToBase64: function(input) {
          if (input == null) return "";
          var res = LZString3._compress(input, 6, function(a) {
            return keyStrBase64.charAt(a);
          });
          switch (res.length % 4) {
            // To produce valid Base64
            default:
            // When could this happen ?
            case 0:
              return res;
            case 1:
              return res + "===";
            case 2:
              return res + "==";
            case 3:
              return res + "=";
          }
        },
        decompressFromBase64: function(input) {
          if (input == null) return "";
          if (input == "") return null;
          return LZString3._decompress(input.length, 32, function(index) {
            return getBaseValue(keyStrBase64, input.charAt(index));
          });
        },
        compressToUTF16: function(input) {
          if (input == null) return "";
          return LZString3._compress(input, 15, function(a) {
            return f(a + 32);
          }) + " ";
        },
        decompressFromUTF16: function(compressed) {
          if (compressed == null) return "";
          if (compressed == "") return null;
          return LZString3._decompress(compressed.length, 16384, function(index) {
            return compressed.charCodeAt(index) - 32;
          });
        },
        //compress into uint8array (UCS-2 big endian format)
        compressToUint8Array: function(uncompressed) {
          var compressed = LZString3.compress(uncompressed);
          var buf = new Uint8Array(compressed.length * 2);
          for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
            var current_value = compressed.charCodeAt(i);
            buf[i * 2] = current_value >>> 8;
            buf[i * 2 + 1] = current_value % 256;
          }
          return buf;
        },
        //decompress from uint8array (UCS-2 big endian format)
        decompressFromUint8Array: function(compressed) {
          if (compressed === null || compressed === void 0) {
            return LZString3.decompress(compressed);
          } else {
            var buf = new Array(compressed.length / 2);
            for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
              buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
            }
            var result = [];
            buf.forEach(function(c) {
              result.push(f(c));
            });
            return LZString3.decompress(result.join(""));
          }
        },
        //compress into a string that is already URI encoded
        compressToEncodedURIComponent: function(input) {
          if (input == null) return "";
          return LZString3._compress(input, 6, function(a) {
            return keyStrUriSafe.charAt(a);
          });
        },
        //decompress from an output of compressToEncodedURIComponent
        decompressFromEncodedURIComponent: function(input) {
          if (input == null) return "";
          if (input == "") return null;
          input = input.replace(/ /g, "+");
          return LZString3._decompress(input.length, 32, function(index) {
            return getBaseValue(keyStrUriSafe, input.charAt(index));
          });
        },
        compress: function(uncompressed) {
          return LZString3._compress(uncompressed, 16, function(a) {
            return f(a);
          });
        },
        _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
          if (uncompressed == null) return "";
          var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
          for (ii = 0; ii < uncompressed.length; ii += 1) {
            context_c = uncompressed.charAt(ii);
            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
              context_dictionary[context_c] = context_dictSize++;
              context_dictionaryToCreate[context_c] = true;
            }
            context_wc = context_w + context_c;
            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
              context_w = context_wc;
            } else {
              if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 8; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                } else {
                  value = 1;
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = 0;
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 16; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
              } else {
                value = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              context_dictionary[context_wc] = context_dictSize++;
              context_w = String(context_c);
            }
          }
          if (context_w !== "") {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0) < 256) {
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1 | value & 1;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
          }
          value = 2;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
          while (true) {
            context_data_val = context_data_val << 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data.push(getCharFromInt(context_data_val));
              break;
            } else context_data_position++;
          }
          return context_data.join("");
        },
        decompress: function(compressed) {
          if (compressed == null) return "";
          if (compressed == "") return null;
          return LZString3._decompress(compressed.length, 32768, function(index) {
            return compressed.charCodeAt(index);
          });
        },
        _decompress: function(length, resetValue, getNextValue) {
          var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
          for (i = 0; i < 3; i += 1) {
            dictionary[i] = i;
          }
          bits = 0;
          maxpower = Math.pow(2, 2);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          switch (next = bits) {
            case 0:
              bits = 0;
              maxpower = Math.pow(2, 8);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              c = f(bits);
              break;
            case 1:
              bits = 0;
              maxpower = Math.pow(2, 16);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              c = f(bits);
              break;
            case 2:
              return "";
          }
          dictionary[3] = c;
          w = c;
          result.push(c);
          while (true) {
            if (data.index > length) {
              return "";
            }
            bits = 0;
            maxpower = Math.pow(2, numBits);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            switch (c = bits) {
              case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                dictionary[dictSize++] = f(bits);
                c = dictSize - 1;
                enlargeIn--;
                break;
              case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                dictionary[dictSize++] = f(bits);
                c = dictSize - 1;
                enlargeIn--;
                break;
              case 2:
                return result.join("");
            }
            if (enlargeIn == 0) {
              enlargeIn = Math.pow(2, numBits);
              numBits++;
            }
            if (dictionary[c]) {
              entry = dictionary[c];
            } else {
              if (c === dictSize) {
                entry = w + w.charAt(0);
              } else {
                return null;
              }
            }
            result.push(entry);
            dictionary[dictSize++] = w + entry.charAt(0);
            enlargeIn--;
            w = entry;
            if (enlargeIn == 0) {
              enlargeIn = Math.pow(2, numBits);
              numBits++;
            }
          }
        }
      };
      return LZString3;
    })();
    if (typeof define === "function" && define.amd) {
      define(function() {
        return LZString2;
      });
    } else if (typeof module !== "undefined" && module != null) {
      module.exports = LZString2;
    } else if (typeof angular !== "undefined" && angular != null) {
      angular.module("LZString", []).factory("LZString", function() {
        return LZString2;
      });
    }
  }
});

// src/state.ts
var DATA_URL = "/dist/torchfinder-dataset.jsonl?v=9ec98355";
var PAGE_SIZE = 25;
var SEARCH_DEBOUNCE_MS = 200;
var state = {
  data: null,
  filtered: [],
  query: "",
  filters: {
    categories: [],
    systems: ["Shadowdark"],
    settings: [],
    envs: [],
    themes: [],
    languages: [],
    pub: [],
    authors: [],
    pricings: [],
    character_options: [],
    hasCharacterOptions: false,
    official: false,
    upcoming: false,
    excludeUnspecifiedLevel: false,
    excludeUnspecifiedParty: false,
    lmin: null,
    lmax: null,
    pmin: null,
    pmax: null,
    dmin: null,
    dmax: null
  },
  sort: "title",
  sortReverse: false,
  page: 1,
  directId: null,
  expandedCardId: null,
  listMode: false,
  listId: null,
  listName: "",
  listDescription: "",
  listEntries: [],
  listSynced: false
};

// src/lists.ts
var import_lz_string = __toESM(require_lz_string());
var STORAGE_KEY = "torchfinder-lists";
function encodeListPayload(ids) {
  if (!ids.length) return "v1:";
  return "v1:" + import_lz_string.default.compressToEncodedURIComponent(ids.join(","));
}
function decodeListPayload(payload) {
  if (!payload || !payload.startsWith("v1:")) return [];
  const compressed = payload.slice(3);
  if (!compressed) return [];
  try {
    const decoded = import_lz_string.default.decompressFromEncodedURIComponent(compressed);
    return decoded ? decoded.split(",").filter(Boolean) : [];
  } catch {
    return [];
  }
}
function getLists() {
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
function getList(id) {
  if (!id) return null;
  return getLists().find((l) => l.id === id) || null;
}
function saveList(list) {
  const lists = getLists();
  const idx = lists.findIndex((l) => l.id === list.id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (idx === -1) {
    lists.push({
      ...list,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now
    });
  } else {
    lists[idx] = {
      ...lists[idx],
      ...list,
      updatedAt: now,
      lastAccessedAt: now
    };
  }
  setLists(lists);
}
function deleteList(id) {
  if (!id) return;
  setLists(getLists().filter((l) => l.id !== id));
}
function touchList(id) {
  const lists = getLists();
  const idx = lists.findIndex((l) => l.id === id);
  if (idx !== -1) {
    lists[idx].lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
    setLists(lists);
  }
}
function generateListId() {
  return Math.random().toString(36).slice(2, 10);
}
function clearAllLists() {
  setLists([]);
}
function listNameExists(name, excludeId = null) {
  const normalized = (name || "").trim().toLowerCase();
  return getLists().some(
    (l) => (l.name || "").trim().toLowerCase() === normalized && l.id !== excludeId
  );
}
function importLists(incoming) {
  if (!Array.isArray(incoming)) return 0;
  const existing = getLists();
  const map = new Map(existing.map((l) => [l.id, l]));
  let count = 0;
  for (const l of incoming) {
    if (!l.id || !Array.isArray(l.entries)) continue;
    const current = map.get(l.id);
    if (!current || (l.updatedAt || "") > (current.updatedAt || "")) {
      map.set(l.id, { ...l });
      ++count;
    }
  }
  setLists([...map.values()]);
  return count;
}
function getListSavedState(id, entries) {
  if (!id) return "unsaved";
  const saved = getList(id);
  if (!saved) return "unsaved";
  if (JSON.stringify(saved.entries) === JSON.stringify(entries)) return "saved";
  return "modified";
}

// src/url.ts
function parseUrlParams(params = new URLSearchParams(globalThis.location.search)) {
  const listPayload = params.get("list");
  const directId = params.get("id") || null;
  if (listPayload !== null) {
    state.listMode = true;
    state.listEntries = decodeListPayload(listPayload);
    state.listName = params.get("list-name") || "Untitled list";
    state.listDescription = params.get("list-description") || "";
    state.listId = params.get("list-id") || null;
    state.directId = directId;
    return;
  }
  state.listMode = false;
  state.listEntries = [];
  state.listName = "";
  state.listDescription = "";
  state.listId = null;
  state.directId = directId;
  state.query = params.get("q") || "";
  state.sort = params.get("sort") || "title";
  state.sortReverse = params.get("reverse") === "true";
  const parsedPage = parseInt(params.get("page") || "1", 10);
  state.page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
  function parseArray(key) {
    const val = params.get(key);
    return val ? val.split(",").filter(Boolean) : [];
  }
  state.filters.categories = parseArray("category");
  if (params.has("systems")) state.filters.systems = parseArray("systems");
  state.filters.settings = parseArray("settings");
  state.filters.envs = parseArray("envs");
  state.filters.themes = parseArray("themes");
  state.filters.languages = parseArray("languages");
  state.filters.pub = parseArray("pub");
  state.filters.authors = parseArray("authors");
  state.filters.pricings = parseArray("pricings");
  state.filters.character_options = parseArray("character_options");
  state.filters.hasCharacterOptions = params.get("has_character_options") === "true";
  state.filters.official = params.get("official") === "true";
  state.filters.upcoming = params.get("upcoming") === "true";
  state.filters.excludeUnspecifiedLevel = params.get("exclude_level") === "true";
  state.filters.excludeUnspecifiedParty = params.get("exclude_party") === "true";
  function parseIntParam(key) {
    const s = params.get(key);
    if (s === null || s === "") return null;
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  }
  state.filters.lmin = parseIntParam("lmin");
  state.filters.lmax = parseIntParam("lmax");
  state.filters.pmin = parseIntParam("pmin");
  state.filters.pmax = parseIntParam("pmax");
  function parseYearMonth2(key) {
    const s = params.get(key);
    return s && /^\d{4}-\d{2}$/.test(s) ? s : null;
  }
  state.filters.dmin = parseYearMonth2("dmin");
  state.filters.dmax = parseYearMonth2("dmax");
}
function buildUrlParams() {
  const params = new URLSearchParams();
  if (state.directId) {
    params.set("id", state.directId);
    if (state.listMode) {
      params.set("list", encodeListPayload(state.listEntries));
      if (state.listName) params.set("list-name", state.listName);
      if (state.listDescription) {
        params.set("list-description", state.listDescription);
      }
      if (state.listId) params.set("list-id", state.listId);
    }
    return params;
  }
  if (state.listMode) {
    params.set("list", encodeListPayload(state.listEntries));
    if (state.listName) params.set("list-name", state.listName);
    if (state.listDescription) {
      params.set("list-description", state.listDescription);
    }
    if (state.listId) params.set("list-id", state.listId);
    return params;
  }
  if (state.query) params.set("q", state.query);
  if (state.sort && state.sort !== "title") params.set("sort", state.sort);
  if (state.sortReverse) params.set("reverse", "true");
  if (state.page > 1) params.set("page", String(state.page));
  function setArray(key, arr) {
    if (arr.length) params.set(key, arr.join(","));
  }
  setArray("category", state.filters.categories);
  setArray("systems", state.filters.systems);
  setArray("settings", state.filters.settings);
  setArray("envs", state.filters.envs);
  setArray("themes", state.filters.themes);
  setArray("languages", state.filters.languages);
  setArray("pub", state.filters.pub);
  setArray("authors", state.filters.authors);
  setArray("pricings", state.filters.pricings);
  setArray("character_options", state.filters.character_options);
  if (state.filters.hasCharacterOptions) {
    params.set("has_character_options", "true");
  }
  if (state.filters.official) params.set("official", "true");
  if (state.filters.upcoming) params.set("upcoming", "true");
  if (state.filters.excludeUnspecifiedLevel) {
    params.set("exclude_level", "true");
  }
  if (state.filters.excludeUnspecifiedParty) {
    params.set("exclude_party", "true");
  }
  if (state.filters.lmin !== null) {
    params.set("lmin", String(state.filters.lmin));
  }
  if (state.filters.lmax !== null) {
    params.set("lmax", String(state.filters.lmax));
  }
  if (state.filters.pmin !== null) {
    params.set("pmin", String(state.filters.pmin));
  }
  if (state.filters.pmax !== null) {
    params.set("pmax", String(state.filters.pmax));
  }
  if (state.filters.dmin !== null) params.set("dmin", state.filters.dmin);
  if (state.filters.dmax !== null) params.set("dmax", state.filters.dmax);
  return params;
}
function updateUrl() {
  const params = buildUrlParams();
  const qs = params.toString();
  const newUrl = qs ? `${globalThis.location.pathname}?${qs}` : globalThis.location.pathname;
  history.replaceState(null, "", newUrl);
}

// src/utils.ts
function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function slugToLabel(slug) {
  if (!slug) return "";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
var LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ja: "Japanese",
  it: "Italian",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  pl: "Polish",
  ko: "Korean",
  zh: "Chinese",
  ca: "Catalan",
  ru: "Russian"
};
function langName(code) {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}
function formatLevelRange(min, max) {
  if (min == null && max == null) return null;
  if (min === max) return `Level ${min}`;
  if (min == null) return `Up to level ${max}`;
  if (max == null) return `Level ${min}+`;
  return `Levels ${min}\u2013${max}`;
}
function formatPartySize(min, max) {
  if (min == null && max == null) return null;
  if (min === max) return `${min} players`;
  if (min == null) return `Up to ${max} players`;
  if (max == null) return `${min}+ players`;
  return `${min}\u2013${max} players`;
}
function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 1) return parts[0];
  return `${parseInt(parts[1], 10)}/${parts[0]}`;
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    const d2 = /* @__PURE__ */ new Date(`${dateStr}-01T00:00:00Z`);
    return d2.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      timeZone: "UTC"
    });
  }
  const d = /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}
function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  const full = parts.length === 1 ? `${parts[0]}-01-01T00:00:00Z` : parts.length === 2 ? `${parts[0]}-${parts[1]}-01T00:00:00Z` : `${dateStr}T00:00:00Z`;
  return new Date(full) > /* @__PURE__ */ new Date();
}

// src/filters.ts
function hasActiveFilters() {
  const f = state.filters;
  return state.query !== "" || f.categories.length > 0 || f.systems.length > 0 || f.settings.length > 0 || f.envs.length > 0 || f.themes.length > 0 || f.languages.length > 0 || f.pub.length > 0 || f.authors.length > 0 || f.pricings.length > 0 || f.character_options.length > 0 || f.hasCharacterOptions || f.official || f.upcoming || f.excludeUnspecifiedLevel || f.excludeUnspecifiedParty || f.lmin !== null || f.lmax !== null || f.pmin !== null || f.pmax !== null || f.dmin !== null || f.dmax !== null;
}
function matchesText(entry, query) {
  const q = query.toLowerCase();
  return (entry.title || "").toLowerCase().includes(q) || (entry.desc || "").toLowerCase().includes(q) || (entry.authors || []).some((a) => a.toLowerCase().includes(q)) || (entry.pub || "").toLowerCase().includes(q) || (entry.character_options || []).some((c) => c.toLowerCase().includes(q));
}
function normDateToMonth(d) {
  if (!d) return null;
  const parts = d.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : `${parts[0]}-01`;
}
function rangesOverlap(entryMin, entryMax, filterMin, filterMax, excludeUnspecified) {
  const hasEntry = entryMin !== null && entryMin !== void 0 || entryMax !== null && entryMax !== void 0;
  if (!hasEntry) return !excludeUnspecified;
  const hasFilter = filterMin !== null || filterMax !== null;
  if (!hasFilter) return true;
  const eMin = entryMin != null ? entryMin : 0;
  const eMax = entryMax != null ? entryMax : Infinity;
  const fMin = filterMin !== null ? filterMin : 0;
  const fMax = filterMax !== null ? filterMax : Infinity;
  return eMin <= fMax && eMax >= fMin;
}
var _shuffledOrder = null;
function clearShuffleCache() {
  _shuffledOrder = null;
}
function applyFilters() {
  if (!state.data) {
    state.filtered = [];
    return;
  }
  const f = state.filters;
  const arrayFilterDefs = [
    { key: "categories", isArray: true },
    { key: "pricings", isArray: true },
    { key: "systems", isArray: true },
    { key: "settings", isArray: true },
    { key: "envs", isArray: true },
    { key: "themes", isArray: true },
    { key: "languages", isArray: true },
    { key: "pub", isArray: false },
    { key: "authors", isArray: true },
    { key: "character_options", isArray: true }
  ];
  state.filtered = state.data.filter((entry) => {
    if (state.query && !matchesText(entry, state.query)) return false;
    for (const { key, isArray } of arrayFilterDefs) {
      const selected = f[key];
      if (!selected.length) continue;
      const raw = entry[key];
      const entryVals = isArray ? raw || [] : raw != null ? [raw] : [];
      if (!selected.some((v) => entryVals.includes(v))) return false;
    }
    if (f.hasCharacterOptions && !(entry.character_options || []).length) {
      return false;
    }
    if (f.official && !entry.official) return false;
    if (f.upcoming && !isUpcoming(entry.date)) return false;
    if (!rangesOverlap(
      entry.lmin,
      entry.lmax,
      f.lmin,
      f.lmax,
      f.excludeUnspecifiedLevel
    )) return false;
    if (!rangesOverlap(
      entry.pmin,
      entry.pmax,
      f.pmin,
      f.pmax,
      f.excludeUnspecifiedParty
    )) return false;
    if (f.dmin !== null || f.dmax !== null) {
      const entryMonth = normDateToMonth(entry.date);
      if (entryMonth === null || f.dmin !== null && entryMonth < f.dmin || f.dmax !== null && entryMonth > f.dmax) return false;
    }
    return true;
  });
  _shuffledOrder = null;
  sortFiltered();
}
function sortFiltered() {
  const arr = state.filtered;
  switch (state.sort) {
    case "title":
      _shuffledOrder = null;
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case "date":
      _shuffledOrder = null;
      arr.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      break;
    case "pages":
      _shuffledOrder = null;
      arr.sort((a, b) => {
        const pa = a.pages != null ? a.pages : Infinity;
        const pb = b.pages != null ? b.pages : Infinity;
        return pa - pb;
      });
      break;
    case "level":
      _shuffledOrder = null;
      arr.sort((a, b) => {
        const la = a.lmin != null ? a.lmin : Infinity;
        const lb = b.lmin != null ? b.lmin : Infinity;
        return la - lb;
      });
      break;
    case "shuffle":
      if (!_shuffledOrder) {
        _shuffledOrder = [...arr];
        for (let i = _shuffledOrder.length - 1; i > 0; --i) {
          const j = Math.floor(Math.random() * (i + 1));
          [_shuffledOrder[i], _shuffledOrder[j]] = [
            _shuffledOrder[j],
            _shuffledOrder[i]
          ];
        }
      }
      arr.splice(0, arr.length, ..._shuffledOrder);
      break;
  }
  if (state.sortReverse) arr.reverse();
}

// src/month-picker.ts
var MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function parseYearMonth(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  if (month < 0 || month > 11) return null;
  return { year, month };
}
function formatYearMonth(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
function formatDisplay(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}
function isMonthDisabled(year, month, otherValue, isStart) {
  if (!otherValue) return false;
  const other = parseYearMonth(otherValue);
  if (!other) return false;
  const thisVal = formatYearMonth(year, month);
  const otherVal = formatYearMonth(other.year, other.month);
  return isStart ? thisVal > otherVal : thisVal < otherVal;
}
function createMonthPicker(inputEl, { isStart, getOtherValue, onSelect }) {
  let isOpen = false;
  let viewYear = (/* @__PURE__ */ new Date()).getFullYear();
  let focusedIdx = 0;
  let popoverEl = null;
  let yearLabelEl = null;
  let gridEl = null;
  function getStoredValue() {
    return inputEl.dataset.value || null;
  }
  function buildPopover() {
    popoverEl = document.createElement("div");
    popoverEl.className = "month-picker-popover";
    popoverEl.setAttribute("role", "dialog");
    popoverEl.setAttribute("aria-modal", "false");
    popoverEl.setAttribute(
      "aria-label",
      isStart ? "Select start month" : "Select end month"
    );
    popoverEl.hidden = true;
    const yearNav = document.createElement("div");
    yearNav.className = "month-picker-year-nav";
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "month-picker-year-btn";
    prevBtn.setAttribute("aria-label", "Previous year");
    prevBtn.textContent = "\u25C0";
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      --viewYear;
      refreshGrid();
    });
    yearLabelEl = document.createElement("span");
    yearLabelEl.className = "month-picker-year-label";
    yearLabelEl.setAttribute("aria-live", "polite");
    yearLabelEl.setAttribute("aria-atomic", "true");
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "month-picker-year-btn";
    nextBtn.setAttribute("aria-label", "Next year");
    nextBtn.textContent = "\u25B6";
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      ++viewYear;
      refreshGrid();
    });
    yearNav.appendChild(prevBtn);
    yearNav.appendChild(yearLabelEl);
    yearNav.appendChild(nextBtn);
    gridEl = document.createElement("div");
    gridEl.className = "month-picker-grid";
    gridEl.setAttribute("role", "grid");
    gridEl.setAttribute("aria-label", "Months");
    for (let i = 0; i < 12; ++i) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "month-picker-cell";
      cell.dataset.monthIdx = String(i);
      cell.setAttribute("role", "gridcell");
      cell.textContent = MONTH_NAMES[i];
      cell.tabIndex = -1;
      const idx = i;
      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!cell.disabled) selectMonth(idx);
      });
      gridEl.appendChild(cell);
    }
    popoverEl.appendChild(yearNav);
    popoverEl.appendChild(gridEl);
    popoverEl.addEventListener("keydown", onPopoverKeyDown);
    popoverEl.addEventListener("focusout", onPopoverFocusOut);
    document.body.appendChild(popoverEl);
  }
  function refreshGrid() {
    if (!popoverEl || !gridEl || !yearLabelEl) return;
    yearLabelEl.textContent = String(viewYear);
    const stored = parseYearMonth(getStoredValue());
    const otherVal = getOtherValue ? getOtherValue() : null;
    const cells = gridEl.querySelectorAll(
      ".month-picker-cell"
    );
    cells.forEach((cell, i) => {
      const isSelected = stored && stored.year === viewYear && stored.month === i;
      const disabled = isMonthDisabled(viewYear, i, otherVal, isStart);
      const isFocused = i === focusedIdx;
      cell.classList.toggle("selected", !!isSelected);
      cell.disabled = disabled;
      cell.setAttribute("aria-disabled", disabled ? "true" : "false");
      cell.setAttribute("aria-selected", isSelected ? "true" : "false");
      cell.tabIndex = isFocused ? 0 : -1;
    });
  }
  function moveFocus(idx) {
    if (!gridEl) return;
    focusedIdx = (idx % 12 + 12) % 12;
    const cells = gridEl.querySelectorAll(
      ".month-picker-cell"
    );
    cells.forEach((cell, i) => {
      cell.tabIndex = i === focusedIdx ? 0 : -1;
    });
    if (cells[focusedIdx]) cells[focusedIdx].focus();
  }
  function selectMonth(monthIdx) {
    const value = formatYearMonth(viewYear, monthIdx);
    inputEl.dataset.value = value;
    inputEl.value = formatDisplay(viewYear, monthIdx);
    close();
    onSelect(value);
  }
  function clearInput() {
    inputEl.dataset.value = "";
    inputEl.value = "";
  }
  function positionPopover() {
    if (!popoverEl) return;
    const rect = inputEl.getBoundingClientRect();
    popoverEl.style.top = rect.bottom + 4 + "px";
    popoverEl.style.left = rect.left + "px";
    requestAnimationFrame(() => {
      if (!popoverEl) return;
      const pRect = popoverEl.getBoundingClientRect();
      if (pRect.right > globalThis.innerWidth - 8) {
        popoverEl.style.left = Math.max(8, globalThis.innerWidth - pRect.width - 8) + "px";
      }
    });
  }
  function open() {
    if (!popoverEl) buildPopover();
    const stored = parseYearMonth(getStoredValue());
    viewYear = stored ? stored.year : (/* @__PURE__ */ new Date()).getFullYear();
    focusedIdx = stored ? stored.month : 0;
    refreshGrid();
    positionPopover();
    popoverEl.hidden = false;
    isOpen = true;
    inputEl.setAttribute("aria-expanded", "true");
    const cells = gridEl.querySelectorAll(
      ".month-picker-cell"
    );
    if (cells[focusedIdx]) cells[focusedIdx].focus();
    setTimeout(() => {
      document.addEventListener("click", onOutsideClick, { capture: true });
    }, 0);
  }
  function close() {
    if (!isOpen || !popoverEl) return;
    popoverEl.hidden = true;
    isOpen = false;
    inputEl.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onOutsideClick, { capture: true });
    inputEl.focus();
  }
  function onPopoverFocusOut(e) {
    const target = e.relatedTarget;
    if (!target || !popoverEl.contains(target) && target !== inputEl) {
      close();
    }
  }
  function onOutsideClick(e) {
    if (!popoverEl.contains(e.target) && e.target !== inputEl) {
      close();
    }
  }
  function onPopoverKeyDown(e) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveFocus(focusedIdx + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(focusedIdx - 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(focusedIdx + 3);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(focusedIdx - 3);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const cells = gridEl.querySelectorAll(
          ".month-picker-cell"
        );
        if (cells[focusedIdx] && !cells[focusedIdx].disabled) {
          selectMonth(focusedIdx);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
    }
  }
  inputEl.setAttribute("aria-expanded", "false");
  inputEl.setAttribute("aria-haspopup", "dialog");
  inputEl.addEventListener("click", () => {
    if (isOpen) close();
    else open();
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen) close();
      else open();
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  });
  const instance = {
    setValue(str) {
      const parsed = parseYearMonth(str);
      if (parsed) {
        inputEl.dataset.value = str;
        inputEl.value = formatDisplay(parsed.year, parsed.month);
      } else {
        clearInput();
      }
      if (isOpen) refreshGrid();
    },
    clear() {
      clearInput();
      if (isOpen) refreshGrid();
    },
    destroy() {
      document.removeEventListener("click", onOutsideClick, { capture: true });
      if (popoverEl) {
        popoverEl.remove();
        popoverEl = null;
      }
    }
  };
  inputEl._monthPicker = instance;
  return instance;
}

// src/consent.ts
var COVER_CONSENT_KEY = "tf-cover-consent";
function getCoverConsent() {
  return localStorage.getItem(COVER_CONSENT_KEY);
}
function setCoverConsent(value) {
  localStorage.setItem(COVER_CONSENT_KEY, value);
}

// src/render.ts
var FILTER_TOP_N = 8;
var PUBLISHER_AUTHOR_TOP_N = 20;
var PILL_TOOLTIPS = {
  "Kelsey Dionne": "Creator of Shadowdark",
  "The Arcane Library": "Publisher of Shadowdark"
};
function filterHiddenCount(totalCount, visibleCount) {
  return Math.max(0, totalCount - visibleCount);
}
function collectDistinctValues(field, isArray) {
  const values = /* @__PURE__ */ new Set();
  for (const entry of state.data) {
    const raw = entry[field];
    if (isArray) {
      for (const v of raw || []) values.add(v);
    } else if (raw != null && raw !== "") {
      values.add(raw);
    }
  }
  return [...values].sort();
}
function collectTopValues(field, isArray, n) {
  const counts = /* @__PURE__ */ new Map();
  for (const entry of state.data) {
    const raw = entry[field];
    const vals = isArray ? raw || [] : raw != null && raw !== "" ? [raw] : [];
    for (const v of vals) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([v]) => v);
}
function defaultVisibleValues(topValues, allValues, filterKey) {
  const selected = state.filters[filterKey] || [];
  const topSet = new Set(topValues);
  const extras = selected.filter(
    (v) => !topSet.has(v) && allValues.includes(v)
  );
  return [...topValues, ...extras];
}
function setMoreNote(container, count) {
  let note = container.nextElementSibling;
  if (!note || !note.classList.contains("filter-more-note")) {
    note = document.createElement("p");
    note.className = "filter-more-note";
    container.insertAdjacentElement("afterend", note);
  }
  note.hidden = count <= 0;
  if (count > 0) note.textContent = `and ${count} more \u2014 search above`;
  container._hasOverflowNote = count > 0;
}
function syncPillFade(container) {
  if (container._hasOverflowNote) return;
  const content = container.closest(".filter-group-content");
  if (!content) return;
  const hasOverflow = container.scrollHeight > container.clientHeight + 2;
  const atEnd = container.scrollHeight - container.scrollTop <= container.clientHeight + 2;
  content.classList.toggle("has-pill-overflow", hasOverflow && !atEnd);
}
function buildPills(container, values, filterKey, labelFn) {
  container.innerHTML = "";
  const selected = filterKey ? state.filters[filterKey] || [] : [];
  for (const val of values) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (selected.includes(val) ? " active" : "");
    btn.textContent = labelFn ? labelFn(val) : val;
    btn.dataset.value = val;
    btn.setAttribute("aria-pressed", selected.includes(val) ? "true" : "false");
    if (PILL_TOOLTIPS[val]) btn.title = PILL_TOOLTIPS[val];
    btn.addEventListener(
      "click",
      () => onPillToggle(filterKey || "", val, btn)
    );
    container.appendChild(btn);
  }
  if (!container._pillFadeListenerAttached) {
    container.addEventListener("scroll", () => syncPillFade(container));
    container._pillFadeListenerAttached = true;
  }
  if (container.clientHeight > 0) syncPillFade(container);
}
function renderFilterSidebar() {
  const PRICING_LABELS = {
    free: "Free",
    paid: "Paid",
    pwyw: "Pay What You Want"
  };
  const pricingLabel = (v) => PRICING_LABELS[v] || slugToLabel(v);
  const fields = [
    { id: "filter-category", key: "categories", isArray: true },
    { id: "filter-pricing", key: "pricings", isArray: true, fn: pricingLabel },
    {
      id: "filter-system",
      key: "systems",
      isArray: true,
      pinTop: ["Shadowdark", "System-Agnostic"]
    },
    { id: "filter-environment", key: "envs", isArray: true },
    { id: "filter-themes", key: "themes", isArray: true },
    { id: "filter-languages", key: "languages", isArray: true, fn: langName }
  ];
  for (const { id, key, isArray, fn, pinTop } of fields) {
    const container = document.getElementById(id);
    if (!container) continue;
    let allValues = collectDistinctValues(key, isArray);
    if (pinTop) {
      allValues = [
        ...pinTop.filter((v) => allValues.includes(v)),
        ...allValues.filter((v) => !pinTop.includes(v))
      ];
    }
    let topValues = collectTopValues(key, isArray, FILTER_TOP_N);
    if (pinTop) {
      topValues = [
        ...pinTop.filter((v) => topValues.includes(v)),
        ...topValues.filter((v) => !pinTop.includes(v))
      ];
    }
    buildPills(container, allValues, key, fn);
    container._allValues = allValues;
    container._topValues = topValues;
    container._filterKey = key;
    container._labelFn = fn;
    const searchInput = document.querySelector(
      `.filter-search-within[data-target="${id}"]`
    );
    if (searchInput) searchInput.hidden = allValues.length <= FILTER_TOP_N;
  }
  const settingVals = collectDistinctValues("settings", true);
  const settingTop = collectTopValues("settings", true, PUBLISHER_AUTHOR_TOP_N);
  const SETTING_PIN = ["Setting-Agnostic", "Western Reaches"];
  const settingValsOrdered = [
    ...SETTING_PIN.filter((v) => settingVals.includes(v)),
    ...settingVals.filter((v) => !SETTING_PIN.includes(v))
  ];
  const settingTopOrdered = [
    ...SETTING_PIN.filter((v) => settingTop.includes(v)),
    ...settingTop.filter((v) => !SETTING_PIN.includes(v))
  ];
  const settingContainer = document.getElementById(
    "filter-setting"
  );
  if (settingContainer) {
    const settingVisible = defaultVisibleValues(
      settingTopOrdered,
      settingValsOrdered,
      "settings"
    );
    buildPills(settingContainer, settingVisible, "settings", null);
    setMoreNote(
      settingContainer,
      filterHiddenCount(settingValsOrdered.length, settingVisible.length)
    );
    settingContainer._allValues = settingValsOrdered;
    settingContainer._topValues = settingTopOrdered;
    settingContainer._filterKey = "settings";
    settingContainer._labelFn = null;
    settingContainer._hasTopNCap = true;
    const settingSearch = document.querySelector(
      '.filter-search-within[data-target="filter-setting"]'
    );
    if (settingSearch) {
      settingSearch.hidden = settingValsOrdered.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }
  const publisherVals = collectDistinctValues("pub", false);
  const publisherTop = collectTopValues("pub", false, PUBLISHER_AUTHOR_TOP_N);
  const authorVals = collectDistinctValues("authors", true);
  const authorTop = collectTopValues("authors", true, PUBLISHER_AUTHOR_TOP_N);
  const pubContainer = document.getElementById(
    "filter-publisher"
  );
  if (pubContainer) {
    const pubVisible = defaultVisibleValues(publisherTop, publisherVals, "pub");
    buildPills(pubContainer, pubVisible, "pub", (v) => v);
    setMoreNote(
      pubContainer,
      filterHiddenCount(publisherVals.length, pubVisible.length)
    );
    pubContainer._allValues = publisherVals;
    pubContainer._topValues = publisherTop;
    pubContainer._filterKey = "pub";
    pubContainer._labelFn = (v) => v;
    pubContainer._hasTopNCap = true;
    const pubSearch = document.querySelector(
      '.filter-search-within[data-target="filter-publisher"]'
    );
    if (pubSearch) {
      pubSearch.hidden = publisherVals.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }
  const authorContainer = document.getElementById(
    "filter-authors"
  );
  if (authorContainer) {
    const authorVisible = defaultVisibleValues(
      authorTop,
      authorVals,
      "authors"
    );
    buildPills(authorContainer, authorVisible, "authors", (v) => v);
    setMoreNote(
      authorContainer,
      filterHiddenCount(authorVals.length, authorVisible.length)
    );
    authorContainer._allValues = authorVals;
    authorContainer._topValues = authorTop;
    authorContainer._filterKey = "authors";
    authorContainer._labelFn = (v) => v;
    authorContainer._hasTopNCap = true;
    const authorSearch = document.querySelector(
      '.filter-search-within[data-target="filter-authors"]'
    );
    if (authorSearch) {
      authorSearch.hidden = authorVals.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }
  const charOptVals = collectDistinctValues("character_options", true);
  const charOptTop = collectTopValues(
    "character_options",
    true,
    PUBLISHER_AUTHOR_TOP_N
  );
  const charOptContainer = document.getElementById(
    "filter-character-options"
  );
  if (charOptContainer) {
    const charOptVisible = defaultVisibleValues(
      charOptTop,
      charOptVals,
      "character_options"
    );
    buildPills(charOptContainer, charOptVisible, "character_options", (v) => v);
    setMoreNote(
      charOptContainer,
      filterHiddenCount(charOptVals.length, charOptVisible.length)
    );
    charOptContainer._allValues = charOptVals;
    charOptContainer._topValues = charOptTop;
    charOptContainer._filterKey = "character_options";
    charOptContainer._labelFn = (v) => v;
    charOptContainer._hasTopNCap = true;
    const charOptSearch = document.querySelector(
      '.filter-search-within[data-target="filter-character-options"]'
    );
    if (charOptSearch) {
      charOptSearch.hidden = charOptVals.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }
  syncFilterControlStates();
}
function syncFilterControlStates() {
  const f = state.filters;
  document.getElementById("has-character-options").checked = f.hasCharacterOptions;
  document.getElementById("toggle-official").checked = f.official;
  document.getElementById("toggle-upcoming").checked = f.upcoming;
  document.getElementById(
    "exclude-unspecified-level"
  ).checked = f.excludeUnspecifiedLevel;
  document.getElementById(
    "exclude-unspecified-party"
  ).checked = f.excludeUnspecifiedParty;
  document.getElementById("level-min").value = f.lmin !== null ? String(f.lmin) : "";
  document.getElementById("level-max").value = f.lmax !== null ? String(f.lmax) : "";
  document.getElementById("party-min").value = f.pmin !== null ? String(f.pmin) : "";
  document.getElementById("party-max").value = f.pmax !== null ? String(f.pmax) : "";
  const fromInput = document.getElementById("date-from");
  if (fromInput && fromInput._monthPicker) {
    fromInput._monthPicker.setValue(f.dmin);
  }
  const toInput = document.getElementById("date-to");
  if (toInput && toInput._monthPicker) {
    toInput._monthPicker.setValue(f.dmax);
  }
  document.getElementById("search-input").value = state.query;
  document.getElementById("sort-select").value = state.sort;
  const sortReverseBtn = document.getElementById("sort-reverse");
  if (sortReverseBtn) {
    sortReverseBtn.textContent = state.sortReverse ? "\u2193" : "\u2191";
    sortReverseBtn.setAttribute("aria-pressed", String(state.sortReverse));
  }
  const reshuffleBtn = document.getElementById("sort-reshuffle");
  if (reshuffleBtn) {
    reshuffleBtn.hidden = state.sort !== "shuffle";
  }
}
function updateClearButton() {
  const btn = document.getElementById("clear-filters");
  if (btn) btn.disabled = !hasActiveFilters();
  syncFilterGroupIndicators();
}
function syncFilterGroupIndicators() {
  const f = state.filters;
  const groups = [
    {
      key: "category",
      active: f.categories.length > 0,
      count: f.categories.length
    },
    { key: "pricing", active: f.pricings.length > 0, count: f.pricings.length },
    { key: "systems", active: f.systems.length > 0, count: f.systems.length },
    {
      key: "settings",
      active: f.settings.length > 0,
      count: f.settings.length
    },
    { key: "envs", active: f.envs.length > 0, count: f.envs.length },
    { key: "themes", active: f.themes.length > 0, count: f.themes.length },
    { key: "pub", active: f.pub.length > 0, count: f.pub.length },
    { key: "authors", active: f.authors.length > 0, count: f.authors.length },
    {
      key: "character_options",
      active: f.character_options.length > 0 || f.hasCharacterOptions,
      count: f.character_options.length + (f.hasCharacterOptions ? 1 : 0)
    },
    {
      key: "languages",
      active: f.languages.length > 0,
      count: f.languages.length
    },
    {
      key: "level",
      active: f.lmin !== null || f.lmax !== null || f.excludeUnspecifiedLevel,
      count: (f.lmin !== null ? 1 : 0) + (f.lmax !== null ? 1 : 0) + (f.excludeUnspecifiedLevel ? 1 : 0)
    },
    {
      key: "party",
      active: f.pmin !== null || f.pmax !== null || f.excludeUnspecifiedParty,
      count: (f.pmin !== null ? 1 : 0) + (f.pmax !== null ? 1 : 0) + (f.excludeUnspecifiedParty ? 1 : 0)
    },
    {
      key: "date",
      active: f.dmin !== null || f.dmax !== null,
      count: (f.dmin !== null ? 1 : 0) + (f.dmax !== null ? 1 : 0)
    }
  ];
  let totalActive = 0;
  for (const { key, active, count } of groups) {
    if (active) ++totalActive;
    const btn = document.querySelector(
      `.filter-group-toggle[data-filter-key="${key}"]`
    );
    if (!btn) continue;
    let badge = btn.querySelector(".filter-active-badge");
    if (active) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-active-badge";
        badge.setAttribute("aria-hidden", "true");
        btn.insertBefore(badge, btn.querySelector(".filter-group-chevron"));
      }
      badge.textContent = String(count);
    } else if (badge) {
      badge.remove();
    }
  }
  const mobileBtn = document.getElementById("mobile-filter-toggle");
  if (mobileBtn) {
    let mobileBadge = mobileBtn.querySelector(
      ".filter-active-badge"
    );
    if (totalActive > 0) {
      if (!mobileBadge) {
        mobileBadge = document.createElement("span");
        mobileBadge.className = "filter-active-badge";
        mobileBadge.setAttribute("aria-hidden", "true");
        mobileBtn.appendChild(mobileBadge);
      }
      mobileBadge.textContent = String(totalActive);
    } else if (mobileBadge) {
      mobileBadge.remove();
    }
  }
}
function renderResults() {
  const list = document.getElementById("results-list");
  const summary = document.getElementById("result-summary");
  const backBtn = document.getElementById("back-to-all");
  const backToListBtn = document.getElementById("back-to-list");
  const paginationEl = document.getElementById("pagination");
  updateClearButton();
  if (state.directId) {
    const entry = state.data ? state.data.find((e) => e.id === state.directId) : null;
    document.getElementById("search-sort-bar").hidden = true;
    document.getElementById("mobile-filter-toggle").hidden = true;
    backBtn.hidden = false;
    backToListBtn.hidden = !state.listMode;
    paginationEl.innerHTML = "";
    if (entry) {
      document.title = `${entry.title} \u2014 Torchfinder \u2014 Lodes & Lanterns`;
      summary.textContent = "";
      list.innerHTML = renderCardHtml(entry, true);
      attachCardListeners(list);
      const heading = list.querySelector(".card-title");
      if (heading) requestAnimationFrame(() => heading.focus());
    } else {
      document.title = "Torchfinder \u2014 Lodes & Lanterns";
      summary.textContent = "";
      list.innerHTML = '<div class="empty-state"><p>Entry not found.</p></div>';
    }
    updateUrl();
    return;
  }
  backToListBtn.hidden = true;
  if (state.listMode) {
    document.title = `${state.listName || "Untitled list"} \u2014 Torchfinder \u2014 Lodes & Lanterns`;
    document.getElementById("search-sort-bar").hidden = true;
    document.getElementById("mobile-filter-toggle").hidden = true;
    backBtn.hidden = false;
    paginationEl.innerHTML = "";
    const isDeletable = !!(state.listId && getList(state.listId));
    const unsaved = !isDeletable && getListSavedState(state.listId, state.listEntries) !== "saved";
    summary.innerHTML = `<div class="list-view-title-row">
  <span class="list-view-name" id="list-view-name">${escapeHtml(state.listName || "Untitled list")}</span>
  ${unsaved ? '<span class="list-saved-badge list-saved-badge--unsaved">Unsaved</span>' : ""}
  ${isDeletable ? '<button type="button" class="list-rename-btn btn-delete outline secondary" id="list-delete-btn" aria-label="Delete list">Delete</button>' : ""}
  <button type="button" class="list-rename-btn outline secondary" id="list-rename-btn" aria-label="Rename list">Rename</button>
  <button type="button" class="list-rename-btn outline secondary" id="list-copy-url-btn">Share list</button>
</div>
<p class="list-view-bookmark-hint">Lists are automatically saved browser-side. Bookmarking backs up the <b>current</b> snapshot of the list.</p>`;
    document.getElementById("list-delete-btn")?.addEventListener(
      "click",
      () => {
        if (confirm(`Delete "${state.listName || "Untitled list"}"?`)) {
          deleteList(state.listId);
          state.listMode = false;
          state.listId = null;
          state.listName = "";
          state.listDescription = "";
          state.listEntries = [];
          state.listSynced = false;
          renderResults();
        }
      }
    );
    document.getElementById("list-rename-btn").addEventListener(
      "click",
      onStartRenameList
    );
    document.getElementById("list-copy-url-btn").addEventListener(
      "click",
      onCopyListUrl
    );
    if (state.data) renderListView();
    updateUrl();
    return;
  }
  document.getElementById("search-sort-bar").hidden = false;
  document.getElementById("mobile-filter-toggle").hidden = false;
  document.title = "Torchfinder \u2014 Lodes & Lanterns";
  backBtn.hidden = true;
  if (!state.data) return;
  const total = state.data.length;
  const count = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, count);
  const pageEntries = state.filtered.slice(start, end);
  if (count === 0) {
    summary.textContent = "No results found. Try broadening your filters.";
    list.innerHTML = '<div class="empty-state"><p>No results found. Try broadening your filters.</p></div>';
    paginationEl.innerHTML = "";
  } else {
    const range = count > 1 ? `${start + 1}\u2013${end} of ` : "";
    const label = count === 1 ? "entry" : "entries";
    const filtered = count !== total ? ` (filtered from ${total})` : "";
    summary.textContent = `Showing ${range}${count} ${label}${filtered}`;
    list.innerHTML = pageEntries.map((entry) => renderCardHtml(entry, entry.id === state.expandedCardId)).join("");
    attachCardListeners(list);
    renderPagination(totalPages);
  }
  updateUrl();
}
function attachCardListeners(container) {
  container.querySelectorAll(".result-card").forEach((card) => {
    const id = card.dataset.id;
    const header = card.querySelector(".card-header");
    if (!header) return;
    header.addEventListener("click", () => onCardClick(id));
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardClick(id);
      }
    });
    const titleLink = card.querySelector(".card-title-link");
    if (titleLink) {
      titleLink.addEventListener("click", (e) => e.stopPropagation());
    }
    card.querySelectorAll(".add-to-list-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openAddToListModal(btn.dataset.id);
      });
    });
    card.querySelectorAll(".card-list-link").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenList(a.dataset.listId);
      });
    });
    card.querySelectorAll(".copy-entry-id-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.id).then(() => {
          const prev = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => {
            btn.textContent = prev;
          }, 1500);
        }).catch(() => {
        });
      });
    });
    card.querySelectorAll(".copy-entry-link-btn").forEach(
      (btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const url = `${globalThis.location.origin}${globalThis.location.pathname}?id=${encodeURIComponent(btn.dataset.id)}`;
          navigator.clipboard.writeText(url).then(() => {
            const prev = btn.textContent;
            btn.textContent = "Copied!";
            setTimeout(() => {
              btn.textContent = prev;
            }, 1500);
          }).catch(() => {
          });
        });
      }
    );
  });
}
function renderCardHtml(entry, expanded) {
  const levelStr = formatLevelRange(entry.lmin, entry.lmax);
  const partyStr = formatPartySize(entry.pmin, entry.pmax);
  const upcoming = isUpcoming(entry.date);
  const authorStr = (entry.authors || []).join(", ");
  const tags = [];
  for (const cat of entry.categories || []) {
    tags.push(`<span class="card-tag">${escapeHtml(cat)}</span>`);
  }
  if ((entry.pricings || []).includes("free")) {
    tags.push(`<span class="card-tag card-tag-free">Free</span>`);
  }
  if ((entry.pricings || []).includes("pwyw")) {
    tags.push(
      `<span class="card-tag card-tag-pwyw" data-tip="Pay What You Want" tabindex="0">PWYW</span>`
    );
  }
  if (entry.official) {
    tags.push(`<span class="card-tag card-tag-official">Official</span>`);
  } else {
    tags.push(`<span class="card-tag card-tag-third-party">Third-Party</span>`);
  }
  if (upcoming) {
    tags.push(`<span class="card-tag card-tag-upcoming">Upcoming</span>`);
  }
  if (levelStr) {
    tags.push(`<span class="card-tag">${escapeHtml(levelStr)}</span>`);
  }
  if (partyStr) {
    tags.push(`<span class="card-tag">${escapeHtml(partyStr)}</span>`);
  }
  const coverHtml = entry.cover && getCoverConsent() === "granted" ? `<div class="card-cover-wrap"><img class="card-cover" src="${escapeHtml(entry.cover)}" alt="" loading="lazy" onerror="this.closest('.card-cover-wrap').remove()"></div>` : "";
  return `
<article class="result-card${expanded ? " expanded" : ""}" data-id="${escapeHtml(entry.id)}" aria-expanded="${expanded}">
  <div class="card-header" role="button" tabindex="0" aria-label="${escapeHtml(entry.title)}, ${expanded ? "collapse" : "expand"}">
    ${coverHtml}
    <div class="card-header-main">
      <h3 class="card-title">${state.directId === entry.id ? `<span class="card-title-link">${escapeHtml(entry.title)}</span>` : `<a class="card-title-link" href="?id=${encodeURIComponent(entry.id)}">${escapeHtml(entry.title)}</a>`}${entry.date ? `<span class="card-title-date"> (${escapeHtml(formatDateShort(entry.date))})</span>` : ""}<button type="button" class="add-to-list-btn outline secondary" data-id="${escapeHtml(entry.id)}" aria-label="Add ${escapeHtml(entry.title)} to a list">+ List</button><button type="button" class="copy-entry-link-btn outline secondary" data-id="${escapeHtml(entry.id)}" aria-label="Copy link to ${escapeHtml(entry.title)}">Copy link</button></h3>
      ${authorStr ? `<div class="card-byline">${escapeHtml(authorStr)}</div>` : ""}
      ${entry.desc ? `<div class="card-description-snippet">${escapeHtml(entry.desc)}</div>` : ""}
    </div>
    <div class="card-tags">${tags.join("")}</div>
    <span class="card-expand-icon" aria-hidden="true">\u25B6</span>
  </div>
  ${buildExpandedHtml(entry, upcoming)}
</article>`;
}
function buildExpandedHtml(entry, upcoming) {
  const issueId = encodeURIComponent(entry.id);
  const updateUrl2 = `https://github.com/Lodes-and-Lanterns/torchfinder-data/issues/new?template=update-entry.yml&title=Update+entry%3A+${issueId}&labels=update-entry`;
  const removeUrl = `https://github.com/Lodes-and-Lanterns/torchfinder-data/issues/new?template=remove-entry.yml&title=Remove+entry%3A+${issueId}&labels=remove-entry`;
  const rows = [];
  if (entry.pub) rows.push(row("Publisher", entry.pub));
  const sys = (entry.systems || []).join(", ");
  if (sys) rows.push(row("System", sys));
  const set = (entry.settings || []).join(", ");
  if (set) rows.push(row("Setting", set));
  const env = (entry.envs || []).join(", ");
  if (env) rows.push(row("Environment", env));
  const thm = (entry.themes || []).join(", ");
  if (thm) rows.push(row("Themes", thm));
  const levelStr = formatLevelRange(entry.lmin, entry.lmax);
  if (levelStr) rows.push(row("Level range", levelStr));
  const partyStr = formatPartySize(entry.pmin, entry.pmax);
  if (partyStr) rows.push(row("Party size", partyStr));
  const cls = (entry.character_options || []).join(", ");
  if (cls) rows.push(row("Character Options", cls));
  if (entry.pages != null) rows.push(row("Pages", String(entry.pages)));
  if (entry.date) {
    const dateLabel = formatDate(entry.date) + (upcoming ? ' <span class="badge upcoming">Upcoming</span>' : "");
    rows.push(`<tr><th scope="row">Published</th><td>${dateLabel}</td></tr>`);
  }
  const LINK_TYPE_LABELS = {
    ebook: "eBook",
    "ebook-and-print": "eBook & Print",
    print: "Print",
    vtt: "VTT",
    web: "Web"
  };
  const LINK_PRICING_LABELS = {
    free: "Free",
    paid: "Paid",
    pwyw: "PWYW"
  };
  const linksHtml = (entry.links || []).map((link) => {
    const typeLabel = link.type && LINK_TYPE_LABELS[link.type] ? ` <span class="link-type-desc">${LINK_TYPE_LABELS[link.type]}</span>` : "";
    const pricingLabel = link.pricing && LINK_PRICING_LABELS[link.pricing] ? ` <span class="link-pricing-badge">${LINK_PRICING_LABELS[link.pricing]}</span>` : "";
    const langLabel = link.language && link.language !== "en" ? ` <span class="lang-badge">${escapeHtml(langName(link.language))}</span>` : "";
    return `<li><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.title)}</a>${typeLabel}${pricingLabel}${langLabel}</li>`;
  }).join("");
  let parentHtml = "";
  if (entry.included_in && entry.included_in.length > 0) {
    const items = entry.included_in.map((pid) => {
      const parent = state.data ? state.data.find((e) => e.id === pid) : null;
      const label = parent ? parent.title : pid;
      return `<li><a href="?id=${encodeURIComponent(pid)}">${escapeHtml(label)}</a></li>`;
    }).join("");
    parentHtml = `<div class="card-section"><h4>Included in</h4><ul>${items}</ul></div>`;
  }
  let childrenHtml = "";
  if (entry.children && entry.children.length > 0) {
    const items = entry.children.map((cid) => {
      const child = state.data ? state.data.find((e) => e.id === cid) : null;
      const label = child ? child.title : cid;
      return `<li><a href="?id=${encodeURIComponent(cid)}">${escapeHtml(label)}</a></li>`;
    }).join("");
    childrenHtml = `<div class="card-section"><h4>Includes</h4><ul>${items}</ul></div>`;
  }
  const containingLists = getLists().filter(
    (l) => (l.entries || []).includes(entry.id)
  );
  const listsHtml = containingLists.length ? `<div class="card-section"><h4>Lists</h4><ul>${containingLists.map(
    (l) => `<li><a href="#" class="card-list-link" data-list-id="${escapeHtml(l.id)}">${escapeHtml(l.name || "Untitled list")}</a></li>`
  ).join("")}</ul></div>` : "";
  return `
<div class="card-expanded">
  ${entry.desc ? `<p class="card-expanded-desc">${escapeHtml(entry.desc)}</p>` : ""}
  ${rows.length ? `<table class="card-meta-table"><tbody>${rows.join("")}</tbody></table>` : ""}
  ${parentHtml}
  ${childrenHtml}
  ${linksHtml ? `<div class="card-section"><h4>Links</h4><ul class="card-links">${linksHtml}</ul></div>` : ""}
  ${listsHtml}
  <div class="card-footer-actions">
    <a href="${escapeHtml(updateUrl2)}" target="_blank" rel="noopener" class="report-issue-link update-entry">Update or correct this entry</a>
    <a href="${escapeHtml(removeUrl)}" target="_blank" rel="noopener" class="report-issue-link remove-entry">Request removal of this entry</a>
    <button type="button" class="copy-entry-id-btn outline" data-id="${escapeHtml(entry.id)}">Copy ID</button>
  </div>
</div>`;
}
function row(label, value) {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}
function renderPagination(totalPages) {
  const nav = document.getElementById("pagination");
  if (!nav) return;
  if (totalPages <= 1) {
    nav.innerHTML = "";
    return;
  }
  const current = state.page;
  const pages = computePageNumbers(current, totalPages);
  const items = [];
  items.push(
    `<li><a href="#" class="pagination-btn${current <= 1 ? " disabled" : ""}" data-page="${current - 1}" aria-label="Previous page"${current <= 1 ? ' aria-disabled="true" tabindex="-1"' : ""}>&#x2190;</a></li>`
  );
  for (const p of pages) {
    if (p === "...") {
      items.push(
        `<li><span class="pagination-ellipsis" aria-hidden="true">&#x2026;</span></li>`
      );
    } else {
      const isCurrent = p === current;
      items.push(
        `<li><a href="#" class="pagination-btn${isCurrent ? " current" : ""}" data-page="${p}" aria-label="Page ${p}"${isCurrent ? ' aria-current="page"' : ""}>${p}</a></li>`
      );
    }
  }
  items.push(
    `<li><a href="#" class="pagination-btn${current >= totalPages ? " disabled" : ""}" data-page="${current + 1}" aria-label="Next page"${current >= totalPages ? ' aria-disabled="true" tabindex="-1"' : ""}>&#x2192;</a></li>`
  );
  nav.innerHTML = `<ul class="pagination-list">${items.join("")}</ul>`;
  nav.querySelectorAll(".pagination-btn:not(.disabled)").forEach(
    (btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(btn.dataset.page, 10);
        if (page >= 1 && page <= totalPages) onPageChange(page);
      });
    }
  );
}
function computePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); ++i) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
function showLoading() {
  const list = document.getElementById("results-list");
  const summary = document.getElementById("result-summary");
  list.innerHTML = `
<div class="loading-skeleton" aria-label="Loading results" aria-busy="true">
  ${Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join(
    ""
  )}
</div>`;
  summary.textContent = "Loading\u2026";
}
function showError() {
  const list = document.getElementById("results-list");
  const summary = document.getElementById("result-summary");
  list.innerHTML = '<div class="error-state" role="alert"><p>Failed to load adventure data. Please try refreshing the page.</p></div>';
  summary.textContent = "";
}
function enableControls() {
  document.querySelectorAll(
    "#filter-controls input, #filter-controls select, #filter-controls button, #search-input, #sort-select, #sort-reverse, #sort-reshuffle"
  ).forEach((el) => {
    el.disabled = false;
  });
  document.querySelectorAll(
    "#random-content-btn, #random-content-btn-mobile"
  ).forEach((btn) => {
    btn.disabled = false;
  });
}
function onPillToggle(key, value, btn) {
  const arr = state.filters[key];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value);
  else arr.splice(idx, 1);
  const isActive = arr.includes(value);
  btn.classList.toggle("active", isActive);
  btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  state.page = 1;
  state.expandedCardId = null;
  applyFilters();
  renderResults();
  updateClearButton();
}
function onCardClick(id) {
  const wasExpanded = state.expandedCardId === id;
  if (state.expandedCardId && state.expandedCardId !== id) {
    const prev = document.querySelector(
      `.result-card[data-id="${CSS.escape(state.expandedCardId)}"]`
    );
    if (prev) {
      prev.classList.remove("expanded");
      prev.setAttribute("aria-expanded", "false");
      const prevContent = prev.querySelector(".card-expanded");
      if (prevContent) prevContent.style.display = "none";
    }
  }
  state.expandedCardId = wasExpanded ? null : id;
  const card = document.querySelector(
    `.result-card[data-id="${CSS.escape(id)}"]`
  );
  if (!card) return;
  const expanding = !wasExpanded;
  card.classList.toggle("expanded", expanding);
  card.setAttribute("aria-expanded", String(expanding));
  const content = card.querySelector(".card-expanded");
  if (content) content.style.display = expanding ? "block" : "none";
  if (expanding) {
    const heading = card.querySelector(".card-title");
    if (heading) heading.focus({ preventScroll: true });
  }
  updateUrl();
}
function onPageChange(page) {
  const distanceFromBottom = document.documentElement.scrollHeight - globalThis.scrollY - globalThis.innerHeight;
  state.page = page;
  renderResults();
  requestAnimationFrame(() => {
    const newScrollY = document.documentElement.scrollHeight - distanceFromBottom - globalThis.innerHeight;
    globalThis.scrollTo({ top: Math.max(0, newScrollY), behavior: "instant" });
  });
}
function renderListView() {
  const list = document.getElementById("results-list");
  const unsaved = !getList(state.listId) && getListSavedState(state.listId, state.listEntries) !== "saved";
  const headerHtml = unsaved ? '<div class="list-view-actions"><button type="button" class="outline secondary" id="list-save-btn">Save</button></div>' : "";
  let rowsHtml;
  if (state.listEntries.length === 0) {
    rowsHtml = '<div class="empty-state"><p>This list is empty. Browse and expand entries to add them.</p></div>';
  } else {
    const total = state.listEntries.length;
    rowsHtml = state.listEntries.map((entryId, idx) => {
      const entry = state.data ? state.data.find((e) => e.id === entryId) : null;
      const upDisabled = idx === 0 ? " disabled" : "";
      const downDisabled = idx === total - 1 ? " disabled" : "";
      if (entry) {
        const byline = entry.authors && entry.authors.length ? `<div class="list-entry-byline">${escapeHtml(entry.authors.join(", "))}</div>` : "";
        return `
<div class="list-entry-row" draggable="true" data-idx="${idx}" data-id="${escapeHtml(entry.id)}">
  <span class="list-drag-handle" aria-hidden="true">\u2807</span>
  <div class="list-entry-num">${idx + 1}</div>
  <div class="list-entry-info">
    <a href="?id=${encodeURIComponent(entry.id)}" class="list-entry-title">${escapeHtml(entry.title)}</a>
    ${byline}
  </div>
  <div class="list-entry-controls">
    <button type="button" class="list-move-btn" data-dir="up" aria-label="Move up"${upDisabled}>&#x2191;</button>
    <button type="button" class="list-move-btn" data-dir="down" aria-label="Move down"${downDisabled}>&#x2193;</button>
    <button type="button" class="list-remove-btn" aria-label="Remove from list">&#x2715;</button>
  </div>
</div>`;
      } else {
        return `
<div class="list-entry-row list-entry-stale" draggable="true" data-idx="${idx}" data-id="${escapeHtml(entryId)}">
  <span class="list-drag-handle" aria-hidden="true">\u2807</span>
  <div class="list-entry-num">${idx + 1}</div>
  <div class="list-entry-info">
    <span class="list-entry-title list-entry-title--stale">Unknown entry</span>
    <div class="list-entry-byline list-entry-stale-note">ID: ${escapeHtml(entryId)}</div>
  </div>
  <div class="list-entry-controls">
    <button type="button" class="list-move-btn" data-dir="up" aria-label="Move up"${upDisabled}>&#x2191;</button>
    <button type="button" class="list-move-btn" data-dir="down" aria-label="Move down"${downDisabled}>&#x2193;</button>
    <button type="button" class="list-remove-btn" aria-label="Remove from list">&#x2715;</button>
  </div>
</div>`;
      }
    }).join("");
  }
  const descriptionHtml = `<textarea
    class="list-view-description"
    id="list-view-description"
    placeholder="Add a description\u2026"
    rows="1"
    aria-label="List description"
  >${escapeHtml(state.listDescription || "")}</textarea>`;
  list.innerHTML = descriptionHtml + headerHtml + rowsHtml;
  const descEl = document.getElementById(
    "list-view-description"
  );
  function autoResize() {
    descEl.style.height = "auto";
    descEl.style.height = descEl.scrollHeight + "px";
  }
  autoResize();
  descEl.addEventListener("input", autoResize);
  descEl.addEventListener("blur", () => {
    state.listDescription = descEl.value.trim();
    autoSave();
    updateUrl();
  });
  document.getElementById("list-save-btn")?.addEventListener(
    "click",
    onSaveList
  );
  list.querySelectorAll(".list-remove-btn").forEach((btn) => {
    const row2 = btn.closest(".list-entry-row");
    btn.addEventListener(
      "click",
      () => onListEntryRemove(parseInt(row2.dataset.idx, 10))
    );
  });
  list.querySelectorAll(".list-move-btn").forEach((btn) => {
    const row2 = btn.closest(".list-entry-row");
    btn.addEventListener(
      "click",
      () => onListEntryMove(parseInt(row2.dataset.idx, 10), btn.dataset.dir)
    );
  });
  list.querySelectorAll(".list-entry-title[href]").forEach(
    (link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const params = new URLSearchParams(
          new URL(link.href, globalThis.location.href).search
        );
        state.directId = params.get("id");
        renderResults();
      });
    }
  );
  setupListDragDrop(list);
}
function setupListDragDrop(container) {
  let dragSrcIdx = null;
  function clearIndicators() {
    container.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach(
      (el) => {
        el.classList.remove("drag-over-top", "drag-over-bottom");
      }
    );
  }
  container.querySelectorAll(".list-entry-row").forEach((row2) => {
    row2.addEventListener("dragstart", (e) => {
      dragSrcIdx = parseInt(row2.dataset.idx, 10);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
      requestAnimationFrame(() => row2.classList.add("drag-dragging"));
    });
    row2.addEventListener("dragend", () => {
      row2.classList.remove("drag-dragging");
      clearIndicators();
      dragSrcIdx = null;
    });
    row2.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (dragSrcIdx === null || parseInt(row2.dataset.idx, 10) === dragSrcIdx) {
        return;
      }
      e.dataTransfer.dropEffect = "move";
      clearIndicators();
      const rect = row2.getBoundingClientRect();
      row2.classList.add(
        e.clientY < rect.top + rect.height / 2 ? "drag-over-top" : "drag-over-bottom"
      );
    });
    row2.addEventListener("dragleave", (e) => {
      if (!row2.contains(e.relatedTarget)) {
        row2.classList.remove("drag-over-top", "drag-over-bottom");
      }
    });
    row2.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragSrcIdx === null) return;
      const targetIdx = parseInt(row2.dataset.idx, 10);
      if (targetIdx === dragSrcIdx) return;
      const rect = row2.getBoundingClientRect();
      let insertAt = e.clientY < rect.top + rect.height / 2 ? targetIdx : targetIdx + 1;
      if (dragSrcIdx < insertAt) --insertAt;
      const [moved] = state.listEntries.splice(dragSrcIdx, 1);
      state.listEntries.splice(insertAt, 0, moved);
      autoSave();
      updateUrl();
      renderResults();
      requestAnimationFrame(() => {
        const movedRow = document.querySelector(
          `.list-entry-row[data-id="${CSS.escape(moved)}"]`
        );
        if (movedRow) {
          movedRow.classList.add("list-entry-moved");
          setTimeout(() => movedRow.classList.remove("list-entry-moved"), 700);
        }
      });
    });
  });
}
function renderListPanel() {
  const content = document.getElementById("list-panel-content");
  if (!content) return;
  const lists = getLists().sort(
    (a, b) => (b.lastAccessedAt || "").localeCompare(a.lastAccessedAt || "")
  );
  if (lists.length === 0) {
    content.innerHTML = '<p class="list-panel-empty">No saved lists yet.</p>';
    return;
  }
  content.innerHTML = lists.map(
    (l) => `
<div class="list-panel-item" data-id="${escapeHtml(l.id)}">
  <div class="list-panel-item-info">
    <a class="list-panel-item-name" data-id="${escapeHtml(l.id)}" href="#">${escapeHtml(l.name || "Untitled list")}</a>
    <span class="list-panel-item-count">${(l.entries || []).length} ${(l.entries || []).length === 1 ? "entry" : "entries"}</span>
  </div>
  <div class="list-panel-item-actions">
    <button type="button" class="list-panel-delete-btn btn-delete outline secondary" data-id="${escapeHtml(l.id)}" aria-label="Delete ${escapeHtml(l.name || "Untitled list")}">&#x2715;</button>
  </div>
</div>`
  ).join("");
  content.querySelectorAll(".list-panel-item-name").forEach(
    (a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        onOpenList(a.dataset.id);
      });
    }
  );
  content.querySelectorAll(".list-panel-delete-btn").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const l = getList(btn.dataset.id);
        if (l && confirm(`Delete "${l.name || "Untitled list"}"?`)) {
          deleteList(btn.dataset.id);
          renderListPanel();
        }
      });
    }
  );
}
var modalOpener = null;
var modalKeydownHandler = null;
function openAddToListModal(entryId) {
  const modal = document.getElementById("add-to-list-modal");
  const body = document.getElementById("list-modal-body");
  if (!modal || !body) return;
  modalOpener = document.activeElement;
  const allLists = getLists().sort(
    (a, b) => (b.lastAccessedAt || "").localeCompare(a.lastAccessedAt || "")
  );
  const recentLists = allLists.slice(0, 5);
  const hasLists = allLists.length > 0;
  function renderListButtons(lists, label) {
    const container = document.getElementById("list-modal-lists");
    const labelEl = document.getElementById("list-modal-lists-label");
    if (!container) return;
    if (labelEl) {
      labelEl.innerHTML = label === "Recent lists" ? `Recent lists <span class="list-modal-max-note">(Shows 5 max)</span>` : escapeHtml(label);
    }
    if (!lists.length) {
      container.innerHTML = '<p class="list-modal-no-recent">No matching lists.</p>';
      return;
    }
    container.innerHTML = lists.map(
      (l) => `<div class="list-modal-item-row">
  <span class="list-modal-item-name">${escapeHtml(l.name || "Untitled list")} <span class="list-item-count">(${(l.entries || []).length})</span></span>
  <button type="button" class="add-to-existing-list-btn outline secondary" data-list-id="${escapeHtml(l.id)}" aria-label="Add to ${escapeHtml(l.name || "Untitled list")}">+</button>
  <button type="button" class="list-modal-goto-btn outline secondary" data-list-id="${escapeHtml(l.id)}" aria-label="Go to ${escapeHtml(l.name || "Untitled list")}">&#x2192;</button>
</div>`
    ).join("");
    container.querySelectorAll(".add-to-existing-list-btn").forEach((btn) => {
      btn.addEventListener(
        "click",
        () => onAddToExistingList(entryId, btn.dataset.listId, btn)
      );
    });
    container.querySelectorAll(".list-modal-goto-btn").forEach(
      (btn) => {
        btn.addEventListener("click", () => {
          closeAddToListModal();
          onOpenList(btn.dataset.listId);
        });
      }
    );
  }
  body.innerHTML = `${hasLists ? `
<input type="search" id="list-modal-search" class="list-modal-search" placeholder="Search lists\u2026" aria-label="Search lists" />
<h4 class="list-modal-section-label" id="list-modal-lists-label">Recent lists <span class="list-modal-max-note">(Shows 5 max)</span></h4>
<div id="list-modal-lists" class="list-modal-recent"></div>` : ""}
<h4 class="list-modal-section-label">New list <span class="list-modal-max-note">(+)</span></h4>
<div class="list-modal-create">
  <input type="text" id="new-list-name-input" placeholder="List name\u2026" aria-label="New list name" />
  <button type="button" id="create-and-add-btn" class="outline secondary">Create &amp; add</button>
</div>
<p id="new-list-name-error" class="list-name-error" hidden></p>`;
  if (hasLists) {
    renderListButtons(recentLists, "Recent lists");
    document.getElementById("list-modal-search").addEventListener(
      "input",
      (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (q) {
          renderListButtons(
            allLists.filter(
              (l) => (l.name || "Untitled list").toLowerCase().includes(q)
            ),
            "Matching lists"
          );
        } else {
          renderListButtons(recentLists, "Recent lists");
        }
      }
    );
  }
  modal.removeAttribute("hidden");
  modal.removeAttribute("aria-hidden");
  const createBtn = document.getElementById("create-and-add-btn");
  const nameInput = document.getElementById(
    "new-list-name-input"
  );
  createBtn?.addEventListener("click", () => {
    onCreateAndAddToList(entryId, nameInput?.value.trim() || "Untitled list");
  });
  nameInput?.addEventListener("input", () => {
    const errEl = document.getElementById("new-list-name-error");
    if (errEl) errEl.hidden = true;
  });
  nameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onCreateAndAddToList(
        entryId,
        nameInput.value.trim() || "Untitled list"
      );
    }
    if (e.key === "Escape") closeAddToListModal();
  });
  requestAnimationFrame(() => {
    const first = modal.querySelector(
      "input, button:not([disabled])"
    );
    if (first) first.focus();
  });
  modalKeydownHandler = (e) => {
    if (e.key === "Escape") {
      closeAddToListModal();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    if (!first) return;
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  modal.addEventListener("keydown", modalKeydownHandler);
}
function closeAddToListModal() {
  const modal = document.getElementById("add-to-list-modal");
  if (modal) {
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");
    if (modalKeydownHandler) {
      modal.removeEventListener("keydown", modalKeydownHandler);
      modalKeydownHandler = null;
    }
  }
  if (modalOpener) {
    modalOpener.focus();
    modalOpener = null;
  }
}
function onSaveList() {
  if (!state.listId) state.listId = generateListId();
  state.listSynced = true;
  saveList({
    id: state.listId,
    name: state.listName || "Untitled list",
    description: state.listDescription,
    entries: state.listEntries
  });
  updateUrl();
  renderResults();
}
function onCopyListUrl() {
  navigator.clipboard.writeText(globalThis.location.href).then(() => {
    const btn = document.getElementById("list-copy-url-btn");
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Copied list data as shareable link!";
      setTimeout(() => {
        btn.textContent = prev;
      }, 2e3);
    }
  }).catch(() => {
  });
}
function autoSave() {
  if (state.listId && (state.listSynced || !!getList(state.listId))) {
    state.listSynced = true;
    saveList({
      id: state.listId,
      name: state.listName || "Untitled list",
      description: state.listDescription,
      entries: state.listEntries
    });
  }
}
function onListEntryRemove(idx) {
  state.listEntries.splice(idx, 1);
  autoSave();
  updateUrl();
  renderResults();
}
function onListEntryMove(idx, dir) {
  const entries = state.listEntries;
  const movedId = entries[idx];
  if (dir === "up" && idx > 0) {
    [entries[idx], entries[idx - 1]] = [entries[idx - 1], entries[idx]];
  } else if (dir === "down" && idx < entries.length - 1) {
    [entries[idx], entries[idx + 1]] = [entries[idx + 1], entries[idx]];
  } else {
    return;
  }
  autoSave();
  updateUrl();
  renderResults();
  requestAnimationFrame(() => {
    const movedRow = document.querySelector(
      `.list-entry-row[data-id="${CSS.escape(movedId)}"]`
    );
    if (movedRow) {
      movedRow.classList.add("list-entry-moved");
      setTimeout(() => movedRow.classList.remove("list-entry-moved"), 700);
    }
  });
}
function onStartRenameList() {
  const nameEl = document.getElementById("list-view-name");
  if (!nameEl) return;
  const current = state.listName || "Untitled list";
  const input = document.createElement("input");
  input.type = "text";
  input.value = current;
  input.className = "list-rename-input";
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  function commit() {
    const newName = input.value.trim() || "Untitled list";
    if (listNameExists(newName, state.listId)) {
      let errEl = input.nextElementSibling;
      if (!errEl || !errEl.classList.contains("list-name-error")) {
        errEl = document.createElement("p");
        errEl.className = "list-name-error";
        input.after(errEl);
      }
      errEl.textContent = `A list named "${newName}" already exists.`;
      input.focus();
      return;
    }
    state.listName = newName;
    if (state.listId && state.listSynced) {
      saveList({
        id: state.listId,
        name: newName,
        description: state.listDescription,
        entries: state.listEntries
      });
    }
    updateUrl();
    renderResults();
  }
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.removeEventListener("blur", commit);
      renderResults();
    }
  });
}
function onOpenList(id) {
  const l = getList(id);
  if (!l) return;
  state.directId = null;
  state.listMode = true;
  state.listId = id;
  state.listName = l.name || "Untitled list";
  state.listDescription = l.description || "";
  state.listEntries = [...l.entries];
  state.listSynced = true;
  touchList(id);
  closeListPanelInternal();
  renderResults();
}
function onAddToExistingList(entryId, listId, btn) {
  const l = getList(listId);
  if (!l) return;
  const alreadyIn = l.entries.includes(entryId);
  if (!alreadyIn) {
    l.entries.push(entryId);
    saveList(l);
  } else {
    touchList(listId);
  }
  if (btn) {
    const count = l.entries.length;
    const row2 = btn.closest(".list-modal-item-row");
    const countEl = row2 && row2.querySelector(".list-item-count");
    if (alreadyIn) {
      if (row2) row2.style.animation = "list-row-flash-red 0.35s ease-in-out 2";
      if (countEl) countEl.textContent = `(${count}) - already in list`;
    } else {
      if (countEl) countEl.textContent = `(${count})`;
    }
    btn.textContent = alreadyIn ? "!" : "\u2713";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "+";
      btn.disabled = false;
      if (countEl) countEl.textContent = `(${count})`;
      if (row2) row2.style.animation = "";
    }, 1500);
  }
}
function onCreateAndAddToList(entryId, name) {
  const resolvedName = name || "Untitled list";
  if (listNameExists(resolvedName)) {
    const errEl = document.getElementById("new-list-name-error");
    if (errEl) {
      errEl.textContent = `A list named "${resolvedName}" already exists.`;
      errEl.hidden = false;
    }
    return;
  }
  const id = generateListId();
  saveList({ id, name: resolvedName, entries: [entryId] });
  openAddToListModal(entryId);
  requestAnimationFrame(() => {
    const newBtn = document.querySelector(
      `.add-to-existing-list-btn[data-list-id="${id}"]`
    );
    if (newBtn) {
      const row2 = newBtn.closest(".list-modal-item-row");
      if (row2) row2.style.animation = "list-row-flash 0.35s ease-in-out 2";
      newBtn.textContent = "\u2713";
      newBtn.disabled = true;
      setTimeout(() => {
        newBtn.textContent = "+";
        newBtn.disabled = false;
        if (row2) row2.style.animation = "";
      }, 1500);
    }
  });
}
function closeListPanelInternal() {
  const panel = document.getElementById("list-panel");
  if (panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }
  const overlay = document.getElementById("list-overlay");
  if (overlay) overlay.classList.remove("active");
  const toggle = document.getElementById("mobile-list-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

// src/handlers.ts
var debouncedSearch = debounce((value) => {
  state.query = value;
  state.page = 1;
  state.expandedCardId = null;
  applyFilters();
  renderResults();
}, SEARCH_DEBOUNCE_MS);
function onSortChange(value) {
  state.sort = value;
  state.sortReverse = false;
  sortFiltered();
  state.page = 1;
  syncFilterControlStates();
  renderResults();
  if (value === "shuffle") {
    const btn = document.getElementById("sort-reshuffle");
    if (btn) {
      btn.classList.remove("pulsing");
      requestAnimationFrame(() => {
        btn.classList.add("pulsing");
        btn.addEventListener(
          "animationend",
          () => btn.classList.remove("pulsing"),
          { once: true }
        );
      });
    }
  }
}
function onRangeChange() {
  const levelMin = document.getElementById("level-min");
  const levelMax = document.getElementById("level-max");
  const partyMin = document.getElementById("party-min");
  const partyMax = document.getElementById("party-max");
  const levelRangeWarning = document.getElementById(
    "level-range-warning"
  );
  const partyRangeWarning = document.getElementById(
    "party-range-warning"
  );
  state.filters.lmin = levelMin.value !== "" ? parseInt(levelMin.value, 10) : null;
  state.filters.lmax = levelMax.value !== "" ? parseInt(levelMax.value, 10) : null;
  state.filters.pmin = partyMin.value !== "" ? parseInt(partyMin.value, 10) : null;
  state.filters.pmax = partyMax.value !== "" ? parseInt(partyMax.value, 10) : null;
  const levelInvalid = state.filters.lmin !== null && state.filters.lmax !== null && state.filters.lmin > state.filters.lmax;
  const partyInvalid = state.filters.pmin !== null && state.filters.pmax !== null && state.filters.pmin > state.filters.pmax;
  levelRangeWarning.hidden = !levelInvalid;
  partyRangeWarning.hidden = !partyInvalid;
  state.page = 1;
  applyFilters();
  renderResults();
}
function onClearFilters() {
  state.filters = {
    categories: [],
    systems: [],
    settings: [],
    envs: [],
    themes: [],
    languages: [],
    pub: [],
    authors: [],
    pricings: [],
    character_options: [],
    hasCharacterOptions: false,
    official: false,
    upcoming: false,
    excludeUnspecifiedLevel: false,
    excludeUnspecifiedParty: false,
    lmin: null,
    lmax: null,
    pmin: null,
    pmax: null,
    dmin: null,
    dmax: null
  };
  state.query = "";
  state.page = 1;
  state.expandedCardId = null;
  document.querySelectorAll(".filter-search-within").forEach(
    (input) => {
      input.value = "";
      const targetId = input.dataset.target;
      const container = targetId ? document.getElementById(targetId) : null;
      if (container && container._topValues) {
        buildPills(
          container,
          container._topValues,
          container._filterKey,
          container._labelFn
        );
      }
    }
  );
  renderFilterSidebar();
  applyFilters();
  renderResults();
}
function openFilterPanel() {
  const sidebar = document.getElementById("filter-sidebar");
  const overlay = document.getElementById("filter-overlay");
  const toggle = document.getElementById("mobile-filter-toggle");
  sidebar.classList.add("open");
  sidebar.removeAttribute("aria-hidden");
  overlay.classList.add("active");
  toggle.setAttribute("aria-expanded", "true");
  const first = sidebar.querySelector(
    "button:not([disabled]), input:not([disabled])"
  );
  if (first) first.focus();
  sidebar.addEventListener("keydown", trapFocus);
}
function closeFilterPanel() {
  const sidebar = document.getElementById("filter-sidebar");
  const overlay = document.getElementById("filter-overlay");
  const toggle = document.getElementById("mobile-filter-toggle");
  sidebar.classList.remove("open");
  sidebar.setAttribute("aria-hidden", "true");
  overlay.classList.remove("active");
  toggle.setAttribute("aria-expanded", "false");
  toggle.focus();
  sidebar.removeEventListener("keydown", trapFocus);
}
function openListPanel() {
  const panel = document.getElementById("list-panel");
  const overlay = document.getElementById("list-overlay");
  const toggle = document.getElementById("mobile-list-toggle");
  renderListPanel();
  panel.classList.add("open");
  panel.removeAttribute("aria-hidden");
  overlay.classList.add("active");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  const first = panel.querySelector(
    "button:not([disabled]), input:not([disabled])"
  );
  if (first) first.focus();
}
function closeListPanel() {
  const panel = document.getElementById("list-panel");
  const overlay = document.getElementById("list-overlay");
  const toggle = document.getElementById("mobile-list-toggle");
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  overlay.classList.remove("active");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus({ preventScroll: true });
  }
}
function trapFocus(e) {
  if (e.key !== "Tab") return;
  const sidebar = document.getElementById("filter-sidebar");
  const focusable = sidebar.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// src/app.ts
function init() {
  parseUrlParams();
  const sidebar = document.getElementById("filter-sidebar");
  const isDesktop = () => globalThis.matchMedia("(min-width: 801px)").matches;
  if (isDesktop()) {
    sidebar.removeAttribute("aria-hidden");
  } else {
    sidebar.setAttribute("aria-hidden", "true");
  }
  document.getElementById("mobile-filter-toggle").addEventListener(
    "click",
    () => {
      const expanded = document.getElementById("mobile-filter-toggle").getAttribute(
        "aria-expanded"
      ) === "true";
      if (expanded) closeFilterPanel();
      else openFilterPanel();
    }
  );
  const closeBtn = document.getElementById("close-filter-panel");
  if (closeBtn) closeBtn.addEventListener("click", closeFilterPanel);
  document.getElementById("filter-overlay").addEventListener(
    "click",
    closeFilterPanel
  );
  function isListPanelOpen() {
    return document.getElementById("list-panel").classList.contains("open");
  }
  document.getElementById("mobile-list-toggle").addEventListener(
    "click",
    () => {
      if (isListPanelOpen()) closeListPanel();
      else openListPanel();
    }
  );
  document.getElementById("list-panel-toggle-mobile").addEventListener(
    "click",
    () => {
      if (isListPanelOpen()) closeListPanel();
      else {
        closeFilterPanel();
        openListPanel();
      }
    }
  );
  document.getElementById("close-list-panel").addEventListener(
    "click",
    closeListPanel
  );
  document.getElementById("export-lists-btn").addEventListener(
    "click",
    async () => {
      const data = getLists();
      const json = JSON.stringify(data, null, 2);
      const btn = document.getElementById("export-lists-btn");
      const prev = btn.textContent;
      try {
        if ("showSaveFilePicker" in window) {
          const handle = await globalThis.showSaveFilePicker({
            suggestedName: "torchfinder-lists.json",
            types: [{
              description: "JSON file",
              accept: { "application/json": [".json"] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(json);
          await writable.close();
        } else {
          const a = document.createElement("a");
          a.href = "data:application/json;charset=utf-8," + encodeURIComponent(json);
          a.download = "torchfinder-lists.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          btn.textContent = "Saved to default download folder!";
          setTimeout(() => {
            btn.textContent = prev;
          }, 2500);
          return;
        }
        btn.textContent = "Exported!";
        setTimeout(() => {
          btn.textContent = prev;
        }, 2e3);
      } catch (e) {
        if (e.name !== "AbortError") {
          alert("Export failed.");
        }
      }
    }
  );
  document.getElementById("import-lists-btn").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) throw new Error("not an array");
          const count = importLists(data);
          renderListPanel();
          const btn = document.getElementById("import-lists-btn");
          const prev = btn.textContent;
          btn.textContent = `Imported ${count}`;
          setTimeout(() => {
            btn.textContent = prev;
          }, 2e3);
        } catch {
          alert("Import failed: the file format is not valid.");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
  document.getElementById("delete-all-lists-btn").addEventListener(
    "click",
    () => {
      if (confirm(
        "Delete all saved lists? This cannot be undone (without an exported backup)."
      )) {
        clearAllLists();
        renderListPanel();
      }
    }
  );
  document.getElementById("list-overlay").addEventListener(
    "click",
    closeListPanel
  );
  document.getElementById("close-add-to-list-modal").addEventListener(
    "click",
    closeAddToListModal
  );
  document.querySelector(
    "#add-to-list-modal .list-modal-backdrop"
  ).addEventListener("click", closeAddToListModal);
  const cardTooltip = document.createElement("div");
  cardTooltip.id = "card-tooltip";
  cardTooltip.hidden = true;
  document.body.appendChild(cardTooltip);
  function showCardTooltip(tag) {
    cardTooltip.textContent = tag.dataset.tip;
    cardTooltip.hidden = false;
    const rect = tag.getBoundingClientRect();
    const tRect = cardTooltip.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(
        rect.left + globalThis.scrollX + rect.width / 2 - tRect.width / 2,
        globalThis.scrollX + globalThis.innerWidth - tRect.width - 8
      )
    );
    const top = rect.top + globalThis.scrollY - tRect.height - 6;
    cardTooltip.style.left = left + "px";
    cardTooltip.style.top = top + "px";
  }
  function hideCardTooltip() {
    cardTooltip.hidden = true;
  }
  document.addEventListener("mouseover", (e) => {
    const tag = e.target.closest(
      ".card-tag[data-tip]"
    );
    if (tag) showCardTooltip(tag);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(".card-tag[data-tip]")) hideCardTooltip();
  });
  document.addEventListener("focusin", (e) => {
    const tag = e.target.closest(
      ".card-tag[data-tip]"
    );
    if (tag) showCardTooltip(tag);
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.closest(".card-tag[data-tip]")) hideCardTooltip();
  });
  document.addEventListener("click", (e) => {
    const tag = e.target.closest(
      ".card-tag[data-tip]"
    );
    if (tag) {
      cardTooltip.hidden ? showCardTooltip(tag) : hideCardTooltip();
    } else {
      hideCardTooltip();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const modal = document.getElementById("add-to-list-modal");
    const listPanel = document.getElementById("list-panel");
    if (modal && !modal.hidden) {
      closeAddToListModal();
    } else if (listPanel && listPanel.classList.contains("open")) {
      closeListPanel();
    } else if (sidebar.classList.contains("open")) {
      closeFilterPanel();
    }
  });
  document.querySelectorAll(".filter-group-toggle").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const open = !expanded;
        btn.setAttribute("aria-expanded", String(open));
        const content = btn.nextElementSibling;
        if (!content) return;
        content.removeAttribute("hidden");
        content.style.display = open ? "block" : "none";
        if (open) {
          const pillGroup = content.querySelector(".pill-group");
          if (pillGroup) syncPillFade(pillGroup);
        }
      });
    }
  );
  document.getElementById("clear-filters").addEventListener(
    "click",
    onClearFilters
  );
  function resetToHome(e) {
    e.preventDefault();
    state.directId = null;
    state.listMode = false;
    state.listId = null;
    state.listName = "";
    state.listDescription = "";
    state.listEntries = [];
    state.listSynced = false;
    renderResults();
  }
  document.getElementById("back-to-list").addEventListener("click", (e) => {
    e.preventDefault();
    state.directId = null;
    renderResults();
  });
  document.getElementById("back-to-all").addEventListener(
    "click",
    resetToHome
  );
  function onRandomContent() {
    if (!state.data || state.data.length === 0) return;
    const entry = state.data[Math.floor(Math.random() * state.data.length)];
    state.directId = entry.id;
    state.listMode = false;
    state.listId = null;
    state.listName = "";
    state.listDescription = "";
    state.listEntries = [];
    state.listSynced = false;
    renderResults();
  }
  document.getElementById("random-content-btn").addEventListener(
    "click",
    onRandomContent
  );
  document.getElementById("random-content-btn-mobile").addEventListener(
    "click",
    onRandomContent
  );
  document.getElementById("home-link").addEventListener("click", (e) => {
    e.preventDefault();
    state.directId = null;
    state.listMode = false;
    state.listId = null;
    state.listName = "";
    state.listDescription = "";
    state.listEntries = [];
    state.listSynced = false;
    onClearFilters();
  });
  const searchInput = document.getElementById(
    "search-input"
  );
  const searchClear = document.getElementById("search-clear");
  function updateSearchClear() {
    searchClear.hidden = !searchInput.value;
  }
  searchInput.addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
    updateSearchClear();
  });
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    debouncedSearch("");
    updateSearchClear();
    searchInput.focus();
  });
  document.getElementById("sort-select").addEventListener(
    "change",
    (e) => onSortChange(e.target.value)
  );
  document.getElementById("sort-reverse").addEventListener("click", () => {
    state.sortReverse = !state.sortReverse;
    syncFilterControlStates();
    sortFiltered();
    state.page = 1;
    renderResults();
  });
  document.getElementById("sort-reshuffle").addEventListener("click", () => {
    clearShuffleCache();
    state.sortReverse = false;
    state.page = 1;
    sortFiltered();
    syncFilterControlStates();
    renderResults();
  });
  document.getElementById("toggle-official").addEventListener(
    "change",
    (e) => {
      state.filters.official = e.target.checked;
      state.page = 1;
      applyFilters();
      renderResults();
    }
  );
  document.getElementById("toggle-upcoming").addEventListener(
    "change",
    (e) => {
      state.filters.upcoming = e.target.checked;
      state.page = 1;
      applyFilters();
      renderResults();
    }
  );
  document.getElementById("has-character-options").addEventListener(
    "change",
    (e) => {
      state.filters.hasCharacterOptions = e.target.checked;
      state.page = 1;
      applyFilters();
      renderResults();
    }
  );
  document.getElementById("exclude-unspecified-level").addEventListener(
    "change",
    (e) => {
      state.filters.excludeUnspecifiedLevel = e.target.checked;
      state.page = 1;
      applyFilters();
      renderResults();
    }
  );
  document.getElementById("exclude-unspecified-party").addEventListener(
    "change",
    (e) => {
      state.filters.excludeUnspecifiedParty = e.target.checked;
      state.page = 1;
      applyFilters();
      renderResults();
    }
  );
  ["level-min", "level-max", "party-min", "party-max"].forEach((id) => {
    document.getElementById(id).addEventListener("change", onRangeChange);
  });
  const toPicker = createMonthPicker(
    document.getElementById("date-to"),
    {
      isStart: false,
      getOtherValue: () => state.filters.dmin,
      onSelect(value) {
        state.filters.dmax = value;
        state.page = 1;
        applyFilters();
        renderResults();
      }
    }
  );
  createMonthPicker(
    document.getElementById("date-from"),
    {
      // from picker
      isStart: true,
      getOtherValue: () => state.filters.dmax,
      onSelect(value) {
        state.filters.dmin = value;
        if (state.filters.dmax && state.filters.dmax < value) {
          state.filters.dmax = null;
          if (toPicker) toPicker.clear();
        }
        state.page = 1;
        applyFilters();
        renderResults();
      }
    }
  );
  document.querySelectorAll(".filter-search-within").forEach(
    (input) => {
      input.addEventListener("input", (e) => {
        const targetId = input.dataset.target;
        const container = targetId ? document.getElementById(targetId) : null;
        if (!container || !container._allValues) return;
        const q = e.target.value.toLowerCase();
        let visible;
        if (q === "") {
          if (container._hasTopNCap && container._topValues) {
            const selected = state.filters[container._filterKey] || [];
            const topSet = new Set(container._topValues);
            const extras = selected.filter(
              (v) => !topSet.has(v) && container._allValues.includes(v)
            );
            visible = [...container._topValues, ...extras];
          } else {
            visible = container._allValues;
          }
        } else {
          visible = container._allValues.filter((v) => {
            const label = container._labelFn ? container._labelFn(v) : v;
            return label.toLowerCase().includes(q) || v.toLowerCase().includes(q);
          });
        }
        buildPills(
          container,
          visible,
          container._filterKey,
          container._labelFn
        );
      });
    }
  );
  const mq = globalThis.matchMedia("(min-width: 801px)");
  mq.addEventListener("change", (e) => {
    if (e.matches) {
      sidebar.classList.remove("open");
      sidebar.removeAttribute("aria-hidden");
      document.getElementById("filter-overlay").classList.remove("active");
      document.getElementById("mobile-filter-toggle").setAttribute(
        "aria-expanded",
        "false"
      );
      sidebar.removeEventListener("keydown", trapFocus);
    } else {
      sidebar.setAttribute("aria-hidden", "true");
    }
  });
  function syncConsentUI() {
    const consent = getCoverConsent();
    const banner = document.getElementById("cover-consent-banner");
    const statusEl = document.getElementById("footer-thumbnail-status");
    const changeBtn = document.getElementById("footer-thumbnail-change");
    if (consent === null) {
      banner.hidden = false;
      statusEl.textContent = "";
      changeBtn.hidden = true;
    } else {
      banner.hidden = true;
      statusEl.textContent = consent === "granted" ? "enabled" : "disabled";
      changeBtn.hidden = false;
    }
  }
  document.getElementById("cover-consent-allow").addEventListener(
    "click",
    () => {
      setCoverConsent("granted");
      syncConsentUI();
      renderResults();
    }
  );
  document.getElementById("cover-consent-deny").addEventListener(
    "click",
    () => {
      setCoverConsent("denied");
      syncConsentUI();
    }
  );
  document.getElementById("footer-thumbnail-change").addEventListener(
    "click",
    () => {
      const banner = document.getElementById("cover-consent-banner");
      banner.hidden = false;
      banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  );
  syncConsentUI();
  showLoading();
  state.data = [];
  const worker = new Worker(new URL("worker.js?v=401fce47", import.meta.url), {
    type: "module"
  });
  worker.postMessage({ url: DATA_URL });
  let firstBatch = true;
  worker.onmessage = ({ data }) => {
    if (data.type === "batch") {
      state.data.push(...data.entries);
      if (firstBatch) {
        firstBatch = false;
        enableControls();
        renderFilterSidebar();
        syncFilterControlStates();
        updateSearchClear();
      }
      applyFilters();
      renderResults();
    } else if (data.type === "done") {
      renderFilterSidebar();
      applyFilters();
      renderResults();
      worker.terminate();
    } else if (data.type === "error") {
      console.error("Torchfinder: failed to load data:", data.message);
      showError();
      worker.terminate();
    }
  };
}
document.addEventListener("DOMContentLoaded", init);
