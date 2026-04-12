// src/_data/codeSamples.js — reads vendor/code-samples.html as a string for template injection
import { readFile } from "node:fs/promises";

export default async function () {
  return await readFile("vendor/code-samples.html", "utf8");
}
