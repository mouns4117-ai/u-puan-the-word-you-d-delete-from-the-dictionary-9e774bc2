// The Word You'd Delete From the Dictionary — entry program.
// Gate: /output/entry.txt must be UTF-8 text of 1 to 77 characters,
// not only white space, naming exactly one word to erase forever.
// The pick: "the" — the most-used word in the language. Erase it and
// every sentence collapses; the joke lands the moment the gap opens.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const ENTRY = "the";
const OUT_DIR = "/output";
const OUT_FILE = "/output/entry.txt";

function validateGate(text: string): void {
  if (typeof text !== "string") throw new Error("entry must be a string");
  // Fail fast on a byte-order mark: an invisible prefix would break the
  // one-word reading and the UTF-8 round-trip check below.
  if (text.charCodeAt(0) === 0xfeff) throw new Error("entry must not start with a BOM");
  const chars = [...text];
  if (chars.length < 1 || chars.length > 77) {
    throw new Error(`entry must be 1-77 characters, got ${chars.length}`);
  }
  if (text.trim().length === 0) throw new Error("entry must not be only whitespace");
  if (text !== text.trim()) throw new Error("entry must not have leading or trailing whitespace");
  if (text.includes("\n") || text.includes("\r") || text.includes("\t")) {
    throw new Error("entry must be a single line with no control characters");
  }
  if (text.includes(" ")) throw new Error("entry must be exactly one word");
  if (!/^[a-z]+$/.test(text)) throw new Error("entry must be a single lowercase word");
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    throw new Error("entry must round-trip as UTF-8");
  }
}

function emptyOutputDir(dir: string): void {
  // /output is a mounted directory: empty its CONTENTS only, never remove it.
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const name of readdirSync(dir)) {
    rmSync(`${dir}/${name}`, { recursive: true, force: true });
  }
}

validateGate(ENTRY);
emptyOutputDir(OUT_DIR);
writeFileSync(OUT_FILE, ENTRY, "utf8");

// Read back and verify: exact bytes, gate, and sha256.
const back = readFileSync(OUT_FILE, "utf8");
validateGate(back);
if (back !== ENTRY) throw new Error("read-back mismatch");
const sha = createHash("sha256").update(back, "utf8").digest("hex");
console.log(`wrote ${OUT_FILE}: ${[...ENTRY].length} chars, sha256 ${sha}`);
