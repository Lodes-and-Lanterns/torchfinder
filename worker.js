import { processChunk, flushBuffer } from './scripts/worker-utils.js';

const BATCH_SIZE = 50;

self.onmessage = async ({ data: { url } }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let buffer = '';
    let batch = [];

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const { buffer: newBuffer, entries } = processChunk(buffer, value);
      buffer = newBuffer;

      for (const entry of entries) {
        batch.push(entry);

        if (batch.length >= BATCH_SIZE) {
          self.postMessage({ type: 'batch', entries: batch });
          batch = [];
        }
      }
    }

    const last = flushBuffer(buffer);
    if (last !== null) batch.push(last);

    if (batch.length) self.postMessage({ type: 'batch', entries: batch });

    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
