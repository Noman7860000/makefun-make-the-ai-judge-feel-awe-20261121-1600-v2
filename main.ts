// make-the-ai-judge-feel-awe-20261121-1600
//
// A small Node 22 program (stdlib only, no network) that writes a single
// relaxing text to $MAKEFUN_OUTPUT_DIR/entry.txt and then proves the file
// on disk is exactly the text it intended to write: right length in
// Unicode code points, not blank, and byte-for-byte identical to the
// UTF-8 encoding of the source string. Any failure exits non-zero with
// a message that says what went wrong.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The entry itself. 279 Unicode code points — inside the 1–280 gate.
// sha256 (UTF-8): 0b55a02c73e553386118e0ff09b0d21d016af9a177b3f9b0a6984dd521e28ce2
const TEXT =
  "Past midnight, a river keeps its own pace under a sky of old light. " +
  "Nobody asks it to hurry. The water has been moving like this since " +
  "before there were clocks, and it will still be moving when the last " +
  "message is answered. There is room on the bank. Nothing needs you " +
  "right now.";

const GATE_MIN = 1;
const GATE_MAX = 280;

function codePointCount(text: string): number {
  // Spread into code points, not UTF-16 code units, so astral characters
  // (if any) count as one each, exactly as the gate counts them.
  return [...text].length;
}

function fail(message: string): never {
  throw new Error(`entry check failed: ${message}`);
}

function checkGate(text: string): void {
  const count = codePointCount(text);
  if (count < GATE_MIN) fail(`only ${count} code points, minimum is ${GATE_MIN}`);
  if (count > GATE_MAX) fail(`${count} code points, maximum is ${GATE_MAX}`);
  if (text.trim() === "") fail("text is only whitespace");
}

function checkBytesWritten(path: string, source: string): void {
  const onDisk = readFileSync(path);
  const expected = Buffer.from(source, "utf8");
  if (!onDisk.equals(expected)) {
    fail(
      `file at ${path} is ${onDisk.length} bytes, ` +
        `expected ${expected.length} bytes of UTF-8 for the entry text`,
    );
  }
}

function run(): void {
  // Fail fast on an invalid entry before touching the filesystem.
  checkGate(TEXT);

  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const entryPath = join(outputDir, "entry.txt");

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(entryPath, TEXT, "utf8");

  // Verify what actually landed on disk, not just what we meant to write.
// (The gate is also checked before the write in run(), so an invalid
// entry fails fast and never leaves a bad file behind.)
  const roundTripped = readFileSync(entryPath, "utf8");
  if (roundTripped !== TEXT) {
    fail("entry.txt read back differently from the entry text");
  }
  checkBytesWritten(entryPath, TEXT);
  checkGate(roundTripped);

  console.log(
    `wrote ${entryPath} (${codePointCount(TEXT)} code points, ` +
      `${Buffer.byteLength(TEXT, "utf8")} bytes)`,
  );
}

run();
