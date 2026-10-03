import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

// Editorial-only proposal generation. No provider, database or deployment calls.
const packet = resolve(process.cwd(), "docs/releases/new-stories-production-2026-10-02");
const proposedInput = resolve(packet, "proposed-stages");
const writingInput = resolve(process.cwd(), "docs/research/new-stories-2026-10-02");
const outputDirectory = resolve(packet, "facts-v2-stages");
const definitions = {
  addams: [
    ["Jane Addams was twenty-seven to twenty-nine during April 1888–September 1889.", ["fact-age"]],
    ["Her memoir describes chagrin after a bullfight; she judged that her proposed reform had become an excuse for continued study and travel.", ["fact-arena", "fact-chagrin", "fact-paper"]],
    ["She had gradually formed a plan to rent a city house where young women would connect study with active life among neighbors with unmet needs.", ["fact-plan"]],
    ["She told Ellen Gates Starr despite stumbling and fearing that speaking would make the plan collapse.", ["fact-talk"]],
    ["Starr's enthusiasm helped give it substance, although details remained uncertain.", ["fact-companion"]],
    ["They sought advice, faced criticism and searched unsuccessfully before finding the house again.", ["fact-visit", "fact-critic", "fact-search", "fact-lost-house", "fact-found-house"]],
    ["They intended to begin with their own resources.", ["fact-search"]],
    ["After repairs and furnishing, they moved in with housekeeper Mary Keyser in September 1889.", ["fact-repair", "fact-move"]],
    ["Early work included a reading group, shared meals, washing dishes and housing a young neighbor.", ["fact-reading", "fact-guest"]],
  ],
  blackwell_e: [
    ["Elizabeth Blackwell was twenty-six to twenty-seven during medical school in 1847–1849.", ["fact-age"]],
    ["In November 1847, a professor had asked her to miss some demonstrations.", ["w-exclusion"]],
    ["Her journal records annoyance, sadness and discouragement, and her note asked to be regarded as a serious student.", ["w-exclusion", "w-note"]],
    ["During a dissection she sat gravely while her heart palpitated painfully and afterwards felt nearly worn out.", ["w-dissection"]],
    ["She prayed for help in keeping from smiling.", ["w-prayer"]],
    ["She believed some classmates did not wish to hurt her feelings.", ["w-dissection"]],
    ["On November 24 the professor read her note while she waited outside; she heard the class's approval and returned to her place.", ["w-return"]],
    ["The class subsequently reserved her seat.", ["fact-seat"]],
    ["She studied with other students.", ["fact-study"]],
    ["Later hospital doctors stopped recording diagnoses and treatment beside beds, depriving her of that assistance.", ["fact-hospital"]],
    ["After receiving her diploma in January 1849, she sought more medical experience.", ["fact-degree", "fact-next"]],
  ],
  darwin: [
    ["In August–September 1831, Charles Darwin was twenty-two.", ["fact-age"]],
    ["He wanted to accept a voyage offer to collect and observe natural history.", ["fact-letter", "fact-offer"]],
    ["His father advised strongly against it, citing steady employment, preparation and compatibility with the captain.", ["fact-advice", "fact-concerns"]],
    ["Darwin wrote to decline because ignoring that advice would make him uncomfortable.", ["fact-advice", "fact-refusal"]],
    ["His uncle answered the objections and accompanied him to his father, who gave consent.", ["fact-list", "fact-answers", "fact-drive", "fact-consent"]],
    ["A discouraging letter from the captain then led Darwin and Henslow to abandon the plan again, but Darwin still went to London.", ["fact-discouraged"]],
    ["On September 5 he met the captain and liked his directness.", ["fact-meeting", "fact-privacy"]],
    ["The captain described cramped shared accommodation, plain meals and his need for cabin privacy.", ["fact-cabin", "fact-plain-meals", "fact-privacy"]],
    ["On September 6 Darwin felt cheerful but said the matter remained unsettled.", ["fact-cheerful", "fact-route-uncertain"]],
    ["He worked on equipment lists and family requests, postponing purchases until arrangements were certain.", ["fact-lists", "fact-commissions"]],
  ],
  equiano: [
    ["In 1766, Olaudah Equiano was about twenty to twenty-one, based on his memoir's reported birth year.", ["age"]],
    ["While enslaved, he traded goods while working aboard vessels that also carried enslaved people.", ["voyage", "cargo"]],
    ["Owner-directed port changes disrupted his trading plans.", ["detour"]],
    ["A promised bonus proved disappointing when a dead man's trunks contained little value; he already had nearly enough money to buy his freedom.", ["bonus"]],
    ["After returning and selling goods, he approached the owner with the agreed purchase price.", ["savings", "appointment", "plea"]],
    ["The owner questioned his earnings and regretted making the promise when he saved so quickly.", ["recoil", "regret"]],
    ["A captain confirmed his honest earnings and urged the owner to keep his word.", ["answer", "support"]],
    ["The owner accepted payment and signed a written release in July.", ["consent", "paper", "legal"]],
    ["Equiano remained with the vessel as a paid sailor.", ["employment"]],
    ["On a subsequent voyage he beat a man who had struck him, then faced the other man's owner's threat of public flogging and hid at a friend's house.", ["threat"]],
  ],
  grant: [
    ["From 1858 to early 1861, Ulysses S. Grant was thirty-six to thirty-nine.", ["fact-age"]],
    ["His family had serious illnesses, and his own fever reduced his ability to work and supervise farmworkers.", ["fact-family-illness", "fact-behind", "fact-fever"]],
    ["That farm household used enslaved labor.", ["fact-enslaved-labor"]],
    ["He sold stock, crops and tools, then entered a real estate partnership that could not support two families.", ["fact-auction", "fact-agency"]],
    ["He did not receive the county engineer appointment and remained unemployed in late 1859.", ["fact-engineer", "fact-unemployed"]],
    ["He wanted the prospect of eventually doing business for himself.", ["fact-father-offer", "fact-income-preference"]],
    ["In 1860 he took a salaried clerkship in his father's store, where his younger brothers already worked, and supported his family.", ["fact-move", "fact-salary"]],
    ["In 1861 he helped drill a volunteer company and accompanied it to the state capital.", ["fact-help"]],
    ["Preparing to return home, he was asked by the governor to stay and visit the office next morning.", ["fact-departure", "fact-front-door", "fact-overnight"]],
    ["He accepted work preparing troop paperwork using his army experience, relying on a clerk for assistance with records.", ["fact-office", "fact-forms", "fact-clerk-help"]],
  ],
  jacobs: [
    ["In 1835–1842, Harriet Jacobs, an enslaved mother, spent nearly seven years hidden beneath the roof of her grandmother's house.", ["age", "space", "years", "children", "legal"]],
    ["Her age range of twenty to twenty-nine reflects uncertain birth chronology.", ["age"]],
    ["Relatives brought food through concealed access.", ["aid"]],
    ["She could not stand upright; the unlit, poorly ventilated space left her cramped and in physical pain.", ["space", "darkness", "years"]],
    ["She heard her children below, cried and wanted to see or speak to them.", ["children"]],
    ["Using a boring tool, she made an opening for air and watched her children through it.", ["tool", "holes", "air", "seeing"]],
    ["Rain later drenched her clothes and bedding, and fear of discovery complicated repairs.", ["leak"]],
    ["She gave up the first arranged escape when her family feared danger after a fugitive killing, then left with relatives' and a friend's assistance.", ["lost-chance", "departure"]],
    ["The vessel's captain warned her and another escaping woman to stay below when other ships were visible.", ["cabin", "quiet"]],
    ["Near departure, she feared being returned.", ["distrust"]],
    ["They reached a northern city, but Jacobs had left loved ones behind and remained legally enslaved.", ["arrival", "legal"]],
    ["After landing, racial discrimination barred her from first-class rail cars.", ["rail"]],
    ["Her legal freedom was obtained in 1852.", ["legal"]],
  ],
  keller: [
    ["In March–May 1887, Helen Keller was six and unable to see or hear after an early childhood illness of uncertain diagnosis.", ["fact-age", "fact-loss", "w-walks"]],
    ["Anne Sullivan's letters describe tactile fingerspelling lessons with a doll, cake and other objects.", ["w-doll", "w-cake", "fact-repeat"]],
    ["Keller first imitated finger forms while puzzled.", ["w-doll"]],
    ["When Sullivan withheld the doll, Keller grew angry; the teacher forced her into a chair and held her, then released her and resumed the exercise.", ["w-restraint", "w-cake"]],
    ["Sullivan interpreted the anger as believing the doll was being taken away.", ["w-interpretation"]],
    ["Keller learned more words but confused object names and drinking gestures.", ["fact-repeat", "fact-confusion"]],
    ["Search games initially defeated her, and requests commonly combined single words with gestures.", ["fact-game", "fact-grammar"]],
    ["In April, she unsuccessfully sought a hidden cracker, examined Sullivan's mouth, and pointed to her stomach while spelling eat.", ["w-cracker"]],
    ["Sullivan interpreted this as asking whether she had eaten it.", ["w-question"]],
    ["By May Keller asked about objects on walks and reported to her mother, still making mistakes and needing Sullivan's help.", ["w-walks"]],
  ],
  riis: [
    ["Jacob Riis was approximately twenty-three to twenty-four during his first reporting work in 1873–1874.", ["age"]],
    ["After two unpaid weeks at a local newspaper, he tried selling books and earned nothing from a day's canvassing.", ["first-job", "unpaid", "canvass"]],
    ["Hungry and without money, he sat on steps with his dog and felt three years had been wasted.", ["steps", "despair"]],
    ["His former telegraph-school principal recognized him and gave him an introduction to a news agency.", ["teacher", "letter"]],
    ["Riis found a new home for the dog and delivered the letter.", ["dog-home", "morning"]],
    ["The desk editor allowed a trial assignment covering a public lunch.", ["trial", "meal"]],
    ["Riis watched the food without eating, then wrote a report that earned him acceptance and a regular reporting time.", ["meal", "accepted"]],
    ["Afterward he collapsed on the stairs at a separate boarding house.", ["collapse"]],
    ["The job provided food and pay but involved low wages, long days and multiple evening assignments.", ["workload"]],
    ["The first winter's long rides left his feet painfully cold.", ["workload"]],
  ],
  seacole: [
    ["Mary Seacole was forty-eight to forty-nine during 1854–1855.", ["f-age"]],
    ["Experienced in caring for patients in Jamaica and Panama, she offered her experience and references for army nursing in London.", ["f-experience"]],
    ["Office requests failed; she was told that nursing places were filled, and her final request for funded passage was refused.", ["f-hall", "f-full", "f-final"]],
    ["Her memoir records grief and tears and her suspicion of racial prejudice, without establishing officials' motives.", ["f-tears", "f-doubt"]],
    ["She stood on the street and prayed, then resolved to travel at her own expense.", ["f-final", "f-tears", "f-morrow"]],
    ["With Thomas Day, she planned a store and hotel near the camp and spent limited capital on medicines and home comforts.", ["f-cards", "f-partner", "f-capital"]],
    ["She proceeded despite warnings and difficult goods transfers.", ["f-warning", "f-transfer"]],
    ["At the sick wharf, she assisted a wounded artilleryman with dressings and tea.", ["f-arrival", "f-dressings", "f-tea"]],
    ["A surgeon thanked her and welcomed her help.", ["f-surgeon"]],
    ["For six weeks she sold stores ashore and helped transfer wounded men to hospital ships, sleeping aboard ship at night.", ["f-routine"]],
    ["A later letter reports business misfortune.", ["f-later-cost"]],
  ],
  washington_b: [
    ["Booker T. Washington was about sixteen when he traveled toward Hampton in 1872; his autobiography says his exact birth date was unknown.", ["fact-age"]],
    ["He arrived in Richmond hungry, exhausted and without money or lodging.", ["fact-city", "fact-food"]],
    ["He slept under a raised sidewalk, using his clothing satchel as a pillow.", ["fact-bag", "fact-rest"]],
    ["At dawn he asked a ship's captain for unloading work to earn food.", ["fact-ask"]],
    ["Days of paid work and continued sleeping beneath the sidewalk allowed him to save enough to travel on.", ["fact-breakfast", "fact-saving"]],
    ["At Hampton, the head teacher initially left him waiting.", ["fact-arrival", "fact-wait"]],
    ["She then asked him to sweep a classroom.", ["fact-sweep"]],
    ["He repeatedly swept and dusted, moved furniture and cleaned corners and closets.", ["fact-clean"]],
    ["After inspecting the room and finding no dust, she admitted him.", ["fact-inspect"]],
    ["He worked as a janitor while preparing lessons, borrowed books and received used clothing and encouragement from teachers.", ["fact-janitor", "fact-books"]],
    ["The janitor work paid board; separate financial help was needed for tuition.", ["fact-aid"]],
  ],
};

const files = {
  addams: "addams-1888-1889-telling-the-plan-v1.stage.json",
  blackwell_e: "blackwell_e-1847-1849-a-place-to-study-v1.stage.json",
  darwin: "darwin-1831-the-refusal-and-the-letter-v1.stage.json",
  equiano: "equiano.stage.json",
  grant: "grant-1858-1861-a-place-in-the-shop-v1.stage.json",
  jacobs: "jacobs.stage.json",
  keller: "keller-1887-learning-that-things-have-names-v1.stage.json",
  riis: "riis.stage.json",
  seacole: "seacole.stage.json",
  washington_b: "washington_b-1872-reaching-the-classroom-v1.stage.json",
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const words = (value) => value.trim().split(/\s+/u).length;
const changedFields = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter((field) => !isDeepStrictEqual(before[field], after[field]))
  .sort();
function saveImmutable(path, value) {
  if (existsSync(path)) {
    assert.equal(readFileSync(path, "utf8"), value, `existing proposal differs: ${path}`);
    return;
  }
  writeFileSync(path, value, "utf8");
}

mkdirSync(outputDirectory, { recursive: true });
const targets = [];
for (const [figureKey, file] of Object.entries(files)) {
  const inputBytes = readFileSync(resolve(proposedInput, file));
  const writingBytes = readFileSync(resolve(writingInput, file));
  const candidateFile = file.replace(/\.stage\.json$/, ".candidate.json");
  const candidateBytes = readFileSync(resolve(writingInput, candidateFile));
  const input = JSON.parse(inputBytes.toString("utf8"));
  const original = JSON.parse(writingBytes.toString("utf8"));
  const candidate = JSON.parse(candidateBytes.toString("utf8"));
  assert.equal(input.figureKey, figureKey);
  assert.equal(original.figureKey, figureKey);
  assert.equal(candidate.figureKey, figureKey);
  const priorFields = changedFields(original, input);
  const addedTheme = figureKey === "jacobs" ? "self_invention" : figureKey === "riis" ? "late_start" : null;
  assert.deepEqual(priorFields, addedTheme ? ["themes"] : []);
  if (addedTheme) assert.deepEqual(input.themes, [...original.themes, addedTheme]);
  const factById = new Map(candidate.facts.map((fact) => [fact.factId, fact]));
  const sentenceEvidence = definitions[figureKey].map(([sentence, factIds]) => {
    assert(factIds.length > 0);
    for (const id of factIds) assert(factById.has(id), `unknown ${figureKey} fact ${id}`);
    return { sentence, candidateFactIds: factIds };
  });
  const biographicalFacts = sentenceEvidence.map(({ sentence }) => sentence).join(" ");
  assert(words(biographicalFacts) >= 120 && words(biographicalFacts) <= 180, `${figureKey}: ${words(biographicalFacts)} words`);
  const output = { ...input, biographicalFacts };
  assert.deepEqual(changedFields(input, output), ["biographicalFacts"]);
  const originalFields = changedFields(original, output);
  assert.deepEqual(originalFields, addedTheme ? ["biographicalFacts", "themes"] : ["biographicalFacts"]);
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  saveImmutable(resolve(outputDirectory, file), serialized);
  targets.push({
    figureKey,
    stageId: input.stageId,
    file,
    originalWritingStageSha256: sha(writingBytes),
    proposedV1StageSha256: sha(inputBytes),
    proposedV2StageSha256: sha(serialized),
    originalSha256: sha(inputBytes),
    proposedSha256: sha(serialized),
    changedFields: ["biographicalFacts"],
    unchangedCandidateFile: candidateFile,
    unchangedCandidateSha256: sha(candidateBytes),
    originalFactsWords: words(input.biographicalFacts),
    proposedFactsWords: words(biographicalFacts),
    originalFactsCharacters: input.biographicalFacts.length,
    proposedFactsCharacters: biographicalFacts.length,
    exactFieldDiffsFromProposedV1: [{ path: "biographicalFacts", before: input.biographicalFacts, after: biographicalFacts }],
    exactFieldDiffsFromOriginalWriting: originalFields.map((path) => ({ path, before: original[path], after: output[path] })),
    sentenceEvidence,
    preservedSources: input.sources,
  });
}
const proposal = {
  schemaVersion: "new-ten-facts-proposal-v2",
  status: "editorial-proposal-for-independent-review",
  createdAt: new Date().toISOString(),
  purpose: "Replace long assembled reranker claim lists with concise source-grounded episode summaries. Does not assert the cause of the earlier matching regression or any improved matching result.",
  inputDirectory: "proposed-stages",
  outputDirectory: "facts-v2-stages",
  changedFieldsFromV1: ["biographicalFacts"],
  preserved: ["original fifty library stages", "original proposal files", "historical ages", "canonical story prose", "StorySpec candidates", "source notes", "sources", "shape sentences", "facets", "anti-themes", "already reviewed Jacobs self_invention and Riis late_start theme additions", "keyword routes", "recipe selection", "frozen gold labels", "matching thresholds"],
  actionsPerformed: { databaseMutation: false, providerEvaluation: false, deployment: false },
  totals: {
    stages: targets.length,
    originalFactsWords: targets.reduce((sum, target) => sum + target.originalFactsWords, 0),
    proposedFactsWords: targets.reduce((sum, target) => sum + target.proposedFactsWords, 0),
    originalFactsCharacters: targets.reduce((sum, target) => sum + target.originalFactsCharacters, 0),
    proposedFactsCharacters: targets.reduce((sum, target) => sum + target.proposedFactsCharacters, 0),
  },
  stages: targets,
};
saveImmutable(resolve(packet, "FACTS-PROPOSAL.v2.json"), `${JSON.stringify(proposal, null, 2)}\n`);
const lines = [
  "# Concise reranker fact summaries — proposal v2",
  "",
  "Prepared for independent source and quality review. These files are not installed, evaluated, published or deployed. The failed expanded-library benchmark and the passing original-library run justify inspecting the new metadata; they do not establish that prompt length alone caused the regression.",
  "",
  `The ten summaries contain ${proposal.totals.proposedFactsWords.toLocaleString("en-US")} words and ${proposal.totals.proposedFactsCharacters.toLocaleString("en-US")} characters, down from ${proposal.totals.originalFactsWords.toLocaleString("en-US")} words and ${proposal.totals.originalFactsCharacters.toLocaleString("en-US")} characters. Each summary contains 120–180 words and follows its documented episode chronology. Names, dates and factual distinctions remain ordinary historical metadata. No ranking instruction, evaluation-case wording, fabricated interior state or outcome was inserted.`,
  "",
  "Every output retains its complete library-compatible stage structure. Compared with the immutable `proposed-stages/` input, only `biographicalFacts` changes. Compared with the original writing stages, the only additional changes are the previously reviewed Jacobs `self_invention` and Riis `late_start` themes. All ages, prose, beats, source notes, sources, facets and shapes remain exactly equal to the v1 proposal. The original fifty library stages, candidate files, existing proposal files and database are untouched.",
  "",
  "[The machine-readable proposal](FACTS-PROPOSAL.v2.json) records raw SHA-256 hashes for each original writing stage, v1 proposed stage, v2 proposed stage and unchanged candidate; complete before/after field values; and sentence-to-candidate-fact evidence mappings. Its `stages[]` entries expose `file`, `figureKey`, `originalSha256`, `proposedSha256` and `changedFields`, where original means the immutable v1 proposed stage. Those mappings support independent review rather than replace it. Summary qualifications retain approximate ages, retrospective accounts, teacher interpretation, outside assistance and incomplete outcomes.",
  "",
  "Jacobs remains an enslaved mother who wanted contact with her children during nearly seven years of concealment; reaching the North did not end legal enslavement. Seacole's nursing requests were refused and she financed the trip and store/hotel work herself; the officials' racial motives remain unestablished. Grant's episode remains illness, failed employment, family-supported shop work and an office invitation using prior military experience; his farm household's enslaved labor stays explicit. Keller's classroom restraint and the teacher's interpretation remain disclosed, and its adult intake age limit is unchanged.",
  "",
  "| Figure | Previous words | Proposed words | Proposed full stage |",
  "| --- | ---: | ---: | --- |",
  ...targets.map((target) => `| ${target.figureKey} | ${target.originalFactsWords} | ${target.proposedFactsWords} | [stage](facts-v2-stages/${target.file}) |`),
  "",
  "Independent review should check each summary against the pinned candidate facts and primary-source citations, particularly attribution, agency, chronology, outside help and legal status. Only after that review may an integrator install the new metadata and measure the unchanged benchmarks. No matching gate is claimed by this proposal.",
];
for (const target of targets) {
  lines.push("", `## ${target.figureKey}`, "", target.exactFieldDiffsFromProposedV1[0].after, "", `Writing-stage SHA-256: \`${target.originalWritingStageSha256}\`. V1 stage: \`${target.proposedV1StageSha256}\`. V2 stage: \`${target.proposedV2StageSha256}\`. Candidate: \`${target.unchangedCandidateSha256}\`.`, "", "| Summary sentence | Pinned candidate facts |", "| --- | --- |", ...target.sentenceEvidence.map(({ sentence, candidateFactIds }) => `| ${sentence.replaceAll("|", "\\|")} | ${candidateFactIds.map((id) => `\`${id}\``).join(", ")} |`), "", ...target.preservedSources.map((source) => `- ${source}`));
}
saveImmutable(resolve(packet, "FACTS-PROPOSAL.v2.md"), `${lines.join("\n")}\n`);
console.log(JSON.stringify({ ok: true, status: proposal.status, ...proposal.totals }));
