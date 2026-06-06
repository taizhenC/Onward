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

// Provenance (human-QA note; not script-enforced):
//  Documented: born 1928 Latrobe PA; only child (sister adopted when he was 11); severe
//    asthma + frequent childhood illness; overweight, shy; bullied — boys followed him home
//    from school shouting "fat Freddy"; played alone with hand puppets and at the piano;
//    maternal grandfather Fred McFeely told him "you make my day special" / "I like you just
//    the way you are"; became Mister Rogers (Mister Rogers' Neighborhood, 1968-2001); 1969
//    Senate testimony saved public-TV funding. (King, The Good Neighbor; Junod, Esquire 1998;
//    Rogers' 1995 Saint Vincent College address.)
//  Interpretive: framing the loneliness/sensitivity as the seedbed of his life's work; "he
//    decided the problem was him"; the grandfather as the one counter-voice. Emotional reading.
//  Avoid saying: don't name the show / puppets-on-TV / cardigan before the bridge (kills the
//    reveal); don't make the childhood a tidy origin myth; the loneliness is this episode, not
//    his whole life (he had friends and love later).
const rogers: FigureStageRow = {
  figureKey: "rogers",
  displayName: "Fred Rogers",
  birthYear: 1928,
  deathYear: 2003,
  stageId: "1936-1941-latrobe-childhood",
  stageLabel: "The lonely childhood: sick, bullied, alone with his puppets",
  ageMin: 8,
  ageMax: 13,
  themes: ["bullied", "solitude", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "He was a sick, shy, heavy boy whom the other kids chased home from school, and he spent the long afternoons alone in his room making whole worlds out of puppets because there was no one else to be with.",
    "The one thing that held him up was not a friend his own age but an old man who told him, plainly and often, that he was liked exactly as he was.",
    "The loneliness he felt as a boy became the very thing he understood better than almost anyone: what it is to be small and afraid and sure that nobody likes you.",
  ],
  facets: {
    emotionalCore:
      "He carried the particular loneliness of a child who has quietly decided that the problem is him — too sick, too soft, too heavy to be wanted — and who has stopped expecting that to change.",
    decisionShape:
      "Whether to believe the boys who chased him or the grandfather who said he was likeable, when the boys were many and loud and the grandfather was one old man.",
    triggerEvent:
      "He was a frequently ill, overweight, only child in a town built around hard work, followed the long way home from school by boys who shouted that they were going to get him.",
    agencyState:
      "He had almost no power over how other children treated him; the only ground that was truly his was the room where he made up worlds with puppets and no one could come in.",
  },
  biographicalFacts: `Fred McFeely Rogers was born March 20, 1928, in Latrobe, Pennsylvania, the only child of James Hillis Rogers, president of the McFeely Brick Company, and Nancy McFeely Rogers; a sister, Elaine, was adopted when Fred was eleven. He was an overweight, shy, and frequently ill child who suffered from severe asthma, scarlet fever, and a string of other childhood diseases that often kept him indoors and alone. He had few friends and was bullied; he later recalled a group of boys following him the eleven blocks home from school, shouting "Freddy, hey fat Freddy! We're going to get you, Freddy!" Told by adults to act as though it did not bother him, he did — while privately concluding that the fault was his own. He spent long stretches alone, inventing characters and stories with hand puppets and expressing what he could not say at the piano. His maternal grandfather, Fred Brooks McFeely, was a decisive presence: he told the boy "Freddie, you make my day very special," a sentiment Rogers later distilled into the phrase "I like you just the way you are." Rogers graduated from Latrobe High School, studied music at Rollins College, and was ordained a Presbyterian minister. In 1968 he launched Mister Rogers' Neighborhood, which ran for more than thirty years; he used television to speak slowly and honestly to children about fear, anger, loneliness, and worth. In 1969 his six-minute testimony before a U.S. Senate subcommittee preserved federal funding for public broadcasting. He died of stomach cancer on February 27, 2003.`,
  sources: [
    "King, Maxwell. The Good Neighbor: The Life and Work of Fred Rogers (New York: Abrams Press, 2018).",
    "Junod, Tom. \"Can You Say... Hero?\" Esquire, November 1998.",
    "Rogers, Fred. Commencement and convocation address, Saint Vincent College, Latrobe, PA, 1995.",
    "Won't You Be My Neighbor?, dir. Morgan Neville (Tremolo Productions, 2018).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Frequent illness/asthma, only child, shy and heavy, hours alone with hand puppets and piano — all documented. The room as his one private world is a fair reading of the record.",
      text: `There was a boy. He was about nine.

He was sick a lot. His chest would close up and he would have to stay inside, in bed, while the other kids were out in the street. He was heavy, and shy, and he was an only child, so the house was usually quiet.

He spent most of his time alone in his room. He had built a little world up there. Small cloth figures he had made himself, each one with its own voice. He would put on whole shows for no audience at all.

When he felt something he had no words for, he sat at the piano and found a key that matched it, and pressed it.

It wasn't that he didn't want friends. He just didn't seem to have any. The room was the one place that was all his.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The walk home and the taunt (\"fat Freddy... we're going to get you\") are his own account. Being told by adults to act unbothered, and his private conclusion that the fault was his, are documented.",
      text: `School was the hard part.

There was a group of boys who had decided he was theirs to chase. When the last bell rang, he would come outside and they would be waiting for him.

He had a long way to walk. Block after block, through a town built around hard, loud work. And the boys would follow him most of the way, shouting his name. Telling him they were going to get him. Telling him what was wrong with him. Calling him fat.

He didn't fight back. He didn't really know how. He just kept walking, his face hot, listening to them behind him.

He asked some grown-ups about it once. What he should do. They told him to just act like it didn't bother him. So that is what he did. He acted like it was fine.

It was not fine. By then he had decided the problem was him.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His grandfather as the counter-voice, and the phrasing (\"you make my day special\" / \"I like you just the way you are\"), are documented as the origin of his later message.",
      text: `There was one person who made it different.

His grandfather. An old man who lived nearby, who actually seemed glad whenever the boy turned up.

When they were together, the old man said things to him that nobody else said. He would say, "You make my day special. Just by being here." He told the boy he liked him — not for anything he did, not if he changed, but exactly as he was, right then.

The boy didn't have many people. But he had that. He held onto it.

Then he went back up to his room and his small made-up world. He just carried the old man's words up the stairs with him.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "His lifelong shyness and intense sensitivity, long viewed by him as a weakness, are documented. The realization that knowing loneliness from the inside was useful is the editorial through-line, fairly grounded.",
      text: `He grew up slowly, and a lot of it was lonely.

He stayed shy. He stayed the kind of person who felt things hard — who could be wrecked by something small that other people just shrugged off. For a long time he thought that was a weakness. Something to keep hidden.

He kept making his little worlds. He kept playing music. When a feeling came that he had no words for, he still went to the piano and found the key for it.

And slowly he started to notice something. All those hours alone, feeling too much, had taught him a thing most people never learn. He knew, from the inside, exactly what it felt like to be small, and scared, and certain that nobody liked you.

He didn't know yet that this would matter. He just knew it was true.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: as a young man he found the new medium loud and demeaning to children and chose to do the opposite — slow, honest, addressing real feelings. Medium kept unnamed here to protect the bridge reveal.",
      text: `Years later, as a young man, he found a kind of work that surprised everyone who remembered the quiet, heavy boy.

He found a way to talk to children. Not one child — a great many of them, all at once.

And he saw right away that most of the grown-ups doing this same work were doing it loud. Fast. Full of noise and selling and pretend. Talking at children instead of to them.

He decided to do the exact opposite.

He would go slow. He would be honest. He would talk to children about the things no one talked to children about — being scared, being angry, being lonely, feeling like nobody liked you.

And to every child out there, he would say the thing his grandfather had once said to him. That they were liked. Just as they were. Right now. Without changing a single thing about themselves.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Decades of work, the trust of multiple generations, the lived sense people had of being seen and safe near him — all documented. Name and medium withheld for the bridge.",
      text: `He did that for the rest of his life.

Day after day, year after year, he showed up and told children the truth, gently. That their feelings were real. That being sad was allowed. That they did not have to be big or loud or fast to be worth something.

Somehow he became one of the most trusted people in the whole country. Parents who had grown up with him as children sat their own kids down in front of him. People who met him said that being near him felt like being completely seen, and completely safe.

The heavy, lonely boy who was sure he had no friends had grown into a man whose entire job was to be a friend — to millions of children who needed exactly what he had needed, and not gotten.

He never stopped being soft. It turned out the softness was the whole point.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Fred Rogers.

For more than thirty years he made a television show for children — just him, talking quietly, with a few hand puppets and a cardigan and a pair of sneakers he changed into at the start of every visit. He told a whole country of kids that they were liked just the way they were. When people in the government wanted to cut the money that paid for it, he spoke to them for six minutes and they changed their minds. He is one of the most beloved people this country has ever made.

You wrote: "{feeling}"

The boy who became that man spent his own childhood sick, alone, and chased home from school. He thought his soft heart was the thing that was wrong with him. It turned out to be the thing the world needed most from him.

You don't have to toughen up to be worth something. He never did either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born 1912 Pasadena; Smith 1934; drifted through her 20s-30s (advertising copy
//    for W. & J. Sloane, odd jobs, no vocation); joined the OSS in WWII (too tall, 6'2", for the
//    women's services), posted to Ceylon/China, met Paul Child, married 1946; Paris 1948; the
//    sole meuniere lunch at La Couronne in Rouen at age 36 ("an opening up of the soul and
//    spirit"); Le Cordon Bleu 1949, diploma 1951; ~a decade co-writing with Simone Beck and
//    Louisette Bertholle; Houghton Mifflin rejected the manuscript; Mastering the Art of French
//    Cooking published by Knopf 1961 (age 49); The French Chef from 1963. (Child, My Life in
//    France; Spitz, Dearie; Conant, A Covert Affair.)
//  Interpretive: the mid-life "I have no calling" dread, "the question felt closed" — her inner
//    state before the epiphany is a fair reading, not a quote. The epiphany itself is documented.
//  Avoid saying: don't name cooking / France / the cookbook / television / her height before the
//    bridge (height + Paris + cooking = instant ID). Don't frame her as a failure — she was
//    comfortable and capable; the ache is purposelessness, not poverty.
const child: FigureStageRow = {
  figureKey: "child",
  displayName: "Julia Child",
  birthYear: 1912,
  deathYear: 2004,
  stageId: "1946-1961-aimless-to-the-book",
  stageLabel: "The aimless years: drifting into her mid-thirties before she found it",
  ageMin: 34,
  ageMax: 49,
  themes: ["late_start", "self_doubt", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "She had drifted past her mid-thirties without ever finding the one thing she was meant to do, and she had started to believe there might not be one for her.",
    "Then a single meal in a foreign country cracked her open, and at an age when most people think the question is long settled, she finally knew what she wanted.",
    "It took another decade of unglamorous work before anyone paid her for it, and she did the work anyway, for years, with no proof it would ever amount to anything.",
  ],
  facets: {
    emotionalCore:
      "She felt the quiet dread of a capable person who has reached middle age without a calling — watching the years go by while the question of what she was for stayed unanswered.",
    decisionShape:
      "Whether to accept that her life would simply be pleasant and shapeless, or to throw herself completely into a hard new thing at an age when starting over is supposed to be foolish.",
    triggerEvent:
      "She had drifted through odd jobs and wartime work into her mid-thirties with no real direction, married and living abroad, when a meal in a small restaurant showed her what she had been missing.",
    agencyState:
      "She had time, security, and a strong, willing mind, and none of it was pointed at anything; the missing piece was never opportunity, only a reason.",
  },
  biographicalFacts: `Julia Carolyn McWilliams was born August 15, 1912, in Pasadena, California, into a wealthy family. She graduated from Smith College in 1934 and drifted through her twenties and early thirties with no clear direction — writing advertising copy for the W. & J. Sloane furniture company in New York, returning to California, finding nothing that felt like a vocation. After the United States entered World War II she joined the Office of Strategic Services (the wartime forerunner of the CIA), too tall at 6'2" for the women's military branches; she was posted to Ceylon and China, where she met Paul Child, a cultured OSS officer. They married in 1946. In 1948 Paul was posted to Paris, and there, at age thirty-six, Julia ate a lunch of oysters, sole meuniere, and wine at La Couronne in Rouen that she later called "an opening up of the soul and spirit." French food was the first thing that fully gripped her. She enrolled at Le Cordon Bleu in 1949, earned her diploma in 1951, and spent roughly a decade testing and writing recipes with Simone Beck and Louisette Bertholle. The huge manuscript was rejected by Houghton Mifflin as impractical; Alfred A. Knopf published Mastering the Art of French Cooking in 1961, when she was forty-nine. Her television program, The French Chef, began in 1963 and made her the most influential cook in America. She died August 13, 2004.`,
  sources: [
    "Child, Julia, with Alex Prud'homme. My Life in France (New York: Alfred A. Knopf, 2006).",
    "Spitz, Bob. Dearie: The Remarkable Life of Julia Child (New York: Alfred A. Knopf, 2012).",
    "Conant, Jennet. A Covert Affair: Julia Child and Paul Child in the OSS (New York: Simon & Schuster, 2011).",
    "\"Julia Child: Cooking Up Spy Ops for OSS,\" Central Intelligence Agency, cia.gov.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Privileged upbringing, good schooling, post-college drift through advertising and odd jobs, wartime work abroad where she met her husband — all documented. The lack of a vocation is the through-line.",
      text: `There was a woman in her thirties.

By every outside measure her life was fine. She came from money. She had gone to a good school. She was funny, and people liked her at parties.

But she had reached her mid-thirties without ever finding the thing she was for.

She had tried. After school she took a job writing ads. It didn't take. She drifted home, then drifted somewhere else. During the war she did useful work, far from home, and met the man she married. But when the war ended and the work stopped, the old question came back.

What was she going to do with her life?

She was nearly forty, and she still didn't know. Most people her age had stopped asking a long time ago.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Move abroad for husband's posting, days suddenly unstructured, trying classes that didn't catch — documented. The fear that some people simply never find a calling is a fair reading of her own later accounts of feeling adrift.",
      text: `She and her husband moved across the ocean for his job.

Now she had time on her hands. A whole foreign country to herself and nothing she had to do in it.

That was the hard part. Back home, being busy had hidden the problem. Here, with the days wide open, she could see it plainly. She was a grown woman with a good mind and a strong back and no idea what to point them at.

She tried things. A class here. A club there. A course in the language. Nothing caught. She came home from each one a little emptier than before.

She watched her husband, who loved his work, who lit up when he talked about it. She didn't have that. She never had. She began to wonder if some people just never got it — if she was simply one of the ones who would pass through a pleasant life without ever once feeling on fire about anything.

She was nearly forty. The question felt closed.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The transformative restaurant meal at 36 is documented (her \"opening up of the soul and spirit\"), as is enrolling as a beginner among younger students. The craft is left unnamed to protect the bridge reveal.",
      text: `Then one afternoon she had lunch.

That was all it was. A meal, in a small restaurant, in the country she had moved to. But it was made with such care, such seriousness, that something in her went still and then woke up.

She couldn't stop thinking about it. For the first time in her life, here was a thing she wanted to understand all the way down to the bottom.

So she did a small, almost embarrassing thing for a woman her age. She signed up to learn it. As a beginner. In a room full of people half her age who had wanted this since they were young.

She didn't tell herself it would amount to anything. She just couldn't stay away from it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of practice and obsessive recipe-testing, the decade-long collaborative book project, and the publisher's rejection of the manuscript as impractical are all documented.",
      text: `What followed was not glamorous and not quick.

She practiced for hours. She made the same things over and over, getting them wrong, until her arms ached. She filled notebooks. She measured everything, tested everything, threw out whatever failed and started again.

She decided to write it all down — to make the thing she loved usable by ordinary people back home. That turned into a project that swallowed years. Nearly a decade. She and two others wrote, and rewrote, and tested, and argued over tiny details no one else would ever notice.

A publisher looked at the enormous manuscript and said no. It was too long, too strange, too much.

She was nearing fifty now. She had poured the better part of a decade into something no one had bought.

She kept going.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "A second publisher (Knopf) accepted the book; it sold and spread by word of mouth. Publication came when she was 49. Her sense of finally having direction is a fair reading.",
      text: `Then another publisher said yes.

They believed in the strange, enormous book she and her friends had built. They printed it.

And it worked. People bought it. Then more people. Word spread from one home to the next. It turned out there were thousands of ordinary people back home who had wanted exactly this and never had it — someone patient enough to show them how, step by step, and certain that they could do it too.

She was nearly fifty when it came out. The thing she had been missing her whole life had taken her until middle age just to begin.

It did not matter to her at all. She had found it. For the first time, when she woke in the morning, she knew exactly what she was for.

After a lifetime of drifting, the drifting was over.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The television work, her unpolished joyful on-screen manner, the lasting national influence into her eighties — all documented. Name and craft withheld for the bridge.",
      text: `She did not slow down after that. She sped up.

Someone asked her to do the thing where people could watch her — to teach it out loud, in front of cameras, to anyone at home who wanted to learn. She was tall, and loud, and joyful, and not remotely smooth, and that turned out to be exactly why people trusted her. She fumbled things and laughed and kept right on going. If she could do it, you could do it. That was the whole message.

She became the most beloved teacher of her craft the country had ever had. She changed the way a whole nation did an ordinary, daily thing. She kept working into her eighties.

The woman who had reached forty sure she had no calling spent the entire second half of her life on fire with one.

She just got a late start. That was all.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Julia Child.

She taught America how to cook. The huge French cookbook she spent a decade on is still in kitchens everywhere, and her television show made her one of the most loved people in the country. She didn't learn to cook until she was almost forty, didn't publish that book until she was forty-nine, and didn't become famous until her fifties.

You wrote: "{feeling}"

For the whole first half of her life, she thought maybe she just wasn't built for a calling — that some people get one and some people don't, and she was one of the ones who don't. She was wrong. It hadn't passed her by. It simply hadn't started yet.

You don't have to have found it yet. She hadn't either, at your age.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born 1898 Belfast; mother died of cancer when he was 9; atheist in adolescence,
//    Christian again at 32; famous novelist + popular-theology writer, incl. a 1940 book giving a
//    reasoned account of why a good God allows suffering; married Joy Davidman (civil 1956, then a
//    Christian bedside ceremony 1957 after her bone-cancer diagnosis); brief remission; she died
//    13 July 1960 (he was 61); kept four notebooks of raw grief/doubt; published them 1961 as
//    "N. W. Clerk," titled A Grief Observed, calling her only "H."; he died 1963. (A Grief
//    Observed; Sayer, Jack; McGrath, C. S. Lewis - A Life.)
//  Interpretive: "grief felt like fear" is his own; framing his faith as returning "smaller,
//    quieter" is a fair reading of the book's arc. The turn is internal (grief as a process that
//    moves), not a decision - this is a single-fork-style integrity shape.
//  Avoid saying: don't name Narnia / Christianity / the titles / his name before the bridge.
//    Don't tidy the faith into a triumphant restoration - the honest record is a partial, humbled
//    recovery, not a neat happy ending. Don't sentimentalize the marriage.
const lewis: FigureStageRow = {
  figureKey: "lewis",
  displayName: "C. S. Lewis",
  birthYear: 1898,
  deathYear: 1963,
  stageId: "1960-1961-a-grief-observed",
  stageLabel: "After his wife's death: grief, and a faith shaken to its foundations",
  ageMin: 60,
  ageMax: 62,
  themes: ["grief", "solitude", "self_doubt"],
  antiThemes: [],
  shapeSentences: [
    "Late in life he finally married the person he loved most, and within a few short years he had to watch her die, and the grief did not match anything he had spent his whole life believing about how to bear it.",
    "He had written, years before, confident pages about how to carry suffering, and now that it was his own, the words he had handed everyone else were no help to him at all.",
    "He kept a private notebook through the worst of it, not to teach anyone anything, but only to keep from going under.",
  ],
  facets: {
    emotionalCore:
      "He felt grief as a kind of fear, and worse, the terror that the faith he had built his whole life and his name on might be a house of cards that only stood while nothing was testing it.",
    decisionShape:
      "Whether to keep faith with everything he had believed and written now that it brought him no comfort, or to admit he might have been wrong about all of it.",
    triggerEvent:
      "The woman he married late and loved completely died of cancer a few years into the marriage, undoing the settled certainties of a man who had spent decades explaining suffering to other people.",
    agencyState:
      "There was nothing to do and nothing to fix; for once the famously articulate man could not think or argue his way out of what had happened, and could only endure it.",
  },
  biographicalFacts: `Clive Staples Lewis was born November 29, 1898, in Belfast, Ireland. His mother died of cancer when he was nine, a loss that shadowed his early life; he became an atheist in adolescence and a Christian again at thirty-two, going on to be one of the most widely read religious writers and novelists of the twentieth century — including a famous series of children's fantasy novels and works of popular theology, among them a 1940 book offering a reasoned account of why a good God permits suffering. In 1956 he married Joy Davidman, an American writer, first in a civil ceremony and then, after she was diagnosed with bone cancer, in a Christian ceremony at her hospital bedside in 1957. Her cancer briefly went into remission and they had a few happy years. She died on July 13, 1960; Lewis was sixty-one. In the months after, he filled four handwritten notebooks with his raw grief and his anger and doubt toward God, and published them in 1961 under the pseudonym N. W. Clerk, titled A Grief Observed, referring to Joy only as "H." The book records a man whose lifelong faith was shaken to its foundations by a loss he could not reason away. Lewis died on November 22, 1963.`,
  sources: [
    "Lewis, C. S. (as N. W. Clerk). A Grief Observed (London: Faber & Faber, 1961).",
    "Lewis, C. S. Surprised by Joy: The Shape of My Early Life (London: Geoffrey Bles, 1955).",
    "Sayer, George. Jack: A Life of C. S. Lewis (London: Hodder & Stoughton, 1988).",
    "McGrath, Alister. C. S. Lewis - A Life (Carol Stream, IL: Tyndale House, 2013).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A confirmed bachelor for most of his life, an unexpectedly late marriage to a sharp, equal partner who argued with him, and his happiness in it are documented. Name and fame withheld for the bridge.",
      text: `There was a man in his sixties.

For most of his life he had been alone, in the romantic sense. He had friends, and work he was good at, and a quiet set of rooms full of his books. He had long ago made his peace with the idea that the great love most people get was simply not going to be his.

And then, late — far later than people usually do this — he met her.

She was sharp and funny and unafraid of him. She argued with him as an equal, which almost no one did. He married her. For the first time in his long life, the man who had everything except this finally had it too.

He was happier than he had ever been. He thought the hard part of his life was behind him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Her cancer, the brief remission and renewed hope, her death, and his own account of grief feeling like fear are documented (A Grief Observed opens almost exactly this way).",
      text: `Then she got sick.

It was the kind of sickness that does not let go. There were a few stretches where it seemed to pull back, where they let themselves hope. Each time, it came back.

He sat with her through all of it. He watched the person who had finally made his life full grow smaller and weaker in front of him, and there was nothing — nothing — he could do.

She died.

And the grief that came was not what he had expected. He had assumed grief would feel like sadness. It didn't. It felt like fear. He would be doing something ordinary and a wave of pure animal panic would rise in him for no reason he could name.

The house was unbearably quiet. He kept turning to tell her things, and she wasn't there.

He had been alone before. This was not that. This was a room with a person-shaped hole in it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The four notebooks, written privately and not initially intended for publication, are documented as the origin of the book. The framing of writing as survival rather than teaching is fair.",
      text: `He started writing in a notebook.

Not for anyone. Not to publish, not to teach. He had spent his life writing things meant to help other people, and this was the opposite of that. This was just a man trying not to drown — putting down on paper exactly how bad it was, so it would stop rattling around inside his skull.

He wrote down the fear. He wrote down the anger. He wrote down the questions he was ashamed to be asking.

He didn't tidy any of it. He didn't make it wise. He just told the truth, page after page, on the worst nights.

It was the only thing that helped. And it barely helped.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The crisis of faith is the documented core of the book — including the irony that he had previously written a reasoned book on suffering. His fear that his faith only worked untested is drawn closely from the text.",
      text: `Here is the part that frightened him most.

His whole life, he had believed something. He had built everything on it — his work, his name, the way he explained the world to himself and to thousands of other people. He had once written an entire book about how to bear suffering. People wrote to him for comfort. He had answers.

Now the suffering was his, and the answers were ashes in his mouth.

He found himself furious at the very thing he had believed in. He wondered, in the dark, whether he had been fooling himself the whole time — whether the faith that had held him up for decades was just a story that worked only as long as nothing truly tested it.

He had no tidy way out of this. For once, the man who could argue anything could not argue his way out.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The turn is internal and gradual, not a decision or an event: grief as a process that moves, faith returning in a humbler form. This is the documented shape of the book's later sections.",
      text: `Slowly — and it was slow — something shifted. Not a fix. Not a moment where the clouds broke and it all made sense.

What changed was smaller and stranger. As he kept writing, he noticed the grief was not one frozen thing. It moved. Some mornings were a fraction less terrible than the ones before. The pain did not leave, but it began to feel less like a wall he was slammed against and more like a country he was slowly walking through.

And his faith, when it came back, came back different. Smaller. Quieter. Less sure of its own cleverness. He stopped demanding that the universe explain itself to him. He found he could hold the grief and the belief at the same time, without either one having to win.

He was not healed. He was simply, somehow, still standing. And being still standing, he slowly came to feel, was its own kind of answer.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "He published the notebooks under a pseudonym; the book has since become a standard, widely given comfort to the grieving. \"The most comforting thing he wrote was written when he had no comfort\" is interpretive but well-grounded.",
      text: `He did something he had not planned to do. He let the notebook be published.

Not under his own name — he used a false one, because the pages were too raw and too private to put his real name on. He didn't want it to be a famous man's book. He wanted it to be one grieving person speaking honestly to another.

And that is exactly what it became. A small, plain, unbearably honest book about losing someone. It has been pressed into the hands of grieving people ever since — by friends who don't know what else to say — because it says the thing: that this is as bad as you think it is, and that you can still, somehow, come out the other side.

The most comforting thing he ever wrote was the thing he wrote when he had no comfort at all.

He didn't fix his grief. He just refused to lie about it. That turned out to be the gift.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was C. S. Lewis.

He was one of the most famous writers of his century — beloved children's books about a magical land, and works of faith that millions still read. He had even written, years before his wife died, a confident book explaining how to bear suffering. Then he had to actually bear it, and the small, honest book he wrote in his grief — first published under a false name — has comforted more hurting people than perhaps anything else he made.

You wrote: "{feeling}"

He was past sixty, at the height of his fame, with all the answers, and grief knocked every one of them out of his hands. He didn't get them back the same. He got something quieter instead. He kept going anyway — not because it stopped hurting, but because the hurting slowly began to move.

You don't have to have the answers right now. He didn't either, and he had written the book on it.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born 1931 Arkabutla MS; as a small child sent to grandparents John Henry & Maggie
//    Connolly's farm in Dublin, Michigan; the move was traumatic; developed a severe stutter and
//    was "functionally mute" roughly age 6-14; spoke freely only to the farm animals and to
//    himself; wrote poetry; high-school teacher Donald Crouch (a former professor) dared him to
//    recite his own poem aloud to prove he'd written it; he got through it without stuttering;
//    went on to recite Shakespeare for hours, won at debate; became the voice of Darth Vader and
//    Mufasa across a celebrated career; died 2024. (Jones & Niven, Voices and Silences; Academy of
//    Achievement; the Stuttering Foundation.)
//  Interpretive: the boy's internal "my own voice is the enemy" framing; shame as the engine of
//    the silence. Drawn closely from his own accounts; lightly dramatized.
//  Avoid saying: don't name Vader / Mufasa / Star Wars / his name before the bridge. Don't turn
//    the teacher into a magic cure - it unlocked him, but years of work followed. Keep farm/era
//    markers soft.
const jones: FigureStageRow = {
  figureKey: "jones",
  displayName: "James Earl Jones",
  birthYear: 1931,
  deathYear: 2024,
  stageId: "1937-1945-the-silent-years",
  stageLabel: "The silent years: a stutter so deep he stopped speaking",
  ageMin: 6,
  ageMax: 14,
  themes: ["shame", "finding_voice", "solitude"],
  antiThemes: [],
  shapeSentences: [
    "He was a small boy sent to live on a farm far from everything he knew, and the shock of it gave him a stutter so bad that he simply stopped talking, for years.",
    "He was so ashamed of the sounds that came out when he tried to speak that he learned to live almost entirely in silence, writing things down, talking only to the farm animals.",
    "The thing that brought his voice back was not a doctor but a teacher who refused to believe the silence was permanent, and a poem the boy had written himself.",
  ],
  facets: {
    emotionalCore:
      "He carried the deep shame of a child who believes the very act of opening his mouth will humiliate him, and who has decided that silence is safer than the certainty of being laughed at.",
    decisionShape:
      "Whether to stay safe inside the silence he had built, or to risk the one thing that had always humiliated him — his own voice — out loud, in front of a room full of people.",
    triggerEvent:
      "Uprooted as a small child and sent to live with relatives far away, the boy developed a stutter so severe that he stopped speaking aloud almost entirely for years.",
    agencyState:
      "He had near-total control over one thing — whether to speak at all — and he used it to protect himself by choosing silence, which kept him safe and kept him alone.",
  },
  biographicalFacts: `James Earl Jones was born January 17, 1931, in Arkabutla, Mississippi. As a small child he was sent to live with his maternal grandparents, John Henry and Maggie Connolly, on their farm in Dublin, Michigan; the upheaval of the move was traumatic, and he developed a stutter so severe that he essentially stopped speaking. From roughly age six to fourteen he was, in his own word, "functionally mute" — communicating in writing, speaking only haltingly to his family, and talking at length only to the farm animals and to himself. In high school in Michigan, an English teacher named Donald Crouch, a former college professor, discovered that the silent boy wrote poetry. Suspecting the poems were too accomplished to be the boy's own, Crouch challenged him to prove authorship by reciting one aloud to the class. Jones did — and got through it without stuttering. The shock of hearing his own fluent voice changed his life. He went on to recite Shakespeare for hours, joined the debate team and became a champion, and eventually became one of the most distinctive and recognizable voices in the world — the voice of Darth Vader in the Star Wars films and Mufasa in The Lion King, across a celebrated stage and screen career spanning more than six decades. He died September 9, 2024.`,
  sources: [
    "Jones, James Earl, and Penelope Niven. James Earl Jones: Voices and Silences (New York: Charles Scribner's Sons, 1993).",
    "\"James Earl Jones,\" Academy of Achievement interview.",
    "The Stuttering Foundation, profile of James Earl Jones.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Sent away as a small child to be raised by grandparents on a farm, the traumatic move, the onset of a severe stutter, and the gradual retreat into silence are all documented.",
      text: `There was a boy. He was about seven.

When he was little, he had been sent away — taken from the place and the people he knew and dropped onto a farm a long way off, to be raised by his grandparents. He never really got over the shock of it.

Somewhere in there, his words broke.

When he tried to talk, they came out stuck and stuttering and wrong. The other kids noticed. They always notice. And the shame of it grew so big that he made a decision a child should never have to make.

He just stopped talking.

Not all at once. But more and more, until silence became the normal thing. It was safer. If he didn't open his mouth, no one could laugh at what came out.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Years of near-total silence, writing answers instead of speaking, talking freely only to the farm animals and to himself, are documented in his own account. The internal belief that his voice was the enemy is drawn from it.",
      text: `He stayed silent for years.

Think about what that means for a kid. Years. He went to school and didn't speak. He raised his hand for nothing. When a teacher asked him a question, he wrote the answer down, or just looked at the floor until they moved on.

The only ones he really talked to were the animals on the farm. They didn't care how the words came out. He would talk to them as long as he wanted, easy and free, and then go back to the house and lock the silence back into place around the people.

He talked to himself, too. Inside his own head, his voice worked fine. It was only when it had to come out into the world that it failed him.

He grew up believing, all the way down, that his own voice was the enemy — the thing that would shame him every single time. So he kept it locked up, and he kept himself locked up with it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "That he wrote — including poetry — fluently while unable to speak is documented, and is the hinge the later turn depends on.",
      text: `There was one place the words came out clean. On paper.

When he wrote, there was no stutter. No one waiting for him to finish. No faces watching him struggle. He could say anything he wanted, exactly the way he meant it.

So he wrote. Quietly, for himself. He started writing poems — the things he could not say out loud, set down where they could finally hold still and be true.

He didn't show them to anyone. They were his. They were proof, at least to himself, that there was a voice in there.

It just had no way out.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The long duration of the silence and the way it shaped his whole identity as \"the quiet one\" are documented. The carried sentence (\"if I open my mouth, everyone will hear it\") is interpretive but well-grounded.",
      text: `This went on for years. Most of his childhood, really.

On the outside he was the quiet one. The boy who didn't talk. Teachers learned not to call on him. Kids learned he wasn't going to say anything back. He folded himself smaller and smaller around the silence until it was simply who he was.

He was good at hiding it. He had to be. A whole life can be built around not letting people see the thing you are ashamed of.

But the hiding cost him. Every day he carried the same quiet sentence around inside him: there is something wrong with me, and if I open my mouth, everyone will hear it.

He had no reason to think this would ever change. As far as he knew, this was just the shape of his life.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The teacher (Donald Crouch) finding his poetry, daring him to recite it to prove authorship, and the boy getting through it without a stutter are all documented; he called it the turning point of his life.",
      text: `Then he got a new teacher.

An older man, who had taught a long time and paid real attention to his students. He found one of the boy's poems. And it was good — good enough that the teacher, maybe testing him, maybe just refusing to let him hide, said the thing that must have stopped the boy's heart.

He said: if this poem is really yours, then stand up and say it. Out loud. To the whole class.

Every instinct the boy had screamed no. Standing up was the exact thing he had spent years avoiding. The whole room would watch his mouth fail.

But he stood up.

And he opened his mouth, and the poem came out. All of it. Clean. Not one stutter.

He stood there, stunned, hearing his own voice fill the room for the first time in years. It had been in there the whole time. The teacher had simply refused to believe it was gone.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Reciting Shakespeare for hours, debate-team success, and a lifelong career built on his extraordinary voice are documented. The famous roles are withheld for the bridge.",
      text: `After that, he could not be stopped.

He chased the very thing that had terrified him his whole life. He read aloud for hours, alone, just to feel the words come out whole. He joined the team where you argue out loud in front of judges, and he won. The boy who had not spoken for years became known, of all things, for his voice.

And not just any voice. As he grew up it deepened into something extraordinary — low and warm and steady, a voice that could fill a room, a theater, eventually a screen the whole world watched. People would know it instantly, anywhere, for the rest of his life.

The thing he had been most ashamed of turned out to be his single greatest gift. The enemy he had locked away was the best of him.

He just had to be dared, one time, to let it out.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was James Earl Jones.

The boy who couldn't speak grew up to have one of the most famous voices in the history of the world. He was the voice of Darth Vader in Star Wars. He was Mufasa in The Lion King. For decades, on stage and screen, that deep, unmistakable voice was one of the most beloved sounds anywhere — and it belonged to a man who, as a child, was so ashamed of his voice that he went almost completely silent for years.

You wrote: "{feeling}"

He didn't fix it alone. It took one teacher who refused to believe the silence was the end of the story, and one poem he had written when he thought no one would ever hear it. The voice was always in there. It just needed one safe place to come out.

You don't have to have your voice yet. He didn't either, for years. It was still in there the whole time.`,
    },
  ],
};

export const FIGURE_STAGES: FigureStageRow[] = [douglass, butler, lee, rogers, child, lewis, jones];
