// src/_data/site.js
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const pins = JSON.parse(await readFile("artifacts.json", "utf8"));
const gitSha = (process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD").toString()).trim().slice(0, 8);

export default {
  title: "Low Gravitas",
  url: "https://lowgravitas.com",
  author: "Mike Abney",
  locale: "en-US",
  buildTime: new Date().toISOString(),
  buildHash: gitSha,
  versions: {
    zenTheme: pins["zen-theme"],
    symbolFont: pins["symbol-font"],
  },
};
