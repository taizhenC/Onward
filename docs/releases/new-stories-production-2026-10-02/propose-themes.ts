import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { FigureStageRow } from "../../../lib/types";

const folder = resolve("docs/releases/new-stories-production-2026-10-02");
const sourceFolder = resolve("docs/research/new-stories-2026-10-02");
const destination = resolve(folder, "proposed-stages");
mkdirSync(destination, { recursive: true });
const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const changes: Record<string, { add: string; reasoning: string; primary: string; reading: string; qualifications: string[] }> = {
  jacobs: {
    add: "self_invention",
    reasoning: "Thematic inference from actual movement out of years of concealment toward an unfamiliar northern life: arranging departure, leaving the hiding space, managing fear aboard ship, and accepting temporary help after arrival. The label captures beginning a different life under uncertain conditions; it does not claim a new name, immediate legal freedom, erased fear or an invented realization. Existing dispossession, social constraint, quiet defiance and solitude remain.",
    primary: "Harriet A. Jacobs, Incidents in the Life of a Slave Girl, chapters XXIX–XXXI: abandoning the first passage, arranging another, voyage and northern arrival.",
    reading: "docs/releases/new-stories-written-2026-10-02/jacobs.md, struggle through became: she leaves the hidden space, fears return, gains open air, and reaches shelter while legally enslaved and separated from her children.",
    qualifications: ["Editorial theme, not a new historical claim or documented subjective transformation.", "Does not imply that enslavement equals an ordinary life transition.", "The long confinement remains the episode's center; the escape and uncertain beginning provide the bounded additional theme."],
  },
  riis: {
    add: "late_start",
    reasoning: "Thematic inference from the memoir's explicit judgment that three years of effort had been wasted before he obtained an introduction and began another job. The vocabulary already uses late_start for perceived lost time in young adulthood; it is not restricted to chronological old age. This fits regret over stalled beginning and restarting work, without making the ordinary reporting position a recovered childhood calling. Existing self-doubt, dispossession and self-invention remain.",
    primary: "Jacob A. Riis, The Making of an American, chapter V: returning hungry to the same steps three years later, feeling those years wasted, then collecting the letter and entering reporting work; chapter VI's difficult first winter.",
    reading: "docs/releases/new-stories-written-2026-10-02/riis.md, dark_moment: he remembered leaving the same steps three years earlier and felt the years wasted; response through became retains concrete assistance, a work trial and continued bodily costs.",
    qualifications: ["Perceived lateness and lost years, not a claim that twenty-four is old.", "No creative_dismissal is added: accepted but unpaid reporting is not documented rejection of a manuscript or artistic work.", "No claim that effort alone supplied the job; teacher and editor assistance remain essential."],
  },
};
const stageFiles = readdirSync(sourceFolder).filter((file) => file.endsWith(".stage.json"));
if (stageFiles.length !== 10) throw new Error("Expected exactly ten approved writing stages");
const rows = stageFiles.map((file) => {
  const sourceBytes = readFileSync(resolve(sourceFolder, file));
  const original = JSON.parse(sourceBytes.toString("utf8")) as FigureStageRow;
  const proposal = structuredClone(original);
  const change = changes[original.figureKey];
  if (change) {
    if (proposal.themes.includes(change.add)) throw new Error("Proposed theme already present");
    proposal.themes.push(change.add);
  }
  const originalWithoutThemes = { ...original, themes: [] };
  const proposedWithoutThemes = { ...proposal, themes: [] };
  if (!isDeepStrictEqual(originalWithoutThemes, proposedWithoutThemes)) {
    throw new Error("Proposal changed a field outside themes");
  }
  const proposedBytes = change ? `${JSON.stringify(proposal, null, 2)}\n` : sourceBytes;
  writeFileSync(resolve(destination, file), proposedBytes);
  return {
    figureKey: original.figureKey,
    file,
    originalSha256: hash(sourceBytes),
    proposedSha256: hash(proposedBytes),
    changedFields: change ? ["themes"] : [],
    before: original.themes,
    after: proposal.themes,
    justification: change ?? null,
  };
});
writeFileSync(resolve(folder, "THEME-PROPOSAL.json"), `${JSON.stringify({
  createdAt: new Date().toISOString(),
  status: "proposal; not installed or saved to database; independent review outstanding",
  scope: "Ten exact writing-stage copies, with only two proposed theme additions. Original writing inputs, prose, sources, facets, biography, ages, identity, keyword map, implementation version, gold, recipes and evidence remain untouched.",
  unresolved: [
    { case: 13, key: "riis", reason: "Only the writing -> creative_dismissal route matches. The source does not document creative rejection; the unsupported tag is not added." },
    { case: 17, key: "washington_b", reason: "No route matches any word or phrase. A themes-only change cannot give the stage a nonzero keyword score." },
    { key: "keller", reason: "Historical age six cannot enter the normal adult age pool with unchanged tolerance ten. No range or intake change is proposed." },
  ],
  stages: rows,
}, null, 2)}\n`);
console.log(JSON.stringify({ stages: rows.length, changed: rows.filter((row) => row.changedFields.length > 0).map((row) => row.figureKey) }));
