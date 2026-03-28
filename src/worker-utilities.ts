/**
 * Pure JSONL parsing utilities used by worker.ts.
 * Extracted here so they can be unit-tested without a Worker environment.
 */

/**
 * Processes one text chunk from a streaming JSONL response.
 * Appends the chunk to the carry-over buffer, splits on newlines,
 * parses each complete line as JSON, and returns the results along
 * with the new (potentially incomplete) trailing buffer.
 */
export function processChunk(
  buffer: string,
  chunk: string,
): { buffer: string; entries: object[] } {
  const lines = (buffer + chunk).split("\n");
  const newBuffer = lines.pop()!; // last element may be incomplete
  const entries: object[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    entries.push(JSON.parse(line));
  }

  return { buffer: newBuffer, entries };
}

/**
 * Flushes any remaining data in the carry-over buffer after the stream ends.
 * Returns the parsed entry, or null if the buffer is empty or whitespace-only.
 */
export function flushBuffer(buffer: string): object | null {
  if (!buffer.trim()) return null;
  return JSON.parse(buffer);
}
