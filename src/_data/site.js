// src/_data/site.js
import { readFile } from "node:fs/promises";
import { buildHash } from "../../scripts/build-utils.mjs";

const pins = JSON.parse(await readFile("artifacts.json", "utf8"));

export default {
  title: "Low Gravitas",
  url: "https://lowgravitas.com",
  author: "Mike Abney",
  locale: "en-US",
  buildTime: new Date().toISOString(),
  buildHash,
  versions: {
    theme: pins["theme"],
    symbolFont: pins["symbol-font"],
  },
};
