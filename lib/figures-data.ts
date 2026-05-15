import "server-only";
import type { FigureStageRow } from "./types";

// Phase 0 hand-authored figure stages. Each follows CLAUDE.md's target FigureStageRow
// shape so Phase 1 migration is a straight INSERT INTO figure_stages, not a rewrite.
//
// Linear 7-beat arc (Phase 0): scene → dark_moment → response → struggle →
// turning_point → became → bridge. Forks were removed before the friend test;
// Phase 1 reintroduces user agency via prototype + RAG regeneration, not via
// branching decision beats.
//
// Bridge-beat text contains the literal placeholder `{feeling}` which the LLM stub
// substitutes with `session.feeling` at stream time (see lib/llm-stub.ts).

const douglass: FigureStageRow = {
  figureKey: "douglass",
  displayName: "Frederick Douglass",
  birthYear: 1818,
  deathYear: 1895,
  stageId: "1838-1841-nyc-to-nantucket",
  stageLabel: "After the escape: NYC arrival to the Nantucket speech",
  ageMin: 20,
  ageMax: 23,
  themes: ["dispossession", "self_invention", "solitude"],
  antiThemes: [],
  shapeSentences: [
    "He had escaped from slavery and was alone in a city he did not know, with no name he could say aloud, no work he had been hired for, and no certainty that the woman he loved would arrive in time to share what came next.",
    "For three years he disappeared into a town he had never seen, learning a name a stranger had chosen for him and a trade he was not allowed to practice.",
    "When he stood up to speak in a hall full of strangers, the voice that came out had been in him for three years and he had not known it could be heard.",
  ],
  facets: {
    emotionalCore:
      "He felt the shape of being alive without yet being anyone, and he did not know whether that was a beginning or a ruin.",
    decisionShape:
      "Whether to wait for safety before claiming a life, or to take the small risks of an obscure life so that a larger life could become possible later.",
    triggerEvent:
      "He had escaped from a place that owned him and arrived in a place that did not yet know him.",
    agencyState:
      "He was free, but free into nothing — no name, no trade, no community, no certainty that the people he loved would still come.",
  },
  biographicalFacts:
    "Frederick Bailey escaped from slavery in Baltimore on September 3, 1838, by impersonating a free Black sailor with borrowed Seamen's Protection papers. He arrived in New York City the next morning and stayed in the boarding house of David Ruggles, a free Black abolitionist whose Vigilance Committee aided fugitives. Anna Murray, a free Black woman with whom he had been involved in Baltimore, joined him on September 11. They were married in Ruggles' parlor on September 15 by the Rev. James W. C. Pennington. Within the week they took a steamer to Newport, Rhode Island, then a stagecoach to New Bedford, Massachusetts, where Nathan Johnson — a Black businessman who received them — gave Frederick the surname Douglass, drawn from a character in Walter Scott's The Lady of the Lake. Frederick worked as an unskilled laborer on the New Bedford wharves; the white caulkers refused to work alongside him. He subscribed to William Lloyd Garrison's Liberator in 1839. Anna gave birth to Rosetta in June 1839 and Lewis Henry in October 1840. Frederick spoke as a lay preacher at the AME Zion church on Second Street. In August 1841 he attended an antislavery convention on Nantucket Island; William C. Coffin, who had heard him speak at the Black church, urged him to address the convention. He spoke extemporaneously for about fifteen minutes. William Lloyd Garrison rose immediately after and asked the assembly: \"Have we been listening to a thing, a piece of property, or a man?\" The Massachusetts Anti-Slavery Society engaged him as a paid lecturer the same evening. He was twenty-three years old.",
  sources: [
    "Douglass, Frederick. Narrative of the Life of Frederick Douglass, an American Slave (Boston: Anti-Slavery Office, 1845).",
    "Douglass, Frederick. My Bondage and My Freedom (New York: Miller, Orton & Mulligan, 1855), Chapters XX–XXIII.",
    "Douglass, Frederick. Life and Times of Frederick Douglass (Hartford: Park Publishing Co., 1881).",
    "McFeely, William S. Frederick Douglass (New York: W. W. Norton, 1991), Chapters 4–5.",
    "Blassingame, John W., ed. The Frederick Douglass Papers, Series One: Speeches, Debates, and Interviews (New Haven: Yale University Press, 1979–), Vol. 1.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized rewrite. Borrowed identity papers, four days post-escape, hiding indoors, mother died before he could learn his birth date — all documented.",
      text: `There was a young man. He had just escaped from a place where he had not been allowed to choose anything for himself.

He had not picked his name. He had not picked the work he did. He had not picked where he slept. The papers in his shirt pocket said he was someone else — a free man, who had let him borrow that name for a few days so he could travel without being stopped.

Now he was in a city he had never seen, in a room that did not belong to him, four days from the only world he had ever known.

He didn't even know his own age. His mother had died before she could tell him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Slave-catchers operating in northern cities documented. He had written to Anna before leaving; her route was real but the specific image of waiting is dramatized texture.",
      text: `He held very still when boots stopped at the door downstairs.

He had heard that men came looking for people like him in this city. He had heard they sometimes got what they came for.

The boots moved on. He let himself breathe.

He had written to the woman he loved before he left. He didn't know if the letter had reached her. He didn't know if she could even come — she lived in the same place he had just run from, and anyone could stop her on the way.

He thought about her sitting in the chair next to him.

He thought about her trying to get here, alone.

He thought about her never coming.

The light moved across the floor. He didn't move with it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Anna's arrival, marriage in the parlor, move to new town, trained caulker but the white shipwrights refused to work alongside him — all documented. New last name given by the man who housed them on arrival.",
      text: `She came.

She had taken the same long route he had, and somehow no one had stopped her. They got married that week, in the front room of the house where he was staying.

A few days later, they got on a boat and moved to a town neither of them had ever seen. He took a new last name — a man in that town gave it to him, because he needed one that wasn't tied to where he came from.

He had been trained in a trade. But when he looked for work in the new town, the men who already did that trade said they would walk off the job if he was hired. So he took whatever else he could find. Day labor. Sweeping. Splitting wood.

He had a wife and a name and a town he didn't know.

He had nothing else.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Three-year stretch of small jobs, reading abolitionist newspapers, speaking at the small Black church, two children born free. Conservatively framed; the specific church and newspaper names are stripped.",
      text: `Three years went by like that.

He worked the small jobs. He saved what he could. He read every newspaper he could get his hands on. He went to a small church where men like him met, and sometimes he stood up at the back of the room and said a few sentences about what had happened to him in the old place.

The people in the church knew exactly what he was talking about. They had lived it too.

The wider town had no idea. They had never asked.

He had two children in those years. Both born free — the first people he had ever known whose names had not been given to them by someone who owned them.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Summer 1841 abolitionist convention on an island. He spoke extemporaneously; the famous abolitionist who followed asked the room \"thing, piece of property, or man\" — documented, phrasing varies slightly across sources. Paid position offered same evening.",
      text: `One summer he traveled to a big meeting on an island. There were a few hundred people there — most of them white — all talking about ending the system he had escaped from.

A man who had heard him speak at the small church asked him to stand up and tell his own story. He had never spoken to a room of white strangers before. Not from his own mouth. Not about his own life.

He stood up. His voice came out thin. He said the name of the man who had owned him. He said what had been done to him. He said what it had been like to learn to read in secret. His hands sweated against the back of the bench in front of him. He spoke for maybe fifteen minutes. Then he sat down.

A famous man in the room stood up right after him. The famous man turned to the audience and asked them: "Have we been listening to a thing, a piece of property, or a man?"

The room shouted back: "A man! A man!"

Before the night was over, they offered him a paid job — to travel and speak. He took it.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Speaking tour through New England, hostile receptions documented. Wrote his Narrative four years later (1845), then traveled to UK/Ireland for two years while British supporters bought his legal freedom. Lived another fifty years, met multiple presidents.",
      text: `He spent the rest of that year on the road, speaking three or four nights a week. Some halls would not let him in. Some let him in but not the audience. Sometimes the doors got locked from the inside and he spoke outside in a field.

He kept speaking.

A few years later, he wrote a book about his life. The book made him famous. It also made it dangerous for him to stay in the country, because anyone who read it could prove who he had been and come take him back. He left for two years. People he had never met paid for his freedom so he could come home.

He spent the next fifty years speaking, writing, and arguing for people who weren't yet free. He outlived the system he had escaped from.

He started in a chair in a borrowed room, with nothing but the papers in his shirt and a name a stranger had given him.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Frederick Douglass.

He became one of the most important voices in American history. He had escaped from slavery as a young man, and he spent the rest of his life — fifty years — fighting to end it, and then fighting for everyone the country still wouldn't make room for. His books are still read. His words are still quoted. None of that had happened yet on the morning we just sat with him.

You wrote: "{feeling}"

When he sat in that chair, four days free, he didn't have a name yet. He didn't have a plan. He didn't know if the woman he loved would come. He didn't know that the voice he would become known for was already inside him, waiting.

You don't have to know who you are yet. He didn't either.`,
    },
  ],
};

const butler: FigureStageRow = {
  figureKey: "butler",
  displayName: "Octavia E. Butler",
  birthYear: 1947,
  deathYear: 2006,
  stageId: "1974-1975-pre-patternmaster",
  stageLabel: "The years before Patternmaster sold",
  ageMin: 26,
  ageMax: 28,
  themes: ["creative_dismissal", "worthlessness", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "She had been writing every morning before work for fifteen years, had finished two novels that no one had bought, and was running out of reasons to believe the morning hour mattered.",
    "She wrote a sentence in her own notebook claiming a future she did not yet believe in, then went to a job that paid her by the hour.",
    "When the call came that the third novel had sold, she did not sit down — she stood by the stove for a long time and then went back to the notebook.",
  ],
  facets: {
    emotionalCore:
      "She felt the cumulative weight of being good at a thing the world had not yet asked her to do, and she did not know whether that was patience or self-deception.",
    decisionShape:
      "Whether to keep paying for postage and paper out of grocery money, or to admit that the morning hour had not yet earned its keep and might never.",
    triggerEvent:
      "She had finished a third novel after two unsold ones, and was sending it to publishers without an agent while working a wage job that left her four hours of sleep.",
    agencyState:
      "She had control over the morning hour and almost nothing else; the morning hour produced pages no one had paid her for in fifteen years.",
  },
  biographicalFacts:
    "Octavia Estelle Butler was born June 22, 1947 in Pasadena, California, the only child of Octavia Margaret Butler, a maid, and Laurice Butler, a shoeshiner who died when Octavia was seven. She began writing fiction at ten and resolved to take it seriously at twelve after seeing the film Devil Girl from Mars. She attended Pasadena City College and California State University, Los Angeles, and in 1970 — at twenty-three — used her savings from menial work to attend the Clarion Science Fiction Writers Workshop in Pennsylvania, where she met Harlan Ellison and Samuel R. Delany. From 1971 to 1975 she lived with her mother in Pasadena and supported her writing by working a series of low-wage jobs: potato chip inspector at Mary Louise Inc., telemarketer, food deliverer, dishwasher. She wrote daily before her shifts began, often at two or three in the morning. Her first published story, \"Crossover,\" appeared in the Clarion 1971 anthology; \"Childfinder\" was bought by Harlan Ellison in 1972 for The Last Dangerous Visions (an anthology Ellison never assembled). Two novel manuscripts written in this period went unsold. In 1975 she completed a third manuscript, Patternmaster; Sharon Jarvis at Doubleday bought it for an advance of $1,750. Patternmaster was published in 1976, the first of an eventually four-book Patternist series. Butler kept her day jobs until 1979, when the publication of Kindred finally allowed her to write full-time. The journals and commonplace books in which she repeatedly wrote affirmations such as \"I shall be a bestselling writer\" are now held in the Octavia E. Butler Papers at the Huntington Library, San Marino, California.",
  sources: [
    "Butler, Octavia E. Bloodchild and Other Stories (New York: Seven Stories Press, 2005), especially the essay \"Positive Obsession.\"",
    "Canavan, Gerry. Octavia E. Butler (Modern Masters of Science Fiction series; Urbana: University of Illinois Press, 2016).",
    "The Octavia E. Butler Papers, Huntington Library, San Marino, CA — particularly the commonplace books and 1970s correspondence.",
    "McCaffery, Larry, ed. Across the Wounded Galaxies: Interviews with Contemporary American Science Fiction Writers (Urbana: University of Illinois Press, 1990), interview with Butler.",
    "Francis, Consuela, ed. Conversations with Octavia Butler (Jackson: University Press of Mississippi, 2010).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized rewrite. Pre-dawn writing, string of low-wage jobs, lived with mother — all documented per Butler's \"Positive Obsession\" essay and Canavan's biography.",
      text: `There was a young woman. She was twenty-seven.

She lived with her mom, because she couldn't afford anywhere else. Every morning, before the sun came up, she sat at the kitchen table and wrote stories. She had been doing this since she was a kid.

During the day she worked whatever jobs she could find. Packing food on a line. Answering phones. Washing dishes. The jobs were not the point. The morning was the point.

On the table beside her, there was a stack of letters from people she had sent her stories to. She hadn't opened them yet. She had a pretty good idea what they said.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Conveyor-belt anecdote (\"watching the line as if expecting something interesting\") is Butler's own, retold in interviews. Two completed unsold novels by this point documented.",
      text: `She opened the letters one Sunday morning.

They all said more or less the same thing. We liked your writing. We don't think anyone would buy this. Try someone else.

She had finished two whole books by then. Neither had sold. She was halfway through a third.

That week at her job, her boss had made fun of her in front of the other women on the line. She'd said the young woman worked too slow because she stared at the conveyor belt like she was waiting for something interesting to happen on it. The other women had laughed.

She walked home from work that night and sat at the kitchen table and looked at her typewriter.

She had been getting up before the sun for fifteen years. She had nothing to show for it.

She didn't know if any of it had mattered.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Affirmation practice (writing aspirational future-self sentences) is documented across Butler's commonplace books at the Huntington Library.",
      text: `She kept writing.

The next morning she walked to the corner store, bought another pack of paper, walked home, and sat back down at the table.

A few weeks later, she opened a notebook and wrote a sentence in big capital letters about the kind of life she wanted to have one day. The sentence was hopeful in a way she did not yet believe.

She didn't need to believe it. She just needed to be the kind of person who would write it down.

She kept the job. She kept the morning. She kept opening the letters when she had room in her head for them.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      text: `She finished the third book.

She made copies. She paid for the postage out of her grocery money. She mailed it out and started another one.

Then she waited.

Two months passed. Nothing.

Three months passed. The factory job ended; she found another one. She kept writing before sunrise.

Four months passed. Still nothing.

The new thing she was writing wasn't very good yet. She kept writing it anyway. The morning didn't owe her anything. It just had to be hers.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Phone call from editor at Doubleday acquiring Patternmaster, 1975, verified. Specific details of the call dramatized; her response (stood by stove, didn't sit down) is texture, not cited.",
      text: `The phone rang one afternoon.

It was someone calling about her book. They said they wanted to publish it. They said how much they could pay her.

She didn't cry. She didn't sit down. She finished the call politely, hung up, walked into the kitchen, and stood by the stove for a long time.

It was the first money anyone had ever paid her for something she'd written.

That night she went back to the kitchen table and wrote down what had happened, in plain words, like the page needed to know it before she did.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Four novels by end of decade (Patternmaster, Mind of My Mind, Survivor, Kindred). Stopped wage work after Kindred, per Butler's own account. Wider fame and the MacArthur came years later.",
      text: `The book came out the next year.

It didn't make her rich. It didn't make her famous. It just made her, for the first time in her life, a person whose name was on a book.

She wrote another one. And another one. And one after that.

A few years later, she stopped taking shifts. She wrote full-time. The morning hour didn't change. The kitchen table didn't change. She just no longer needed the second job to keep the first one going.

The thing she had wanted since she was a kid had taken her until almost thirty to begin. It would take her another fifteen years to be widely read. She didn't know that yet, and it wouldn't have changed what she did the next morning anyway.

She kept writing.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Octavia Butler.

She became one of the most important science fiction writers of the last hundred years — the first Black woman widely read in the genre, and the first sci-fi writer to win a MacArthur Fellowship. People read her books in classrooms now. None of that had happened yet on the morning we just sat with her.

You wrote: "{feeling}"

The morning at the table was hers before any of the books. Before any of the awards. Before anyone knew her name. It was just her, getting up before everyone else, sitting down at the table, and writing the next page.

You don't have to know how it ends to keep going. She didn't either.`,
    },
  ],
};

const lee: FigureStageRow = {
  figureKey: "lee",
  displayName: "Frances Glessner Lee",
  birthYear: 1878,
  deathYear: 1962,
  stageId: "1929-1931-harvard-pivot",
  stageLabel: "After her brother's death: the inheritance and the Harvard pivot",
  ageMin: 50,
  ageMax: 54,
  themes: ["late_start", "social_constraint", "quiet_defiance"],
  antiThemes: [],
  shapeSentences: [
    "She had wanted, since she was a girl, to study how dead people died, and her family and her marriage and the years had each in turn told her she could not — until the year she turned fifty-one, when her brother died and the money that had paid for everyone else's choices became hers.",
    "She wrote to a Harvard medical examiner she had corresponded with for thirty years and offered to fund the academic field he had spent his life building from the edges of.",
    "She did not give the new department her own name. She had insisted that the work be the thing that was named.",
  ],
  facets: {
    emotionalCore:
      "She felt the late weight of decades spent inside someone else's idea of her life, and the strange pressure of finally having the means to escape it without yet knowing how.",
    decisionShape:
      "Whether to spend the inheritance on the conventional philanthropy expected of her, or on the field she had wanted to enter since she was a girl and had been told she could not.",
    triggerEvent:
      "Her brother died and left her enough money that the constraints which had governed her for fifty-one years no longer had any practical hold on her time or her movements.",
    agencyState:
      "She had means and time for the first time in her life, and decades of conditioning that told her she had no right to use them on what she actually wanted.",
  },
  biographicalFacts:
    "Frances Glessner Lee was born March 25, 1878 in Chicago, the daughter of John Jacob Glessner — co-founder of International Harvester — and Frances Macbeth Glessner. She and her younger brother George Glessner Jr. were tutored at home in the Prairie Avenue mansion her father commissioned from H. H. Richardson. As a girl she developed an interest in legal medicine through her brother's friendship at Harvard with George Burgess Magrath, who would become Suffolk County Medical Examiner in Boston. She was not permitted to attend college. In 1898, at twenty, she married the Chicago corporate lawyer Blewett Lee; they had three children and divorced in 1914. Her brother George died on May 1, 1929, leaving her a substantial inheritance; her father John Jacob died in 1936, leaving her more. Beginning in 1929–1931 she negotiated with Harvard Medical School to establish a Department of Legal Medicine — the first in the United States — with George Magrath as its first chair. She also funded the George Burgess Magrath Library of Legal Medicine. From 1940 through the 1940s she designed and built the Nutshell Studies of Unexplained Death — nineteen miniature dollhouse-scale crime scenes used to train homicide detectives in observation, constructed in her workshop at her summer estate The Rocks in Bethlehem, New Hampshire. The Nutshells are still used in homicide-investigator seminars today and are held by the Maryland Office of the Chief Medical Examiner. In 1943 the New Hampshire State Police appointed her an honorary captain — the first woman in the United States to hold a state police rank. She died in January 1962, age eighty-three.",
  sources: [
    "Goldfarb, Bruce. 18 Tiny Deaths: The Untold Story of Frances Glessner Lee and the Invention of Modern Forensics (Naperville: Sourcebooks, 2020).",
    "Botz, Corinne May. The Nutshell Studies of Unexplained Death (New York: Monacelli Press, 2004).",
    "The Frances Glessner Lee Papers, Harvard Medical School / Center for the History of Medicine, Boston.",
    "The Glessner House Museum archives, Chicago — for the Prairie Avenue / family context.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized rewrite. Brother died spring 1929 leaving a substantial inheritance, not allowed to attend college as a girl, married off at 20, divorced in her thirties, three grown children — all documented.",
      text: `There was a woman in her early fifties.

She was sitting at her brother's desk. Her brother had died a few weeks earlier, and the desk now belonged to her. So did most of the money he had inherited from their father.

When they were kids, her brother had been allowed to do all the things she hadn't. He had gone to a school she'd wanted to attend. He had inherited the family business. He had picked his own life.

She had been told to be a wife. So she had been a wife. She had been married for sixteen years to a man she had not chosen. She had divorced him fifteen years ago. She had three grown children. She had a town house and a summer estate and a lot of furniture she hadn't picked out.

Since she was a girl, she had wanted to study one specific thing.

She had never been allowed to.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Decades-long correspondence with her brother's medical-school friend (the field she had wanted to enter) documented. Her exclusion from college, her early marriage, and her later divorce all documented. The specific drawer-letter moment is dramatized texture.",
      text: `There was a letter on her desk she could not bring herself to open.

It was from a friend of her brother's. A man who, his whole career, had been quietly trying to build the field she had wanted to study her whole life. They had been writing to each other for thirty years.

He had written to say he was sorry about her brother. He had also written, very gently, that he hoped — when the dust settled — she might still find the energy to take an interest in the work they had talked about all those years ago.

She put the letter in a drawer.

She sat at the desk and did not move.

When she was seventeen, her father had told her she would not be going to the school her brother went to. She had not argued.

When she was twenty, she had been told to get married. She had not argued then either.

She had only argued once. When she was in her thirties, when she had asked to leave the marriage.

She had spent fifty-one years being told what she could and couldn't have. There was no one left to tell her either way.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She wrote back to him shortly after her brother's death, traveled to visit him at his office that fall, committed to funding the field. The technical questions she asked (chains of custody, etc.) are documented as her actual interests.",
      text: `She wrote back to him that night.

The letter was short. It said she would like to come visit him as soon as he had a free week. It said she had been thinking, for a long time, about the work they had talked about. It said she would pay for whatever it took to make it real.

She visited a few months later. She watched him do his work for an afternoon. She asked careful, technical questions. He answered all of them.

Before she left, she had committed to funding the first academic program of its kind in the country. The program he had been quietly trying to build, on his own, for years.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Initial reluctance from the medical school, two-year negotiation, four trips to negotiate, increasing offer, named the friend as first chair holder — all documented.",
      text: `The school they were going to give it to said no the first time.

They wrote back politely. They didn't see the need for such a program. The money she was offering was generous, of course, and they could find other uses for it. Perhaps in another department.

She wrote them back. She offered more money. She suggested specific terms. She named her brother's friend as the first person who should run it.

The negotiations took two years.

She traveled to the school four times. She sat in meetings with men who were polite and who did not quite look at her when they discussed her money. She did not raise her voice. She did not write angry letters. She kept writing patient, detailed ones, each with more money than the last.

In the end, she got everything she had asked for.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Program formally established 1931. She insisted his name (not hers) be on the chair and the library. The wooden-crates scene captures her hands-on involvement; specific actions are dramatized but her presence during the founding period is grounded.",
      text: `The first books for the new program arrived in wooden crates.

She stood in the room before anyone had arranged them. The shelves still had paper labels tied on with string. The walls were bare.

The thing she had wanted, since she was a girl, was now a real room in a real school. Not a wish in a letter. Not a subject she read about alone at home. A room.

She had been seventeen when her father told her, in a different room, that she would not be allowed to study what was in this one.

She took off her gloves and opened the first crate.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Program ran three decades. ~1940 she began building miniature crime scenes by hand; nineteen total, still used to train homicide detectives. 1943 appointed honorary captain of NH State Police — first woman in US to hold a state police rank, at age 65.",
      text: `The program ran for the next three decades. It trained the first generation of people in the country doing the work she had wanted to do as a girl. Some of the same men who had not looked at her in meetings ended up sending their students to it.

Years later, in her sixties, she started building something with her own hands. Tiny rooms — doll-sized model crime scenes she made from scratch, with working light fixtures, miniature evidence, calibrated clues. She built nineteen of them. She used them to teach detectives how to see.

Detectives are still trained on them today.

When she was sixty-five, her state's police force appointed her an honorary captain — the first woman in the country to hold a rank in any state police.

None of the buildings, none of the libraries had her name on them. She had insisted on this. The work was the thing.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Frances Glessner Lee.

She is one of the founders of modern forensic science. She built the first formal program in the country, paid for it herself, and trained the people who trained everyone after them. The miniatures she built by hand are still used to teach homicide investigators. She did all of this in her fifties and sixties, after spending the first half of her life being told she couldn't.

You wrote: "{feeling}"

She had been waiting since she was seventeen. The desk did not know what she had given up. The room at the school, when the books finally arrived, did not ask her to be younger than she was. It only needed her to start.

You don't have to be early. You just have to begin.`,
    },
  ],
};

export const FIGURE_STAGES: FigureStageRow[] = [douglass, butler, lee];
