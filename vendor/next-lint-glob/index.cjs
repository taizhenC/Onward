"use strict";
/* eslint-disable @typescript-eslint/no-require-imports -- The pinned Next caller synchronously loads this CommonJS package. */

const fs = require("node:fs");
const path = require("node:path");
const glob = require("glob");
const { braceExpand } = require("minimatch");
const picomatch = require("picomatch");

/**
 * Only the pinned Next ESLint plugin's root-directory call is supported.
 * Other fast-glob APIs/options must be reviewed before adding another consumer.
 */
function globSync(pattern, options) {
  if (
    typeof pattern !== "string" ||
    pattern.length === 0 ||
    !options ||
    Object.keys(options).length !== 1 ||
    options.onlyDirectories !== true
  ) {
    throw new TypeError("Next lint glob supports a nonempty pattern and onlyDirectories: true only");
  }

  // Next normalizes Windows separators before calling us. Preserve the spelling
  // of literal roots, including ./, trailing /, and absolute project directories.
  const normalizedPattern = pattern.replace(/(?!^)\/{2,}/g, "/");
  const expandedPatterns = braceExpand(normalizedPattern);
  if (expandedPatterns.length !== 1 || expandedPatterns[0] !== normalizedPattern) {
    return [...new Set(expandedPatterns.filter((expandedPattern) => expandedPattern !== "").flatMap((expandedPattern) => globSync(expandedPattern, options)))];
  }
  if (normalizedPattern.startsWith("!") && !normalizedPattern.startsWith("!(")) return [];
  // Match the original micromatch/picomatch directory predicate after traversal.
  // Negative extglobs can select a dot root even with dot:false; ordinary stars
  // still cannot. makeRe also retains the caller's parenthesis-pattern semantics.
  const matcher = picomatch.makeRe(normalizedPattern, { dot: false, posix: true, strictSlashes: false });
  const matchesDirectory = (entry) => {
    const filepath = entry.replace(/^\.\//, "");
    return matcher.test(filepath) || matcher.test(`${filepath}/`);
  };
  if (!glob.hasMagic(normalizedPattern, { magicalBraces: true })) {
    try {
      return fs.statSync(normalizedPattern).isDirectory() && matchesDirectory(normalizedPattern) ? [normalizedPattern] : [];
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return [];
      throw error;
    }
  }

  // Require a child for terminal globstars, as fast-glob omits traversal roots.
  const childPattern = normalizedPattern.replace(/(^|\/)\*\*\/?$/, "$1**/*");
  const segments = normalizedPattern.split("/");
  const firstMagic = segments.findIndex((segment) => glob.hasMagic(segment, { magicalBraces: true }));
  // fast-glob does not select roots by moving to a parent after a wildcard.
  if (segments.slice(firstMagic + 1).includes("..")) return [];
  const base = segments.slice(0, firstMagic).join("/");
  const resolvedBase = path.resolve(base || ".");
  return glob.globSync(childPattern, {
    absolute: true,
    dot: true,
    follow: true,
    nocase: false,
  }).filter((entry) => {
      try {
        // stat follows directory links, so linked roots retain lint coverage.
        return fs.statSync(entry).isDirectory();
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") return false;
        throw error;
      }
    }).map((entry) => {
      const relative = path.relative(resolvedBase, entry).replaceAll("\\", "/");
      return base ? `${base}/${relative}`.replace(/\/$/, "") : relative;
    }).filter(matchesDirectory);
}

module.exports = { globSync };
