import { assertEquals, assertStrictEquals } from "@std/assert";
import { flushBuffer, processChunk } from "../src/worker-utilities.ts";

// PROCESS_CHUNK
////////////////

Deno.test("processChunk: complete line yields one entry and empty buffer", () => {
  const { buffer, entries } = processChunk("", '{"id":"a"}\n');
  assertEquals(entries, [{ id: "a" }]);
  assertStrictEquals(buffer, "");
});

Deno.test("processChunk: partial line yields no entries and carries buffer", () => {
  const { buffer, entries } = processChunk("", '{"id"');
  assertEquals(entries, []);
  assertStrictEquals(buffer, '{"id"');
});

Deno.test("processChunk: chunk boundary mid-object completes on next chunk", () => {
  const first = processChunk("", '{"id"');
  assertEquals(first.entries, []);

  const second = processChunk(first.buffer, ':"b"}\n');
  assertEquals(second.entries, [{ id: "b" }]);
  assertStrictEquals(second.buffer, "");
});

Deno.test("processChunk: multiple complete lines in one chunk", () => {
  const { buffer, entries } = processChunk(
    "",
    '{"id":"a"}\n{"id":"b"}\n{"id":"c"}\n',
  );

  assertEquals(entries, [{ id: "a" }, { id: "b" }, { id: "c" }]);
  assertStrictEquals(buffer, "");
});

Deno.test("processChunk: trailing partial line is held in buffer", () => {
  const { buffer, entries } = processChunk("", '{"id":"a"}\n{"id"');
  assertEquals(entries, [{ id: "a" }]);
  assertStrictEquals(buffer, '{"id"');
});

Deno.test("processChunk: existing buffer prepended to chunk correctly", () => {
  const { buffer, entries } = processChunk('{"id":"a', '"}\n');
  assertEquals(entries, [{ id: "a" }]);
  assertStrictEquals(buffer, "");
});

Deno.test("processChunk: blank lines are skipped", () => {
  const { entries } = processChunk("", '{"id":"a"}\n\n  \n{"id":"b"}\n');
  assertEquals(entries, [{ id: "a" }, { id: "b" }]);
});

Deno.test("processChunk: chunk with no newline at all is buffered entirely", () => {
  const { buffer, entries } = processChunk("", '{"id":"a"}');
  assertEquals(entries, []);
  assertStrictEquals(buffer, '{"id":"a"}');
});

Deno.test("processChunk: empty chunk leaves buffer unchanged", () => {
  const { buffer, entries } = processChunk('{"partial":', "");
  assertEquals(entries, []);
  assertStrictEquals(buffer, '{"partial":');
});

Deno.test("processChunk: parses complex entry fields correctly", () => {
  const entry = {
    id: "tomb",
    title: "The Tomb",
    authors: ["Alice"],
    lmin: 1,
    lmax: 3,
  };

  const line = JSON.stringify(entry) + "\n";
  const { entries } = processChunk("", line);

  assertEquals(entries, [entry]);
});

Deno.test("processChunk: accumulates correctly across three chunks", () => {
  const a = processChunk("", '{"id":"x"}\n{"id"');
  assertEquals(a.entries, [{ id: "x" }]);

  const b = processChunk(a.buffer, ':"y"}\n{"id":"z"}\n{"id"');
  assertEquals(b.entries, [{ id: "y" }, { id: "z" }]);

  const c = processChunk(b.buffer, ':"w"}\n');
  assertEquals(c.entries, [{ id: "w" }]);
  assertStrictEquals(c.buffer, "");
});

// FLUSH_BUFFER
///////////////

Deno.test("flushBuffer: empty string returns null", () => {
  assertStrictEquals(flushBuffer(""), null);
});

Deno.test("flushBuffer: whitespace-only string returns null", () => {
  assertStrictEquals(flushBuffer("   "), null);
  assertStrictEquals(flushBuffer("\n"), null);
});

Deno.test("flushBuffer: valid JSON returns parsed object", () => {
  assertEquals(flushBuffer('{"id":"z"}'), { id: "z" });
});

Deno.test("flushBuffer: parses complex entry without trailing newline", () => {
  const entry = { id: "final", title: "Last Entry", pricings: ["free"] };
  assertEquals(flushBuffer(JSON.stringify(entry)), entry);
});

Deno.test("flushBuffer: correctly handles last line after processChunk", () => {
  // Simulate a stream that ends without a trailing newline
  const { buffer } = processChunk("", '{"id":"a"}\n{"id":"b"}');
  assertEquals(flushBuffer(buffer), { id: "b" });
});
