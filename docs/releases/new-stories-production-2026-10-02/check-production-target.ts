// Read-only live target proof. Public HTML and JS remain in memory; only asset
// hashes and Supabase hostnames are recorded, never anon/service key values.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal } from "../../../scripts/_load-env";

const productionOrigin = "https://onwardapp.me";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
async function readPublic(url: string) {
  const target = new URL(url);
  assert.equal(target.origin, productionOrigin, "Only the established public site is inspected");
  const response = await fetch(target, {signal: AbortSignal.timeout(20_000), redirect: "error"});
  assert.equal(response.status, 200, `Public response failed at ${target.pathname}`);
  return {url: target.href, status: response.status, content: await response.text()};
}
async function main() {
  const startedAt = new Date().toISOString();
  const home = await readPublic(productionOrigin);
  assert([...home.content.matchAll(/\bhref=["']([^"']+)["']/g)]
    .some(match => new URL(match[1], productionOrigin).href === `${productionOrigin}/signin`), "Home page does not link the inspected sign-in route");
  const signin = await readPublic(`${productionOrigin}/signin`);
  const scriptUrls = [...new Set([...signin.content.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)]
    .map(match => new URL(match[1], productionOrigin).href))]
    .filter(url => url.startsWith(`${productionOrigin}/_next/static/`) && url.endsWith(".js"));
  assert(scriptUrls.length > 0, "Public sign-in HTML contains no app script assets");
  const scripts = await Promise.all(scriptUrls.map(async url => {
    const asset = await readPublic(url);
    const supabaseHostnames = [...new Set([...asset.content.matchAll(/https:\/\/([a-z0-9]+\.supabase\.co)\b/g)]
      .map(match => match[1]))];
    return {url: asset.url, status: asset.status, sha256: sha(asset.content), supabaseHostnames};
  }));
  const publicHostnames = [...new Set(scripts.flatMap(script => script.supabaseHostnames))];
  assert.equal(publicHostnames.length, 1, "Public assets do not identify exactly one Supabase project");
  loadEnvLocal();
  const localHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  assert.equal(localHostname, publicHostnames[0], "Local database target differs from the live production browser configuration");
  const proof = {schemaVersion: "production-target-public-bundle-proof-v1", ok: true,
    startedAt, completedAt: new Date().toISOString(), productionOrigin,
    home: {url: home.url, status: home.status, sha256: sha(home.content), linksToSignin: true},
    signin: {url: signin.url, status: signin.status, sha256: sha(signin.content)},
    inspectedScriptCount: scripts.length, scriptAssets: scripts,
    publicSupabaseHostname: publicHostnames[0], localSupabaseHostname: localHostname,
    localTargetMatchesCurrentProductionBundle: true,
    method: "GET current public home and its linked sign-in HTML; GET each same-origin Next.js script referenced by sign-in; extract only https Supabase hostnames; compare with locally loaded URL hostname.",
    limits: "Proves the browser Auth project and local target share one hostname. Does not verify service-role privileges, private Vercel environment values, database schema, publication state or deployed telemetry configuration.",
    privacy: "No login, Auth operation, database mutation or deployment. Full HTML/JS remains in memory. No anon/service key values, environment dump or reader data saved or printed."};
  const directory = resolve("docs/releases/new-stories-production-2026-10-02");
  mkdirSync(directory, {recursive: true});
  const path = resolve(directory, "PRODUCTION-TARGET-PROOF.json");
  const bytes = JSON.stringify(proof, null, 2) + "\n";
  writeFileSync(path, bytes);
  console.log(JSON.stringify({ok: true, publicSupabaseHostname: proof.publicSupabaseHostname,
    localTargetMatchesCurrentProductionBundle: true, matchingScriptUrls: scripts.filter(script => script.supabaseHostnames.length).map(script => script.url),
    proofSha256: sha(bytes)}));
}
main().catch(error => {console.error(error instanceof Error ? error.message : "Production target proof failed"); process.exitCode = 1;});
