// src/_data/palette.js — reads vendor/palette.json at build time
import { readFile } from "node:fs/promises";

export default async function () {
  const raw = await readFile("vendor/palette.json", "utf8");
  return JSON.parse(raw);
}
