/**
 * Copyright 2026 The Pennsylvania State University
 * @license Apache-2.0, see LICENSE for full text.
 *
 * Build rpg-me against webcomponents master instead of the last npm release.
 *
 * rpg-me uses rpg-character and hax-network-bar as they are on
 * https://github.com/haxtheweb/webcomponents (master), which can be ahead of
 * what is on npm. This copies the source of every @haxtheweb element rpg-me
 * needs, and the @haxtheweb elements those need, from master over the copies
 * npm installed. Third-party packages (lit and so on) stay as npm installed
 * them.
 *
 *   node scripts/webcomponents-master.mjs
 *
 * WEBCOMPONENTS_REF picks another branch; WEBCOMPONENTS_SRC points at a local
 * checkout's elements/ folder instead of cloning; RPG_ME_NPM_ONLY=1 skips this
 * and builds with the npm release.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scope = join(root, "node_modules", "@haxtheweb");

if (process.env.RPG_ME_NPM_ONLY === "1") {
  console.log("webcomponents-master: RPG_ME_NPM_ONLY=1, using the npm release");
  process.exit(0);
}
if (!existsSync(scope)) {
  console.error("webcomponents-master: run npm install first");
  process.exit(1);
}

const depsOf = (pkgFile) =>
  JSON.parse(readFileSync(pkgFile, "utf8")).dependencies || {};
const haxDeps = (pkgFile) =>
  Object.keys(depsOf(pkgFile))
    .filter((d) => d.startsWith("@haxtheweb/"))
    .map((d) => d.substring("@haxtheweb/".length));

let tmp = "";
let elements = process.env.WEBCOMPONENTS_SRC || "";
const ref = process.env.WEBCOMPONENTS_REF || "master";
const git = (...args) =>
  execFileSync("git", args, { stdio: ["ignore", "ignore", "inherit"] });

try {
  if (!elements) {
    tmp = mkdtempSync(join(tmpdir(), "webcomponents-"));
    git(
      "clone",
      "-q",
      "--depth",
      "1",
      "--branch",
      ref,
      "--filter=blob:none",
      "--sparse",
      "https://github.com/haxtheweb/webcomponents",
      tmp,
    );
    elements = join(tmp, "elements");
  }

  // the elements rpg-me depends on, and theirs, as master declares them
  const want = haxDeps(join(root, "package.json"));
  const seen = new Set();
  while (want.length) {
    const name = want.shift();
    if (seen.has(name) || !/^[a-z0-9-]+$/.test(name)) continue;
    seen.add(name);
    if (tmp) git("-C", tmp, "sparse-checkout", "add", `elements/${name}`);
    const pkgFile = join(elements, name, "package.json");
    if (!existsSync(pkgFile)) {
      throw new Error(`@haxtheweb/${name} is not in webcomponents ${ref}`);
    }
    want.push(...haxDeps(pkgFile));
  }

  // third-party packages master needs that npm did not install (an element
  // on master can depend on more than its last release did)
  const missing = new Map();
  for (const name of seen) {
    for (const [dep, range] of Object.entries(
      depsOf(join(elements, name, "package.json")),
    )) {
      if (dep.startsWith("@haxtheweb/") || missing.has(dep)) continue;
      if (!existsSync(join(root, "node_modules", dep, "package.json"))) {
        missing.set(dep, range);
      }
    }
  }
  if (missing.size) {
    const specs = [...missing].map(([d, r]) => `${d}@${r}`);
    console.log(`webcomponents-master: installing ${specs.join(", ")}`);
    execFileSync(
      "npm",
      ["install", "--no-save", "--no-audit", "--no-fund", ...specs],
      { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
    );
  }

  const skip = new Set(["node_modules", "test", "demo", ".git"]);
  for (const name of seen) {
    const to = join(scope, name);
    rmSync(to, { recursive: true, force: true });
    cpSync(join(elements, name), to, {
      recursive: true,
      filter: (src) => !skip.has(src.split(/[\\/]/).pop()),
    });
  }
  console.log(
    `webcomponents-master: ${seen.size} elements from webcomponents ${ref}: ${[...seen].sort().join(", ")}`,
  );
} finally {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
}
