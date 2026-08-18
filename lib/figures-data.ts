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
// Bridge beats reflect only a broad human parallel. They never quote or interpolate
// the user's disclosure; session-specific bridges belong behind the validated
// composition and privacy gates described in the public-release roadmap.

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

Your life is not theirs. But a piece of this story may still sit beside you.

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

Your life is not theirs. But a piece of this story may still sit beside you.

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

Your life is not theirs. But a piece of this story may still sit beside you.

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

For more than thirty years he made a television show for children — just him, talking quietly, with a few hand puppets and a cardigan and a pair of sneakers he changed into at the start of every visit. He told a whole country of kids that they were liked just the way they were. When people in the government wanted to cut the money that paid for it, he spoke to them for six minutes and they changed their minds. He is one of the most beloved public figures in the country.

Your life is not theirs. But a piece of this story may still sit beside you.

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

She became the most beloved teacher of her craft the country had ever had. She changed the way a whole nation saw a craft most people had believed was too difficult for them. She kept working into her eighties.

The woman who had reached forty sure she had no calling spent the entire second half of her life on fire with one.

She just got a late start. That was all.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Julia Child.

She taught America how to cook. The huge French cookbook she spent a decade on is still in kitchens everywhere, and her television show made her one of the most loved people in the country. She didn't learn to cook until she was almost forty, didn't publish that book until she was forty-nine, and didn't become famous until her fifties.

Your life is not theirs. But a piece of this story may still sit beside you.

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

Your life is not theirs. But a piece of this story may still sit beside you.

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

And not just any voice. As he grew up it deepened into something extraordinary — low and warm and steady, a voice that could fill rooms far larger than that classroom.

The sound he had spent years avoiding became the work itself. The enemy he had locked away was the best of him.

He just had to be dared, one time, to let it out.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was James Earl Jones.

The boy who couldn't speak grew up to have one of the most famous voices in the history of the world. He was the voice of Darth Vader in Star Wars. He was Mufasa in The Lion King. For decades, on stage and screen, that deep, unmistakable voice was one of the most beloved sounds anywhere — and it belonged to a man who, as a child, was so ashamed of his voice that he went almost completely silent for years.

Your life is not theirs. But a piece of this story may still sit beside you.

He didn't fix it alone. It took one teacher who refused to believe the silence was the end of the story, and one poem he had written when he thought no one would ever hear it. The voice was always in there. It just needed one safe place to come out.

You don't have to have your voice yet. He didn't either, for years. It was still in there the whole time.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born 1940 near Clarksville TN, premature, 20th of 22 in her father's family;
//    polio ~age 5 left her left leg weak; a doctor said she'd never walk, her mother said she
//    would; segregated South -> ~2 years of weekly ~50mi bus trips to the (Black) Meharry
//    Medical College in Nashville + family massage 4x/day; metal leg brace until ~12; walked
//    unaided, then ran; 1956 Olympics relay bronze at 16; 1960 Rome 3 golds (100m, 200m, relay),
//    "fastest woman in the world"; insisted her homecoming be integrated; later coach/foundation;
//    died 1994. (Rudolph, Wilma; Smith, Wilma Rudolph; NWHM.)
//  Interpretive: framing "believe her mother over the doctor" as the act of defiance; the secret
//    brace-off practice and the "if I can walk I can run" turn are grounded, lightly dramatized.
//  Avoid saying: don't name the Olympics / Rome / three golds / "fastest woman" / her name before
//    the bridge. Keep segregation real but softened (no slurs, no era-coded institution names).
//    Don't reduce her to an inspirational object - the agency is hers.
const rudolph: FigureStageRow = {
  figureKey: "rudolph",
  displayName: "Wilma Rudolph",
  birthYear: 1940,
  deathYear: 1994,
  stageId: "1945-1953-the-brace-years",
  stageLabel: "The brace years: a sick girl told she would never walk",
  ageMin: 8,
  ageMax: 16,
  themes: ["disability", "keep_going", "quiet_defiance"],
  antiThemes: [],
  shapeSentences: [
    "She was a small, sick girl in a leg brace whom a doctor had told would never walk, and for years the most defiant thing she did was believe her mother instead of him.",
    "Week after week she made the long trip for treatment and let her family work her dead leg by hand, on the faith that a body everyone had written off might still be taught to move.",
    "The day she finally walked without the brace was not the end of it — it was the day she decided that if she could walk, she could run.",
  ],
  facets: {
    emotionalCore:
      "She carried the strange double burden of a child who has been told, by someone who should know, that her own body has already decided the size of her life.",
    decisionShape:
      "Whether to accept the verdict a doctor had handed down about what her body could never do, or to spend years on the slim, unglamorous chance that he was wrong.",
    triggerEvent:
      "A childhood illness left one of her legs weak and braced, and the doctor said she would never walk, while her mother said she would.",
    agencyState:
      "She had little control over a poor, crowded household or a body that had failed her, but she could choose, every single day, to do the exercises and believe the harder of the two predictions.",
  },
  biographicalFacts: `Wilma Glodean Rudolph was born prematurely on June 23, 1940, near Clarksville, Tennessee, one of twenty-two children in her father's family. A sickly child, she survived pneumonia and scarlet fever and then, around age five, contracted infantile paralysis (polio), which left her left leg and foot weak and partly paralyzed. A doctor told the family she would never walk again; her mother, Blanche, told her she would. Because the local hospital would not treat Black patients, for about two years Wilma and her mother rode the bus some fifty miles to the historically Black Meharry Medical College in Nashville for weekly therapy, and family members massaged her leg four times a day at home. She wore a heavy metal leg brace and, later, an orthopedic shoe. By about age twelve she could walk without the brace. She threw it off and began to play basketball, then to run. She competed in her first Olympic Games at sixteen, winning a bronze medal in the relay; four years later, at the 1960 Rome Olympics, she won three gold medals — the 100 meters, the 200 meters, and the 4x100 relay — and was called the fastest woman in the world. She insisted that her hometown victory celebration be the first integrated public event in the town's history. She later became a teacher and coach and founded a foundation for young athletes. She died of cancer on November 12, 1994.`,
  sources: [
    "Rudolph, Wilma. Wilma: The Story of Wilma Rudolph (New York: New American Library, 1977).",
    "Smith, Maureen M. Wilma Rudolph: A Biography (Westport, CT: Greenwood Press, 2006).",
    "\"Wilma Rudolph,\" National Women's History Museum, womenshistory.org.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Large poor family, childhood polio leaving a braced leg, the doctor's \"never walk\" verdict and her mother's opposite one are documented. The two-futures framing is fair.",
      text: `There was a girl. She was about eight.

She had been sick almost since the day she was born. One of the sicknesses had left a leg weak and turned the wrong way, so she wore a heavy brace of metal and leather to hold it up. She couldn't run with the other kids. Most days she could barely keep up walking.

She came from a big family — so many brothers and sisters she could hardly count them — and there was never quite enough of anything to go around.

When she was small, a doctor had looked at her leg and told her family the truth as he saw it: this girl will never walk on her own.

Her mother heard the same words and said something different. She told the girl: you will.

Two grown-ups. Two opposite futures. The girl had to choose which one to believe.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The weekly long trips to a faraway clinic that would treat her (the local one would not), and the family massaging her leg four times a day, are documented. Segregation softened per the no-era-markers rule.",
      text: `Being the girl in the brace was its own kind of lonely.

She sat and watched while the other children ran. She clanked when she moved. Kids can be unkind about a thing like that, and they were.

Once a week, her mother took her on a long bus ride to the only place that would treat a child like her — a clinic far away, because the one nearby would not take her family. Hours there. Hours back. Then home, where her brothers and sisters took turns rubbing the life back into her dead leg, four times a day, every day.

It would have been so easy to stop. To decide the doctor was right. To let the leg be what it was and make her whole life small enough to fit it.

Some nights, lying there while someone worked her useless leg, she must have wondered if any of it was doing a thing.

She kept letting them try. She kept trying.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Years of daily exercise/massage and gradual recovery of the leg are documented. The secret brace-off practice is plausible dramatization of her drive to walk unaided.",
      text: `She did the exercises. Every day. For years.

There was nothing dramatic about it. No single morning where everything changed. Just a girl and her family quietly refusing to agree with the doctor, one rubbed muscle and one wobbly step at a time.

And slowly — so slowly no one could see it day to day — the leg began to answer.

She found she could stand a little longer. Then take a step without the brace. Then a few.

She started taking the brace off in secret, when no grown-ups were watching, just to practice being a girl who didn't need it.

She wasn't healed. But she was no longer sure the doctor had been right. And that small, stubborn doubt was the most powerful thing she owned.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The long, nonlinear recovery across most of her childhood is documented. The unspoken larger ambition is the editorial through-line that sets up the turn.",
      text: `It took years. Most of her childhood.

There were setbacks. The leg got tired. The brace went back on, then came off again. Progress is never a straight line, and hers zigzagged through a lot of ordinary days that didn't feel like victories.

She kept at it anyway. The trips. The massages. The exercises. The quiet practice when no one was looking.

She had decided something, deep down, that she didn't say out loud. She wasn't only trying to walk like everyone else. Somewhere in all those slow steps, a bigger, almost ridiculous idea had taken hold of her.

If she could teach this leg to walk, maybe she could teach it to do more than that.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Walking without the brace by about age twelve, then taking up basketball and running, is documented. The \"walking wasn't enough\" framing captures her competitive drive.",
      text: `Then came the day.

She was about twelve. She had worn that brace, in one form or another, for most of her life. And she walked into the place where they treated her, took it off, and walked across the room without it.

And she kept it off.

The thing the doctor had said would never happen had happened. She could walk.

But here is the part that tells you who she was. Walking wasn't enough for her. The moment her body would carry her, she didn't just want to keep up with the other kids. She wanted to beat them.

So she started to run. The girl who was never supposed to walk began, of all things, to chase being fast. And it turned out that the leg that had failed her for so long had something in it nobody had guessed.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Her rise to the top of world sport and her insistence on an integrated homecoming celebration are documented. Name and the Olympics withheld for the bridge.",
      text: `She got fast. Then she got faster than anyone around her. Then faster than almost anyone, anywhere.

A few years later, the girl who had spent her childhood in a leg brace stood on the biggest stage in sport, in front of the whole world, and won — not once, but again and again. She became, for a time, the fastest woman alive.

The body a doctor had written off carried her past every runner they lined up beside her.

And when her town wanted to throw a celebration for her, she made one condition. Back then, events like that were split by the color of people's skin. She said she would only come if everyone could come. So her homecoming became the first time her town ever celebrated together, as one.

The girl who couldn't walk had decided, again, that the rules about what she was allowed did not get the last word.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Wilma Rudolph.

At the 1960 Olympics in Rome she won three gold medals and was called the fastest woman in the world. The girl who had been told she would never walk became the most famous runner on the planet — and then spent the rest of her life coaching kids and opening doors for the athletes who came after her.

Your life is not theirs. But a piece of this story may still sit beside you.

None of it arrived in one heroic leap. It came from a little girl, a stubborn mother, a family that rubbed a dead leg back to life four times a day, and years of small steps that didn't look like much from the outside.

You don't have to believe the worst thing you've been told about yourself. She didn't. And she was right not to.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1928 St. Louis; pregnant at 16, hid it, gave birth ~3 weeks after graduating,
//    at 17; son Clyde (later Guy) Johnson; the father wanted no part; raised him alone on low-wage
//    jobs (cook, waitress, dancer), hand-to-mouth; the documented anecdote of her mother making
//    the baby sleep in her bed, her terror of crushing him, waking to find she'd curled
//    protectively around him, and the lesson "if you're for the right thing, you do it without
//    thinking"; later one of the great writers (I Know Why the Caged Bird Sings), inaugural poet;
//    raised Guy lifelong; d.2014. (Caged Bird; Gather Together in My Name; Oprah interviews.)
//  Interpretive: the "I'm going to ruin him / I'm not enough" inner voice. From her own accounts,
//    lightly dramatized.
//  Avoid saying: don't name Angelou / Caged Bird / the inaugural poem before the bridge. Do NOT
//    pull in her separate childhood-trauma/mutism episode (a different stage) - keep this one about
//    young motherhood. The "father's temper" eval-miss is adjacent, not identical (her fear was
//    youth/inadequacy, not repeating violence); let the reranker judge the fit.
const angelou: FigureStageRow = {
  figureKey: "angelou",
  displayName: "Maya Angelou",
  birthYear: 1928,
  deathYear: 2014,
  stageId: "1944-1945-teen-mother",
  stageLabel: "The terrified teen mother",
  ageMin: 16,
  ageMax: 19,
  themes: ["new_parent_fear", "self_doubt", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "She got pregnant at sixteen, gave birth weeks after finishing school, and found herself a teenager with a newborn and a bone-deep certainty that she was going to ruin him.",
    "The father wanted nothing to do with them, so it was just her and the baby and a string of jobs that barely covered the rent.",
    "The night she first understood she might not destroy this child came from her mother, and from her own arms doing the right thing while she slept.",
  ],
  facets: {
    emotionalCore:
      "She felt the specific terror of a young parent who is sure she is too young, too unready, and too damaged to keep a small helpless person alive, let alone raise him well.",
    decisionShape:
      "Whether to believe she was bound to fail this child — too young and too alone to do it right — or to simply keep showing up for him until the doing became the proof.",
    triggerEvent:
      "A teenager barely out of school had a baby on her own, with the father gone and no money, and had to become a mother before she felt remotely ready to be one.",
    agencyState:
      "She had almost nothing — no partner, little money, no experience — except the daily, exhausting power to keep choosing this child over her own fear.",
  },
  biographicalFacts: `Marguerite Annie Johnson — later known as Maya Angelou — was born April 4, 1928, in St. Louis, Missouri, and grew up between Missouri, Arkansas, and California. At sixteen, in her final year of high school in San Francisco, she became pregnant after a brief encounter; she hid the pregnancy until after graduation and gave birth to her son, Clyde (later called Guy) Johnson, about three weeks later, at seventeen. The baby's father wanted no part of them. Terrified but determined, she refused to give the child up and set out to raise him alone, taking a string of low-wage jobs — cook, waitress, nightclub dancer — and at times living hand to mouth. She later recounted that on the first night her mother insisted the baby sleep in the bed beside her; Maya was so afraid she would roll over and crush him that she meant to stay awake all night, but fell asleep — and woke to find she had instinctively curled her body into a tent around him without waking. Her mother told her: "See, you don't have to think about doing the right thing. If you're for the right thing, then you do it without thinking." Angelou went on to become one of the most celebrated writers of the twentieth century — author of I Know Why the Caged Bird Sings, a poet who read at a U.S. presidential inauguration, an actor, and a civil-rights worker — and raised Guy as a single mother through years of struggle. She died May 28, 2014.`,
  sources: [
    "Angelou, Maya. I Know Why the Caged Bird Sings (New York: Random House, 1969).",
    "Angelou, Maya. Gather Together in My Name (New York: Random House, 1974).",
    "\"Maya Angelou,\" interviews with Oprah Winfrey (OWN / SuperSoul Sunday).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Pregnant at 16 after a brief encounter, hid it, gave birth weeks after graduating at 17, the father absent - all documented. Her love-and-terror is from her own accounts.",
      text: `There was a girl. She was seventeen.

She had just finished school. Most kids her age were thinking about the summer, about what came next, about being young.

She was holding a baby.

She had gotten pregnant the year before, near the end of school, after one brief thing with a boy. She hid it as long as she could under loose clothes. A few weeks after she graduated, her son was born.

The baby's father didn't want anything to do with them.

So it was her. A seventeen-year-old, with a newborn who needed everything, and almost nothing to give him but herself.

She loved him so much it scared her. And she was certain, all the way down, that she was going to get this terribly, terribly wrong.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Her fear of being inadequate, her own hard history, and the relentless low-wage work to support the baby are documented. The interior \"I am going to fail him\" voice is drawn from her accounts.",
      text: `The fear was the worst part.

She was so young. She didn't know what she was doing. Every cry could be something serious and she wouldn't know it. Every choice felt like one she was bound to make wrong.

She had grown up with her own hard things — things that made her wonder whether she even had it in her to be somebody's safe place. How do you keep a small person whole when you're not sure you are one yourself?

There was the money, too. Never enough. She took whatever work she could get. Long shifts on her feet. Coming home wrung out to a baby who needed her to have more left.

And underneath all of it, the quiet, constant dread: I am going to fail him. I'm too young. I'm too alone. I am not enough for this.

She held him anyway. She just didn't believe, yet, that holding him was enough.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Raising him alone hour by hour, working constantly, refusing to quit, is documented. The \"choosing him before feeling ready\" framing is a fair reading.",
      text: `She didn't have a plan. She had a baby and the next hour.

So she did the next hour. Then the one after that.

She fed him. She kept him warm. She went to work and came home and went to work again. When she got something wrong, she fixed what she could and kept going. There was no room to quit, so she didn't.

She wasn't doing it gracefully. She was doing it scared, most of the time. But she was doing it.

Nobody handed her confidence. She just kept choosing him, over and over, before she felt ready — because there was no version of this where she got to wait until she felt ready.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The years of lean, hand-to-mouth single parenthood and constant self-doubt are documented. The boy growing \"because she stayed\" is interpretive but grounded.",
      text: `The next few years were lean and hard.

She moved between jobs and rooms. She counted coins. She raised him in the cracks of long workdays, tired in a way only single parents really know.

She made mistakes. She second-guessed almost everything. There was no partner to tell her she was doing okay, no cushion if she got it wrong.

And the boy grew. He grew because she fed him and held him and stayed. Whatever she felt about herself, she kept being the one thing he could count on.

The dread didn't vanish. It just had to share the day with the work.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The documented anecdote: her mother made the baby sleep beside her, she feared crushing him, fell asleep, woke curled protectively around him, and her mother's lesson - \"if you're for the right thing, you do it without thinking.\"",
      text: `One night, early on, her own mother made her let the baby sleep in the bed beside her.

She was terrified. She was sure she would roll over in her sleep and crush him. She decided she simply would not sleep. She would stay awake all night to keep him safe.

She fell asleep anyway.

And when she woke, she found that in the night, without thinking, without trying, her body had curled itself into a kind of tent around the baby. She hadn't crushed him. She had protected him — in her sleep, on instinct, while her scared, second-guessing mind was switched off.

Her mother told her something she never forgot. That you don't have to think your way into doing right by someone. If your heart is set on the right thing, you'll do it without even thinking.

She had been so busy being afraid she would fail him that she had not noticed she was already keeping him safe.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "She raised Guy through years of struggle and became a major writer and public voice. The line about speaking \"in front of the whole country\" gestures at the inaugural poem without naming it.",
      text: `She raised him.

Not perfectly. Nobody does. But she stayed, and she worked, and the scared seventeen-year-old slowly became a woman who knew, in her body, that she could be relied on.

And she became so much more than she could have imagined on those frightened first nights. She found she had a voice — a big, deep, unforgettable one. She wrote books that told the truth about hard lives, including her own, and they reached millions of people. She stood up in front of the whole country and spoke words people still carry around with them.

The boy she was sure she would ruin grew up loved, and grew up proud of her.

She did all of it while believing, for a long time, that she wasn't enough. She was. She just had to keep going long enough to find out.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Maya Angelou.

She became one of the most beloved writers of the last hundred years. Her first book, about surviving a hard childhood, is read all over the world. She wrote and recited a poem at a President's inauguration. And she did it as a woman who had started out a terrified teenager, alone with a baby, certain she would fail him.

Your life is not theirs. But a piece of this story may still sit beside you.

She raised that son her whole life. The fear that she wasn't enough didn't go away because someone reassured her. It went away slowly, because she kept showing up for him until the showing up became the proof.

You don't have to feel ready. She didn't. You just have to keep choosing the people you love, and let that be the answer.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1873 Russia; gifted young pianist/composer; First Symphony premiere 28 Mar 1897
//    in St. Petersburg was a disaster (under-rehearsed; conductor Glazunov reportedly drunk); the
//    critic Cesar Cui savaged it ("if there were a conservatory in Hell," Rachmaninoff would win
//    its prize); ~3-year depression, composed almost nothing, doubted his talent; from Jan 1900
//    daily sessions with Dr. Nikolai Dahl (hypnosis + calm repeated suggestion: "you will compose
//    again... it will be excellent"); recovered; Piano Concerto No. 2 (1901), dedicated to Dahl,
//    became a beloved staple; major career; d.1943 Beverly Hills. (Bertensson & Leyda; Harrison;
//    Walker.)
//  Interpretive: "the skill stayed, the belief left"; "faith can be borrowed until yours returns"
//    reading of the Dahl treatment. Grounded, lightly dramatized.
//  Avoid saying: don't name Rachmaninoff / the Second Concerto / Russia / Cui / Dahl before the
//    bridge. Don't render the therapy as magic - it was patient, repeated suggestion over months,
//    plus his own slow return.
const rachmaninoff: FigureStageRow = {
  figureKey: "rachmaninoff",
  displayName: "Sergei Rachmaninoff",
  birthYear: 1873,
  deathYear: 1943,
  stageId: "1897-1901-after-the-first-symphony",
  stageLabel: "After the disastrous premiere: three years unable to compose",
  ageMin: 23,
  ageMax: 28,
  themes: ["public_failure", "creative_dismissal", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He was a young composer whose first big work was wrecked at its premiere and torn apart in print, and the public humiliation knocked the music out of him for years.",
    "For three years he could not write — not a stuck patch but a total collapse of the belief that he had anything worth writing at all.",
    "What brought him back was not a sudden idea but a quiet doctor who, day after day, simply told him he would write again.",
  ],
  facets: {
    emotionalCore:
      "He felt the particular shame of public failure — not a private rejection he could hide, but a humiliation witnessed by everyone whose opinion he cared about, which curdled into the conviction that he was finished.",
    decisionShape:
      "Whether to accept the verdict of one catastrophic night and the cruel reviews that followed, or to risk believing he still had music in him when all the evidence said otherwise.",
    triggerEvent:
      "His ambitious first symphony was performed so badly, and reviewed so savagely, that the young composer concluded he had no talent and stopped composing altogether.",
    agencyState:
      "He had the skill and the training intact, but the one thing a creator cannot manufacture — the belief that the work is worth making — had been taken from him, and without it the skill was useless.",
  },
  biographicalFacts: `Sergei Vasilyevich Rachmaninoff was born April 1, 1873, in Russia. A prodigiously gifted pianist and composer, he completed his ambitious First Symphony in his early twenties. Its premiere, in St. Petersburg on March 28, 1897, was a catastrophe: the orchestra was under-rehearsed and the conductor, Alexander Glazunov, was reportedly drunk. The work was savaged, most famously by the composer-critic Cesar Cui, who wrote that if there were a conservatory in Hell, Rachmaninoff would deserve its first prize for the symphony. The humiliation devastated him. He fell into a severe depression that lasted roughly three years, during which he composed almost nothing and doubted he had any talent at all. In January 1900, at his family's urging, he began daily sessions with Dr. Nikolai Dahl, a physician who used hypnosis and calm, repeated suggestion — telling him steadily that he would compose again and that the work would be excellent. Rachmaninoff slowly recovered, and the music returned. The result was his Piano Concerto No. 2, premiered in 1901 and dedicated to Dahl; it became one of the most beloved works in the entire piano repertoire. He went on to be one of the great composers and pianists of his era. He died March 28, 1943, in Beverly Hills, California.`,
  sources: [
    "Bertensson, Sergei, and Jay Leyda. Sergei Rachmaninoff: A Lifetime in Music (New York: New York University Press, 1956).",
    "Harrison, Max. Rachmaninoff: Life, Works, Recordings (London: Continuum, 2005).",
    "Walker, Robert. Rachmaninoff (London: Omnibus Press, 1980).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A prodigiously gifted young composer, recognized since boyhood, finishing his first large-scale work and staking his reputation on its premiere - all documented.",
      text: `There was a young man, not yet thirty. He wrote music.

He was good. Everyone had said so since he was a boy — teachers, other musicians, the people who knew. He had the kind of talent that makes a room go quiet.

He had just finished the biggest thing he had ever written. A huge, ambitious piece he had poured years into. It was going to be the work that announced him to the world.

The night of its first performance, the whole musical world he cared about would be in the room.

He was nervous, the way you are before something you've bet everything on. But under the nerves was a young man's certainty that this was his moment.

It was about to go very, very wrong.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The under-rehearsed premiere, the reportedly drunk conductor, and the savage review (the \"conservatory in Hell\" line) are documented. His internal conclusion that he himself had failed is drawn from the record.",
      text: `The performance was a disaster.

The musicians had barely rehearsed. The man waving the baton out front did a clumsy, careless job — some said he had been drinking. The beautiful thing in the young man's head came out of that orchestra as a mess.

He sat there and listened to his great work fall apart in front of everyone whose opinion mattered to him.

Then came the reviews. One of the most famous critics alive tore it to shreds — not gently, not usefully, but cruelly, the kind of review built to end someone. He wrote that the piece belonged in hell.

Something in the young man broke that night and didn't mend for a long time. It wasn't only that the piece had failed. It was that he had failed, in public, completely. And he believed it. He decided the critic was right. He decided he had nothing.

And the music stopped.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "He continued to work as a performing musician to earn a living while unable to compose. The \"survived the days and waited\" framing fits the documented depression.",
      text: `He didn't stop being a musician. He just stopped being able to make anything new.

He still went out into the world. He played. He earned his keep. To everyone watching, he looked fine — a working musician, doing his job.

Inside, the well was dry. He would sit down to write and nothing came. Not bad music. No music. The part of him that made things had gone silent, and he had no idea how to wake it.

So he did the only thing he could. He kept getting up. He kept his hands on the keys, even when they made nothing of his own. He survived the days, one after another, and waited for something that didn't seem to be coming.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The roughly three-year depression, withdrawal, and pervasive self-doubt are documented, as is the fact that his technical skill never left him.",
      text: `This went on for years. Three of them.

Three years is a long time to believe you used to be something and aren't anymore. He grew gloomy and withdrawn. He doubted everything. The bright, certain young man was gone, and in his place was someone who flinched at the memory of that night.

People who loved him watched him sink and didn't know how to reach him. He didn't know how to reach himself.

The talent was still in there — the skill hadn't gone anywhere. But talent is useless without the one thing he had lost: the belief that anything he made was worth making.

He was a maker who could no longer make. And he was starting to think that was simply the end of his story.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "His family urged him to a doctor who used calm, daily, repeated suggestion that he would compose again; the slow return of his ability to write followed. Documented.",
      text: `Then his family talked him into seeing a certain doctor.

The doctor's method was strange and simple. Day after day, the young man would come and sit, and the doctor would talk to him in a calm, steady, certain voice. He said the same things, over and over. You will write again. The work will be good. It will come.

That was most of it. A quiet man repeating, patiently, a belief the young man could not yet hold on his own.

And slowly, it took. Something in him that had been clenched shut for three years began to loosen. One day he sat down — and a few notes came. Then a few more. Then a flood.

He wrote a new piece. And it was not just good. It poured out of him warm and enormous and alive, the way music used to.

He had it back. Someone had simply believed it for him until he could believe it again.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The comeback work became one of the most beloved in the repertoire; he dedicated it to the doctor; he became a giant of his era. Name and titles withheld for the bridge.",
      text: `That new piece became one of the most loved pieces of music ever written.

A hundred years later, people still play it, still record it, still fall in love to it. The thing he wrote crawling out of the worst years of his life turned out to be the work the world would remember him for most.

He went on writing. He became one of the great composers of his time, and one of the great players too — the kind of name that outlives everyone who knew him.

He dedicated that comeback piece to the quiet doctor who had talked him back to life.

The young man who sat in that hall convinced he was finished had more than half his music still ahead of him. He just couldn't see it from the bottom.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Sergei Rachmaninoff.

He became one of the most beloved composers in the world. The piece he wrote after three years of being unable to put down a single note — his Second Piano Concerto — is still one of the most played, most loved works in all of music. Even the disastrous symphony that nearly ended him is performed now, and admired.

Your life is not theirs. But a piece of this story may still sit beside you.

He didn't claw his way out alone. It took years, and his family, and a patient doctor who believed in his music out loud, every day, until he could believe in it himself again. The talent never left. Only the faith did — and faith can be borrowed from someone else until yours comes back.

You don't have to believe in yourself today. Let someone believe it for you for a while. He did.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1925 Savannah GA; Iowa Writers' Workshop, early career in the Northeast; Dec 1950
//    (age 25) first attack of systemic lupus - the incurable disease that had killed her father
//    when she was 15; returned to Andalusia, her mother Regina's dairy farm near Milledgeville GA;
//    steroid-weakened bones -> crutches from the mid-1950s; daily routine of Mass + ~2-3 hours
//    writing, then rest/reading; kept peafowl; ~2 novels + 32 stories across 14 ill years; major
//    posthumous stature; d.1964 age 39. (O'Connor, The Habit of Being; Gooch, Flannery.)
//  Interpretive: the internal turn - writing from inside the shortened life, the constraint
//    sharpening the work - is a fair reading of her letters. The illness is rendered honestly.
//  Avoid saying: don't name O'Connor / Georgia / book titles / Catholicism specifics before the
//    bridge. Don't sentimentalize the illness or imply suffering "made" her great in a tidy way -
//    she'd have despised that. The turn is acceptance + work, not recovery.
const oconnor: FigureStageRow = {
  figureKey: "oconnor",
  displayName: "Flannery O'Connor",
  birthYear: 1925,
  deathYear: 1964,
  stageId: "1950-1955-lupus-and-the-farm",
  stageLabel: "After the lupus diagnosis: writing as her body failed",
  ageMin: 25,
  ageMax: 33,
  themes: ["illness", "solitude", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "At twenty-five, on the edge of the literary life she had worked for, she was struck by the same incurable illness that had killed her father, and had to go home to her mother's farm to live out whatever was left.",
    "Her body slowly failed — first her strength, then her ability to walk without crutches — and she answered it by writing every single morning, for the few hours she had, year after year.",
    "She did not get better and she did not pretend she would; she simply kept making her work, on a deadline she could feel in her own bones.",
  ],
  facets: {
    emotionalCore:
      "She felt the strange clarity of a young person handed a death sentence early — robbed of the open future she had assumed, and forced to decide what a shortened life was actually for.",
    decisionShape:
      "Whether to let a failing body and a forced return home shrink her into an invalid waiting to die, or to wring real work out of the few good hours each day still left her.",
    triggerEvent:
      "Just as her career was beginning, she was diagnosed with the incurable disease that had killed her father and had to leave her independent life to be cared for on her mother's farm.",
    agencyState:
      "She had almost no control over her body or her dwindling time, but complete control over what she did with the few clear morning hours the illness allowed her.",
  },
  biographicalFacts: `Mary Flannery O'Connor was born March 25, 1925, in Savannah, Georgia. A fiercely talented young writer, she studied at the Iowa Writers' Workshop and was living and working in the Northeast, at the start of a promising literary career, when she fell ill. In December 1950, at age twenty-five, she suffered her first attack of systemic lupus erythematosus — the autoimmune disease that had killed her father when she was fifteen. The illness was incurable. She returned to Andalusia, her mother's dairy farm near Milledgeville, Georgia, where her mother, Regina, cared for her. The disease and the steroid treatments weakened her bones; from the mid-1950s she walked on crutches. She organized her days around the illness: Mass in the morning, then two or three hours of writing — all the energy she had — then rest and reading, and tending the peafowl she kept. Over fourteen years of declining health she produced two novels and some thirty-two short stories, work now considered among the finest American fiction of the century, much of it darkly comic and morally severe. She knew her time was short and worked steadily against it. She died of complications of lupus on August 3, 1964, at age thirty-nine.`,
  sources: [
    "O'Connor, Flannery. The Habit of Being: Letters of Flannery O'Connor, ed. Sally Fitzgerald (New York: Farrar, Straus and Giroux, 1979).",
    "Gooch, Brad. Flannery: A Life of Flannery O'Connor (New York: Little, Brown, 2009).",
    "O'Connor, Flannery. The Complete Stories (New York: Farrar, Straus and Giroux, 1971).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A sharp, already-noticed young writer building an independent life away from home, with a father who'd died of a rare incurable illness in her teens - all documented.",
      text: `There was a young woman. She was twenty-five.

She was a writer — a real one, the kind people had already started to notice. She had trained at a good program, moved away from the place she grew up, and was building the independent life she had always wanted, far from home.

She was sharp, and funny, and a little merciless on the page. She had decades of work ahead of her, and she knew it. The future was wide open.

She had one shadow behind her. When she was a teenager, her father had died of a rare, incurable illness. But that was his story. She was young, and just beginning hers.

She had no idea the same illness was already in her, waiting.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The diagnosis at 25 with the same incurable disease that killed her father, and the forced return to her mother's farm to be cared for, are documented.",
      text: `It hit her at twenty-five.

She got sick — strange, frightening sick — and when they finally named it, it was the same disease that had killed her father. The incurable one.

There was no fixing it. There was only managing it, and watching it take things from her slowly.

She had to leave the life she had built. The independence, the distance, the world she had moved toward — all of it. She went back home, to her mother's farm in the place she had come from, to be looked after, because she could no longer fully look after herself.

At twenty-five, she had to trade a wide-open future for a single hard fact: her body was failing, the clock was short, and she would spend what was left of it back in the place she had worked so hard to leave.

It would have been so understandable to give up.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Her documented daily discipline: a few clear morning hours of writing, all the energy the illness allowed, guarded fiercely - not writing about the illness, just writing.",
      text: `She started writing in the mornings.

That was when she had the most in her — a few hours, before the illness took the rest of the day. So she guarded those hours like treasure. Every morning, she sat down and worked.

Not for very long. The sickness only gave her so much. But she used what it gave her, completely, every single day.

She didn't write about being sick. She didn't write to be brave. She just wrote — the strange, sharp, funny, unsettling stories only she could write — because the work was hers, and the work was the point, and the work was the one thing the illness couldn't take.

A few good hours a day. She decided that was enough to build something with.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The slow physical decline, the move to crutches, and the fact that she knew she would not recover are documented. \"Working, not waiting to die\" is a fair characterization of her letters.",
      text: `The years that followed were a slow narrowing.

Her body kept failing in small steps. Her strength went. The treatments wore her down in their own way. After a while she couldn't walk without crutches, and then that was just how she got around.

She did not get better. She was never going to get better. She knew it.

And still, every morning, the few hours. Story after story. She built a whole body of work out of small daily windows, on a farm, far from the literary world, with her mother caring for her and the clock ticking loud in her own bones.

She wasn't waiting to die. She was working. There is a difference, and she lived inside it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Internal, not an event: she stopped writing as someone waiting to get her old life back and wrote from inside the life she had; the work deepened. A fair reading of her mature period.",
      text: `Somewhere in those years, something turned in her — not in her body, which kept failing, but in how she met it.

She stopped writing like someone waiting to get her real life back. She started writing like someone whose real life was this one — the farm, the crutches, the short hours, the nearness of the end.

And strangely, the work got better. Deeper. The illness had stripped away everything easy and left her with what mattered most to her, and that severity went straight into the stories. She wrote about mercy and cruelty and the human soul with a clarity most healthy people never reach, because she was writing with the clock right there in the room.

She never beat the illness. That was never on the table. What she did instead was refuse to let it have the one thing she could still give the world.

The shortened life, it turned out, was still a whole life. She just had to build it at the size she had actually been given.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Two novels and ~32 stories written in small daily windows; her stature grew enormously after her early death. Name and titles withheld for the bridge.",
      text: `She kept it up until almost the very end.

By the time the illness finally took her — far too young, still in her thirties — she had written two novels and a pile of short stories in those small, stolen morning hours.

And that work did not fade with her. It grew. Today she is considered one of the finest writers her country has ever produced. People who care about the craft study her sentences. Her strange, severe, unforgettable stories are read all over the world, decades after the few-hours-a-day woman who wrote them ran out of mornings.

She did not waste the time she was given being angry that it was short. She filled it.

A handful of clear hours a day, for a handful of years, was enough to make something that outlived her by generations.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Flannery O'Connor.

She is one of the greatest short-story writers in the history of American letters. She wrote nearly all of it in two or three morning hours a day, on her mother's farm, on crutches, dying slowly of an illness she had carried since she was twenty-five. She never got the long, open future she had planned. She made something permanent out of the short, hard one she got instead.

Your life is not theirs. But a piece of this story may still sit beside you.

She didn't pretend it wasn't bad. She didn't promise herself it would get better. She just took the few good hours each day handed her and put everything she had into them.

You don't have to have a whole, easy life ahead of you to make it count. She didn't. She used what she had.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1951 Australia; Perth physician; with pathologist Robin Warren proposed that
//    H. pylori (not stress/acid) causes most ulcers/gastritis, curable with antibiotics; the field
//    dismissed it (dogma: nothing survives stomach acid); 1983 the Australian Gastroenterological
//    Society ranked his work in the bottom tier; animal infection failed; July 1984 (age 32) he
//    drank an H. pylori broth, developed gastritis as predicted, an endoscopy confirmed it, and he
//    self-cured with antibiotics; vindicated; 2005 Nobel in Medicine with Warren. (Nobel
//    biographical; Marshall & Warren, The Lancet, 1984.)
//  Interpretive: the "right but powerless" isolation and the maddening pity. Grounded.
//  Avoid saying: don't name Marshall / Nobel / H. pylori / "ulcers" before the bridge. He is living
//    - use present tense in the reveal. Don't overstate the self-experiment as instantly decisive;
//    vindication still took time.
const marshall: FigureStageRow = {
  figureKey: "marshall",
  displayName: "Barry Marshall",
  birthYear: 1951,
  stageId: "1982-1984-drinking-the-proof",
  stageLabel: "Mocked for the theory: the year he drank the proof",
  ageMin: 31,
  ageMax: 34,
  themes: ["dismissed", "quiet_defiance", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He was a young doctor with an unfashionable idea about what made people sick, and the experts laughed it out of the room for years.",
    "He had the evidence and could not make anyone look at it, so in the end he did something reckless to his own body to force them to.",
    "He swallowed a dose of the very thing everyone insisted was harmless, got sick exactly the way he had predicted, and dared them to keep ignoring him.",
  ],
  facets: {
    emotionalCore:
      "He felt the maddening isolation of being right in a room full of people certain you are a fool — where the more sure you are, the more they pity you.",
    decisionShape:
      "Whether to keep politely losing the argument and let patients go on suffering for a dogma he knew was wrong, or to do something drastic enough that the experts could no longer look away.",
    triggerEvent:
      "His evidence that a common, miserable illness had a simple, curable cause was rejected and ridiculed by his field, which held firmly to a different explanation.",
    agencyState:
      "He had the truth and the data but no authority and no audience; the one body he was completely free to experiment on was his own.",
  },
  biographicalFacts: `Barry James Marshall was born September 30, 1951, in Australia. As a young physician in Perth, working with the pathologist Robin Warren, he became convinced that most stomach ulcers and gastritis were caused not by stress or excess acid — the settled medical wisdom — but by a bacterium, Helicobacter pylori, that could be eradicated with antibiotics. The medical establishment dismissed the idea; it was a fixed belief that no bacteria could survive the acid of the stomach. In 1983 the Australian Gastroenterological Society rejected his research, ranking it in the bottom tier of submissions. His attempts to infect animals failed, and he could not ethically infect patients. Frustrated, and unable to get the field to take him seriously, in July 1984, at age thirty-two, Marshall drank a broth teeming with H. pylori. Within days he developed nausea, vomiting, and gastritis; an endoscopy confirmed that his stomach was inflamed and colonized exactly as he had predicted. He then cured himself with antibiotics. The self-experiment helped turn the tide. Marshall and Warren were eventually vindicated, and in 2005 they were awarded the Nobel Prize in Physiology or Medicine. Stomach ulcers, once a chronic, recurring misery for millions, are now routinely cured.`,
  sources: [
    "\"Barry J. Marshall - Biographical,\" The Nobel Prize, nobelprize.org.",
    "Marshall, B. J., and J. R. Warren. \"Unidentified curved bacilli in the stomach of patients with gastritis and peptic ulceration.\" The Lancet (1984).",
    "Marshall, Barry, ed. Helicobacter Pioneers (Oxford: Blackwell, 2002).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A junior doctor far from elite centers, with a colleague, proposing a cause for a common painful illness that contradicted a century of textbooks - all documented.",
      text: `There was a young doctor. He was in his early thirties.

He worked in a hospital far from the famous centers of medicine, and he had gotten an idea into his head. He had noticed something, with a colleague, about why a very common and very painful illness happened — and what he saw didn't match what every textbook and every senior doctor said was true.

The textbooks said the illness came from stress and worry. He thought they were wrong. He thought the real cause was something small and fixable, and that millions of people were suffering for no good reason.

He was probably right. He had the beginnings of proof.

The trouble was, he was nobody. Young. Unknown. From the wrong place. And he was telling the most powerful people in his field that they had had it wrong for a hundred years.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The establishment's dismissal, the specialist society ranking his work near the bottom, and his failed (ethically limited) attempts to prove it are documented. The anguish of being right and ignored is the through-line.",
      text: `They did not take it well.

He brought his evidence to the experts, and they brushed it off. It went against everything they knew, so they decided he was the one who was confused. A famous society of specialists looked at his work and ranked it near the very bottom of everything they received that year.

People in his field smiled at him the way you smile at someone who doesn't understand how things really work. He would stand up to make his case and watch the room decide, before he finished, that he wasn't worth listening to.

He knew he was right. That was the worst part. It is one thing to be wrong and rejected. It is another to be right and rejected — to watch people keep suffering from a thing you could fix, while everyone who could help pats you on the head and moves on.

He tried to prove it properly. The experiments he was allowed to do didn't work. He was stuck.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Unable to prove it on animals or ethically on patients, he chose to infect himself. Documented. The quiet, private decision is fairly characterized.",
      text: `So he made a decision most people would call insane.

If he couldn't prove it on anyone else, he would prove it on the only person he was completely free to risk. Himself.

He took the thing everyone swore was harmless — the small thing he believed was the real cause — and he swallowed a whole dose of it on purpose.

Then he waited to get sick.

He didn't tell many people first. He just did it, quietly, and watched his own body to see who was right: him, or a hundred years of medicine.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "He developed gastritis on schedule, documented it, cured himself, and kept pushing; one self-experiment did not instantly convert the field. All documented.",
      text: `It worked, in the worst possible way. He got sick — exactly the way he had predicted. Nausea. Throwing up. His stomach inflamed and overrun, right on schedule.

He had made himself ill to win an argument. And even then, it wasn't instant. One man poisoning himself doesn't flip a whole field overnight. There were still doubters. Still people who didn't want to admit that someone so junior, so far from the center of things, had seen what they had all missed.

He cured himself, wrote up exactly what had happened, and kept pushing. He had put his own body on the line, and he was not about to let them ignore it now.

Slowly, the evidence became impossible to wave away.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "As others tested the theory, the simple antibiotic cure worked and the dogma fell. Documented. \"A fact doesn't care how junior you are\" is editorial framing of a real shift.",
      text: `The thing about a fact is that it doesn't care how junior you are.

Other doctors started testing his idea. And it held. Patients with the painful illness got the simple treatment he had proposed, and they got better — really better, not just for a while. The thing the experts had only ever managed for a lifetime, he had a way to actually cure.

Once that became clear, the argument was over. Not because he had shouted loudest, but because he had been right, and being right, in the end, was enough.

The young nobody from the wrong place had seen something the whole field had missed. And he had been willing to drink poison to make them look at it.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "He earned his field's highest honor; the illness became routinely curable; countless people benefited. Name and prize withheld for the bridge.",
      text: `He became one of the most respected people in his field — the same field that had laughed at him.

The illness that used to torment millions of people for years on end became, thanks to him, a thing a doctor could simply cure. People who will never know his name live easier lives because he refused to back down.

And he won the highest prize his science can give. The man they had ranked at the bottom ended up at the very top.

He hadn't been crazy. He had just been early, and stubborn, and unwilling to let a comfortable lie stand when he had the truth in his hands.

Sometimes the whole room is wrong. Sometimes the person they are laughing at is the one who is right.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name is Barry Marshall.

He proved that most stomach ulcers are caused by a bacterium, not by stress — and that they can be cured with antibiotics. For years the medical world mocked him, until he drank a flask of the bacteria himself to prove it. In 2005 he and his colleague won the Nobel Prize. Because of them, an illness that ruined millions of lives is now a quick fix.

Your life is not theirs. But a piece of this story may still sit beside you.

For a long time, being right got him nothing but pity and closed doors. He didn't have power, or fame, or important friends. He just had the truth, and enough stubbornness to keep holding it up until the world finally looked.

Being doubted by everyone is not the same as being wrong. He would tell you that himself.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1942 Lima, Peru, Chilean family, journalist in Chile; Sept 1973 military coup
//    overthrew her relative, Chile's president Salvador Allende, who died; she fled to Venezuela in
//    1975 with husband and two children; ~13 years of exile in Caracas, disoriented, scarce work;
//    on 8 Jan 1981 she began a letter to her dying ~100-year-old grandfather that became The House
//    of the Spirits; rejected by several publishers, published Barcelona 1982, an international
//    bestseller; one of the most-read Spanish-language authors; still starts each book on Jan 8.
//    (Allende, Paula; My Invented Country; isabelallende.com.)
//  Interpretive: exile as loss-of-self (not just homesickness); "saving up what she'd need."
//    Grounded in Paula.
//  Avoid saying: don't name Allende / The House of the Spirits / Chile / the coup date / Salvador
//    before the bridge. Soften the political specifics (no date, no president's name) the way the
//    Douglass slavery material is softened. She is living - present tense in the reveal.
const allende: FigureStageRow = {
  figureKey: "allende",
  displayName: "Isabel Allende",
  birthYear: 1942,
  stageId: "1975-1981-exile-to-the-letter",
  stageLabel: "Exile: losing her country and finding her voice in a borrowed one",
  ageMin: 33,
  ageMax: 40,
  themes: ["exile", "self_invention", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "A violent overthrow of her country's government forced her to flee with her family to a place that would never feel like home, and for years she was a stranger with no country and no clear self.",
    "She had been someone back home — she had work and a name and a place — and exile stripped all of it away and left her starting from nothing in her late thirties.",
    "What gave her back to herself was a letter, written to a dying old man she could not reach, that quietly turned into the thing she was meant to do all along.",
  ],
  facets: {
    emotionalCore:
      "She felt the particular grief of exile — not just missing a place, but losing the whole scaffolding of who she had been, and not knowing who she was without her country holding her up.",
    decisionShape:
      "Whether to spend her exile waiting to return to the life that was taken, or to accept it was gone and build an entirely new self in a country that was not hers.",
    triggerEvent:
      "Political violence destroyed the country she knew and made it unsafe to stay, so she fled abroad with her family and lost her home, her work, and her sense of who she was.",
    agencyState:
      "She had lost almost everything outside her control — country, safety, standing — and was left with only what she could make from the inside: words, memory, and the choice to begin again.",
  },
  biographicalFacts: `Isabel Allende was born August 2, 1942, in Lima, Peru, into a Chilean family, and grew up in Chile, where she became a journalist. In September 1973 a military coup overthrew the government of her relative, Chile's president, who died during the takeover. The country became dangerous, especially for those connected to the fallen government; in 1975 Isabel fled with her husband and two children to Venezuela, where she lived in exile in Caracas for thirteen years. Exile was disorienting and lonely: she struggled to find journalism work and felt she had lost her country and her footing. On January 8, 1981, hearing that her beloved grandfather, nearly a hundred years old, was dying back in Chile, she began writing him a letter she knew he would never read. The letter kept growing, filling with the family stories and the memories of the country she had lost, and it became a novel — The House of the Spirits. Rejected by several Spanish-language publishers, it was published in Barcelona in 1982 and became an international sensation. Allende went on to become one of the most widely read Spanish-language authors in the world. To this day she begins every new book on January 8th.`,
  sources: [
    "Allende, Isabel. Paula (New York: HarperCollins, 1995).",
    "Allende, Isabel. My Invented Country: A Nostalgic Journey Through Chile (New York: HarperCollins, 2003).",
    "\"Isabel Allende,\" biography and interviews, isabelallende.com.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A journalist with a settled life in her home country, and a deeply loved near-centenarian grandfather full of stories - documented. Place and names withheld for the bridge.",
      text: `There was a woman in her thirties.

In the country where she grew up, she had a life. A real one. She had work she was good at — she wrote, and people read what she wrote. She had a family, a home, a place she belonged. She knew who she was there.

She had a grandfather she loved more than almost anyone. An old man, full of stories, who had helped raise her. He was part of what made the place home.

She thought she would grow old there, near him, in the country that had made her.

She had no idea how quickly all of it could be taken away.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The coup, a relative who led the country killed in it, the danger, and the flight abroad with her family are documented. Political specifics softened per the no-era-markers rule.",
      text: `Then her country fell apart.

There was a violent overthrow of the government — soldiers, fear, people disappearing. Someone close to her family, who had led the country, was killed in it. Overnight, the place she knew became a place where it was dangerous to be who she was.

She had to run. She gathered her husband and her children and fled across borders to another country — a safer one, but not hers. Not even close.

And there, the full weight of it landed. She had lost her home. Her work. Her language of belonging. The grandfather she loved was back there, out of reach, and she could not go to him.

She was a grown woman starting over from nothing, in a place that would always look at her as a stranger. She didn't know who she was anymore, without the country that used to hold her up.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She held her family together, took what scarce work she could in exile, and kept the lost country alive in memory. Documented in Paula. \"Saving up what she'd need\" is editorial foreshadowing.",
      text: `She did what she could to hold on.

She kept her family together. She took what work she could find, which wasn't much, and wasn't hers. She made a kind of life in the borrowed country, the way exiles do — functional on the outside, homesick all the way down.

And she held onto the place she had lost the only way she could: in her head. She remembered it. The streets, the smells, the family stories, the old man and his hundred years of tales. She kept it all alive inside her, because keeping it was the only thing that still connected her to who she had been.

She didn't know it yet, but she was saving up everything she would need.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The long, disorienting years of exile and loss of professional identity are documented. The dissolving sense of self is a fair reading of her account.",
      text: `The years went by like that. A lot of them.

She was not back home, and she was not really at home where she was. She lived in the in-between place that exiles know — always a little foreign, always a little homesick, the old life receding a bit more each year.

She was in her late thirties now. The work she had been known for felt like another person's life. If you had asked her what she was, she might not have had a clean answer anymore. The country that used to tell her who she was, was gone. And nothing had come to replace it.

She kept going. But she was, in a real way, lost.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "On 8 Jan 1981 she began a letter to her dying grandfather she could not reach; it grew into The House of the Spirits. Documented. The pouring-out of exile's stored memory is well-grounded.",
      text: `Then word came that her grandfather — the old man, the keeper of all the stories — was dying, far away, where she could not go.

She couldn't be with him. She couldn't even reach him in time. So she did the only thing she could. One night, she sat down and started writing him a letter.

She wrote to him about the family. The country. The old stories he used to tell. Everything she had been carrying around inside her through all those exiled years came pouring out onto the page, for him.

And the letter didn't stop. It grew, and grew, past anything a letter should be. Night after night she wrote, and the memories became people, and the people became a story.

By the time she looked up, the letter to a dying man had become something else entirely. It had become a book. And in writing it, the lost woman had found, at last, exactly what she was for.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The book became an international bestseller; she became one of the most-read authors in her language; she still starts each book on the same January date. Documented. Name/title withheld for the bridge.",
      text: `That book made her.

The thing she had written to hold onto a country she had lost turned out to speak to people everywhere. It was published, and then it was everywhere, and the stranger in the borrowed country became one of the most read writers in her language anywhere in the world.

She had found the work she was actually born for — not back home, where she had her old comfortable life, but in exile, with everything stripped away, when she had nothing left but her memories and a page.

She kept writing. Book after book, for decades. To this day she starts every new one on the same date: the night she sat down to write that first letter to a dying old man.

The country took everything from her. And in the taking, it forced her to find the thing that had been hers all along.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name is Isabel Allende.

She is one of the most widely read writers in the Spanish language — tens of millions of books, in dozens of languages. And she didn't begin until she was almost forty, in exile, after a coup tore apart her country and forced her family to flee. The novel that started it all began as a letter to her dying grandfather, written in a country that wasn't hers.

Your life is not theirs. But a piece of this story may still sit beside you.

She lost her home, her work, and her sense of who she was. For years she was nobody, in a place that wasn't hers. And it was exactly there, with everything familiar stripped away, that she finally found what she was made to do.

Losing the old life is not the same as losing yourself. Sometimes it is how you finally find yourself. She did.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1895 Vermont; WWI vet, 1920s Wall Street speculator; severe alcoholic - ruined
//    finances, health, and his marriage to Lois; repeated stays at the Towns Hospital under Dr.
//    Silkworth (alcoholism-as-disease); his newly-sober friend Ebby Thacher visited him; last drink
//    11 Dec 1934 (age 39) amid a sudden overwhelming experience that lifted the obsession; realized
//    he stayed sober by helping other alcoholics; May/June 1935 in Akron he sought out Dr. Bob
//    Smith and helped him get sober - the founding of AA; co-wrote the "Big Book" and the Twelve
//    Steps; known publicly only as "Bill W." per the anonymity tradition; d.1971. (AA "Big Book";
//    "Pass It On"; Cheever, My Name Is Bill.)
//  Interpretive: the shame-of-the-addict interior and "connection, not willpower." The "something
//    gave/shifted" deliberately under-specifies his spiritual experience (which he described
//    variously) - do not over-religious it.
//  Avoid saying: don't name AA / "Alcoholics Anonymous" / the Twelve Steps / Bill / Dr. Bob before
//    the bridge. The reveal leans on the anonymity ("Bill W.") - keep that payoff. Don't moralize
//    about addiction; render it as the compulsion/disease the record describes.
const wilson: FigureStageRow = {
  figureKey: "wilson",
  displayName: "Bill Wilson",
  birthYear: 1895,
  deathYear: 1971,
  stageId: "1934-1935-rock-bottom-to-the-fellowship",
  stageLabel: "Rock bottom: the last drink and the thing that kept him sober",
  ageMin: 38,
  ageMax: 40,
  themes: ["addiction", "shame", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He was a grown man whose drinking had wrecked his career, his health, and nearly his marriage, and who had failed to stop so many times that he had run out of reasons to believe he ever could.",
    "Lying in a hospital bed, ashamed and hopeless, he finally surrendered the fight to control it on his own.",
    "What kept him sober turned out not to be willpower but other people — he discovered he could stay dry by helping the next person who was drowning the way he had been.",
  ],
  facets: {
    emotionalCore:
      "He carried the specific despair of the addict who has broken every promise to quit — the shame of knowing exactly what he is doing to the people he loves and doing it anyway, and the terror that he is simply beyond help.",
    decisionShape:
      "Whether to keep believing he could white-knuckle his way to control on his own, as he had failed to do for years, or to admit total defeat and try something that required surrendering and leaning on others.",
    triggerEvent:
      "Years of worsening alcoholism had destroyed his work and his health and brought him to repeated hospitalizations, until he hit a bottom from which he could see no way out.",
    agencyState:
      "He had almost no power over the drink — that was the whole problem — and the only move left was the paradoxical one: to stop relying on his own strength, reach for help, and then offer it to someone else.",
  },
  biographicalFacts: `William Griffith Wilson was born November 26, 1895, in East Dorset, Vermont. A veteran of the First World War, he became a Wall Street stock speculator in the 1920s. He was also a severe alcoholic, and his drinking grew steadily worse, wrecking his finances, his health, and his marriage to his wife, Lois. Through the early 1930s he was hospitalized repeatedly at the Charles B. Towns Hospital in New York under Dr. William Silkworth, who taught him that alcoholism was a kind of disease rather than a moral failing. An old drinking friend, Ebby Thacher, who had gotten sober, visited Wilson and showed him it was possible. On December 11, 1934, drunk and despairing during his final hospital stay, Wilson had a sudden, overwhelming experience that lifted his obsession to drink; he never drank again. He came to believe he stayed sober by carrying the message to other alcoholics. In May 1935, on a failed business trip to Akron, Ohio, terrified he would drink, he sought out another struggling alcoholic — a local surgeon, Dr. Bob Smith — and helped him get sober. Their meeting is considered the founding of Alcoholics Anonymous, which Wilson co-created and which grew into a worldwide fellowship that has helped many millions of people recover. He wrote the book and the twelve steps at its core, and, honoring its tradition of anonymity, was known publicly only as "Bill W." He died January 24, 1971.`,
  sources: [
    "Alcoholics Anonymous (the \"Big Book\"), 1st ed. (New York: Works Publishing, 1939).",
    "\"Pass It On\": The Story of Bill Wilson and How the A.A. Message Reached the World (New York: A.A. World Services, 1984).",
    "Cheever, Susan. My Name Is Bill: Bill Wilson - His Life and the Creation of Alcoholics Anonymous (New York: Simon & Schuster, 2004).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A once-promising, ambitious man whose alcoholism cost him work and health and was destroying his marriage, with a long history of broken promises to quit - all documented.",
      text: `There was a man. He was in his late thirties.

Once, he had been on his way up — sharp, ambitious, good at his work, married to a woman who believed in him. But there was a thing that had its hooks in him, and the thing was winning.

He drank. Not the way some people drink. The way that takes everything. It had cost him his work. It was costing him his health. It was breaking the heart of the woman who loved him, slowly, in front of his own eyes.

He had promised to stop more times than he could count. He had meant it every time. And every time, he had ended up back in the same place, with a glass in his hand and a fresh load of shame on his back.

He was starting to believe he was simply beyond help.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Repeated hospitalizations, the despair and shame of relapse, and the collapse of the belief that willpower could fix it are documented. The bottom precedes his recovery experience.",
      text: `He ended up in a hospital. Again.

It wasn't the first time. The doctors there knew him. They had dried him out before, and watched him walk out and come right back. He knew what they must think of him. He thought worse of himself.

Lying in that bed, he hit the bottom of everything. He had tried so hard, for so long, to control this on his own — to be strong enough, to want it badly enough — and he had failed, over and over and over. The shame of it was crushing. He had become a man who hurt the people he loved most, knew it, and couldn't stop.

There was nothing left of his pride. Nothing left of the idea that he could fix himself by simply trying harder.

He was completely, utterly out of his own ideas.

And it was right there, with nothing left, that something finally gave.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His surrender of the willpower model, and the influence of a newly-sober friend who showed recovery was possible by leaning on others, are documented. The spiritual experience is left under-specified on purpose.",
      text: `He stopped fighting it alone.

That was the strange key. For years he had treated this as a battle of willpower — him against the drink — and he had lost every round. Now, with no strength left, he gave up the idea that his own strength was the answer.

And he latched onto something a friend had shown him. This friend had been just as far gone, and had gotten sober — not by being tougher, but by leaning on other people and on something bigger than himself.

The man in the bed grabbed that idea the way a drowning person grabs a rope.

He didn't drink that day. Or the next. Something had shifted that he couldn't fully explain. The endless craving had, for now, let go of him.

But he knew himself. He knew it could come back. He needed something to keep it away.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The fragility of early sobriety and the dangerous Akron business trip where he feared he would drink are documented and set up the turn.",
      text: `Staying sober, it turned out, was its own daily fight.

The first days are one thing — the real test is the ordinary afternoon, weeks later, when the old pull comes back quiet and reasonable and tells you one won't hurt.

He white-knuckled through it. He held on. But he could feel how fragile it was. He was one bad night away from losing everything he had just barely gotten back.

Then came a trip away from home that went badly. A deal fell through. He was alone, discouraged, in a strange town — exactly the kind of moment that had always sent him to the bottle.

He could feel it coming for him. The craving, rising. He knew, standing there, that his sobriety — and maybe his life — was about to come down to what he did in the next hour.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Instead of drinking, he sought out another struggling alcoholic (Dr. Bob Smith) to help, and found that helping kept him sober - the core insight and the founding moment. Documented.",
      text: `So he did something that didn't quite make sense.

Instead of looking for a drink, he went looking for another person like himself. Another hopeless case. Someone else who was drowning in the exact same way.

He found one — a man in that town who was deep in it, just as he had been. And he sat with that man, and talked to him, not as an expert with answers but as one drunk to another. I have been where you are. Here is what is helping me.

And here is the thing he discovered: helping that man helped him. Sitting with someone else's struggle kept his own craving at bay better than willpower ever had. In trying to save another person, he saved himself.

That was the secret. Not strength. Connection. One person who had been there, reaching for the next.

He didn't drink that day. Because he spent it helping someone else not drink.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The fellowship grew from that first pairing into a worldwide movement that has helped millions; he stayed sober for life. Name and the fellowship withheld for the bridge.",
      text: `That one conversation became two. Then a small group. Then more.

He and the man he had helped started finding others — building a fellowship of people who had all been to the bottom, who stayed sober by being honest with each other and helping the next person through the door. No experts. No shame. Just people who had been there, holding the rope for the ones still in the water.

It grew. Slowly at first, then beyond anything he could have imagined. The simple thing he had stumbled into — one wrecked person helping another — spread across the country, and then the world.

Millions of people who thought they were beyond help got their lives back through the thing he started in a hospital bed and a stranger's living room.

He stayed sober the rest of his life. And he did it the same way he had that first day: by helping the next person who couldn't.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was William Wilson — though almost everyone who knows what he built knows him only as Bill W.

He founded Alcoholics Anonymous. The thing he discovered — that people who have hit bottom can stay sober by helping each other, one day at a time — has saved the lives of many millions of people, and the fellowship he started is now all over the world. He kept his last name private on purpose, because he believed the help mattered more than any one person's fame.

Your life is not theirs. But a piece of this story may still sit beside you.

He didn't beat the thing that was destroying him by being strong. He beat it by admitting he couldn't do it alone, and then by reaching for someone else who was struggling too.

You don't have to carry it by yourself. He couldn't either. That turned out to be the way through — not the thing to be ashamed of.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1949 NYC; serious competitive figure skater who failed to make the US Olympic
//    team; joined Vogue at 23, 17 years there, rose to senior fashion editor; 1987 passed over for
//    editor-in-chief (it went to Anna Wintour), left; ~2 years as a Ralph Lauren design director;
//    around her own wedding at 40, unable to find a dress she loved, she designed her own and opened
//    her first bridal boutique in 1990 (age 41); became a world-famous bridal/fashion designer; the
//    skating discipline and the editor's eye both fed the design career. (Wang, Vera Wang on
//    Weddings; WWD and Vogue profiles.)
//  Interpretive: "two near-misses, then a third start"; the flat grief of doing everything right and
//    still not getting the thing. Grounded.
//  Avoid saying: don't name Wang / Vogue / wedding dresses / the skating-Olympics / Wintour before
//    the bridge. She is living - present tense in the reveal. The skating + magazine + bridal combo
//    IS the reveal; keep them generic ("a sport," "a well-known company") until then.
const wang: FigureStageRow = {
  figureKey: "wang",
  displayName: "Vera Wang",
  birthYear: 1949,
  stageId: "1987-1990-passed-over-to-the-pivot",
  stageLabel: "Twice the plan failed: passed over, then starting over at forty",
  ageMin: 38,
  ageMax: 41,
  themes: ["late_start", "self_invention", "public_failure"],
  antiThemes: [],
  shapeSentences: [
    "Twice she committed her whole self to a path — first a sport, then a career — and twice the door she had worked toward for years closed in her face.",
    "After almost two decades at a company, she was passed over for the top job she had earned, and walked away with nothing to show for the climb.",
    "She didn't find the work she would be known for until she was forty, in a field she had never worked in, starting from scratch.",
  ],
  facets: {
    emotionalCore:
      "She felt the flat, disorienting grief of doing everything right and still not getting the thing — of looking up in mid-life and realizing the path you bet on simply is not going to open.",
    decisionShape:
      "Whether to accept that her best years and chances were behind her after two long roads led nowhere, or to start over a third time, from zero, in something completely new and late.",
    triggerEvent:
      "After failing years earlier to reach the top of the sport she had trained for, she spent nearly two decades climbing at a company — and was then passed over for the leadership job she had worked toward.",
    agencyState:
      "She had talent, taste, and a long resume, and none of it had delivered the thing she wanted; what she still controlled was whether to risk starting a brand-new career when it felt far too late.",
  },
  biographicalFacts: `Vera Ellen Wang was born June 27, 1949, in New York City. She was a serious competitive figure skater as a young woman, training for years, but she failed to make the U.S. Olympic team and gave up the sport. She turned to fashion, joining Vogue magazine at twenty-three. She worked there for seventeen years and rose to senior fashion editor, but in 1987 she was passed over for the editor-in-chief position — which went to Anna Wintour — and left the magazine. She spent about two years as a design director for Ralph Lauren. Then, around the time of her own wedding at the age of forty, frustrated that she could not find a wedding dress she loved, she decided to design her own and to start her own bridal business. She opened her first boutique in 1990, at forty-one. Vera Wang became one of the most famous and influential bridal and fashion designers in the world, dressing brides, celebrities, and Olympic figure skaters. Her two earlier "failures" — the skating and the magazine — both fed the career she finally found: a designer with an athlete's discipline and an editor's eye, who didn't begin her real life's work until middle age.`,
  sources: [
    "Wang, Vera. Vera Wang on Weddings (New York: HarperCollins, 2001).",
    "\"How Vera Wang Went From Ice Skater to Top Bridal Designer,\" WWD (career feature).",
    "Career-pivot profiles in Vogue and The Cut.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A young woman who trained for years at a competitive sport and aimed at its highest level, then failed to make the top team - documented. The sport is left unnamed for the bridge.",
      text: `There was a woman who had spent her whole young life chasing one dream.

A sport. She had trained at it since she was a girl — hours on end, year after year, the way you only train for something you intend to be great at. It was who she was. When people asked what she did, that was the answer.

She was good. Good enough to compete at a high level. Good enough to believe the very top was within reach.

And then she tried out for the highest level of all — the one she had aimed at her entire childhood.

She didn't make it.

Just like that, the thing she had organized her whole young life around was over. The door she had been running toward shut, and she was standing on the wrong side of it, wondering what on earth she was supposed to do now.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "A second career built over ~17 years at a well-known company, rising to a senior role, then being passed over for the top job - documented. Company unnamed for the bridge.",
      text: `She picked herself up and built a second life.

She found a new field, nothing like the first, and she was good at this too. She joined a well-known company and worked her way up — year after year, climbing, proving herself, getting closer to the top.

She gave it almost two decades. She earned the next step. When the big job finally opened — the one she had spent seventeen years working toward — she was an obvious choice.

They gave it to someone else.

After all that time, all that work, she was passed over. The top of this mountain, too, turned out to be a door that closed in her face.

She left. And there she was, no longer young, with two long roads behind her that had each led almost to the summit and then stopped. Twice now she had given everything to a path. Twice it had not opened.

What do you even do with that?`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She took further work in the same field (a design role elsewhere) while still searching for her own thing, approaching forty - documented. The \"too late\" pressure is a fair reading.",
      text: `She didn't fall apart. She kept moving.

She took another job in the same world, working for someone else, learning more of the craft. It was good work. It just wasn't hers. She was still, at heart, a person looking for the thing that was actually hers — and running low on time to find it, or so the world kept telling her.

She was approaching forty. In the fields she had worked in, that was supposed to be late. The big dreams were supposed to be behind her now. The sensible thing was to settle, to be grateful for a good-enough career, to stop reaching.

She wasn't quite ready to stop reaching.

She just didn't know yet what she was reaching for.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The mid-life in-between - competent but unfulfilled, and old by her industries' standards - is a fair characterization of this period before the pivot.",
      text: `For a while she lived in that in-between place.

Good at her work, but not in love with it. Successful enough on paper, but quietly certain she hadn't yet done the thing she was meant to do. And old enough, by the rules of her industries, to wonder if she had missed her shot entirely.

It is a particular kind of hard — not dramatic, just heavy. You did everything right. You worked, you climbed, you were good. And somehow the life you pictured never quite arrived, and now there's a clock on it, and a voice that says maybe this is just how it stays.

She carried that around. Two near-misses behind her, forty ahead of her, and no clear idea what came next.

And then the answer came from the most ordinary place imaginable.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Planning her own wedding at ~40, unable to find a dress she loved, she designed her own and decided to start her own business in a field she'd never worked in - documented.",
      text: `She was getting married.

And when she went looking for a dress for her own wedding, she couldn't find one she loved. Everything out there felt wrong to her — and she had spent a whole career around taste and style, so she knew exactly what she wanted and exactly why nothing measured up.

So she designed her own.

And somewhere in doing that — in making the thing she couldn't find — something clicked that two whole careers never had. This. This was it. The taste she had built in one field, the discipline she had built in the other, all of it suddenly had somewhere to go.

At an age when she was supposed to be winding down, she decided to start something brand new. Her own business. In a field she had never actually worked in. From scratch.

Everyone might have called it late. She called it the beginning.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The business she started at ~40 made her one of the most famous names in her industry, and both prior \"failures\" turned out to be the training it required. Name/field withheld for the bridge.",
      text: `It worked. Spectacularly.

The thing she started at forty, in a field she had entered as a beginner, made her one of the most famous names in her whole industry. People all over the world know her work. The two failures that had broken her heart — the sport, the company — turned out to be the exact training she needed: one gave her discipline, the other gave her eye, and the new work demanded both.

Nothing was wasted. Not the years on the first dream that didn't happen. Not the long climb at the company that passed her over. It all fed the thing she finally became, the thing that had been waiting for her on the other side of forty.

She had spent half her life sure she had missed her moment.

Her moment hadn't come yet. That was all.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name is Vera Wang.

She is one of the most famous fashion designers in the world, known above all for her wedding dresses. And she didn't design her first one until she was forty. Before that, she had failed to make the Olympic figure-skating team as a young woman, and then spent seventeen years at a magazine only to be passed over for the top job. Both of those heartbreaks became the foundation of the career that made her famous.

Your life is not theirs. But a piece of this story may still sit beside you.

Twice she gave everything to a path and watched it close. She could have decided, very reasonably, that her chances were behind her. Instead she started over, at forty, at something new — and that one was hers all along.

It is not too late, and the roads that didn't work were not wasted. Hers weren't. They were the training.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1888; Los Angeles oil-company executive (Dabney Oil Syndicate); drinking,
//    absenteeism, and affairs during the Depression; fired in 1932 at age 44; broke, he taught
//    himself pulp writing by studying and imitating Erle Stanley Gardner; first story "Blackmailers
//    Don't Shoot" in Black Mask, 1933; first novel The Big Sleep, 1939 (age 51), introducing the
//    detective Philip Marlowe; became a master of hard-boiled crime fiction and a Hollywood
//    screenwriter (Double Indemnity); d.1959. (Chicago Public Library biography; Hiney, Raymond
//    Chandler: A Biography.)
//  Interpretive: the midlife shame of self-inflicted failure; "the only door left." Grounded.
//  Avoid saying: don't name Chandler / Marlowe / The Big Sleep / detective fiction before the
//    bridge. Don't moralize the drinking (Wilson is the addiction figure) - here it's context for
//    the firing, and the through-line is the late reinvention.
const chandler: FigureStageRow = {
  figureKey: "chandler",
  displayName: "Raymond Chandler",
  birthYear: 1888,
  deathYear: 1959,
  stageId: "1932-1939-fired-to-the-first-novel",
  stageLabel: "Fired at forty-four: teaching himself a new craft in the wreckage",
  ageMin: 44,
  ageMax: 52,
  themes: ["late_start", "public_failure", "self_invention"],
  // Eval-surfaced confusion (2026-07-02 challenger run): users trapped in a life IMPOSED by
  // others ("stuck in the wrong life", "everyone expected") retrieved Chandler at Stage-B #1
  // over Glessner Lee. His episode is the opposite trap — a chosen career wrecked by his own
  // hand — so a social_constraint signal in the user's words votes against him, never excludes.
  antiThemes: ["social_constraint"],
  shapeSentences: [
    "He wrecked a good executive career through his own drinking and got fired at forty-four, in the worst economy of his life, when starting over was supposed to be impossible.",
    "Broke and middle-aged, he taught himself an entirely new craft from scratch, studying cheap magazines like a schoolboy because it was the only door left.",
    "He did not publish the first real book of his new life until he was fifty-one — and it turned out to be the start of everything he is remembered for.",
  ],
  facets: {
    emotionalCore:
      "He felt the particular shame of a grown man who had held a good life and thrown it away himself, now staring at middle age with nothing to show and every rule saying it was too late to begin again.",
    decisionShape:
      "Whether to accept that his best years were spent and wasted, or to start over as a rank beginner in a brand-new craft at an age when that is supposed to be foolish.",
    triggerEvent:
      "He lost his executive job to his own drinking and unreliability in the depths of the Great Depression, leaving him middle-aged, broke, and effectively unemployable.",
    agencyState:
      "He had no career, no prospects, and a bad reputation, but he still had a desk, some time, and a long-buried hunch that he might be able to write — the one thing nobody could take.",
  },
  biographicalFacts: `Raymond Thornton Chandler was born July 23, 1888. After an unsettled early life he became a successful executive in the Los Angeles oil business, rising to a vice presidency at the Dabney Oil Syndicate. During the Great Depression his heavy drinking, absenteeism, and affairs caught up with him, and he was fired in 1932, at age forty-four. Broke and middle-aged in a collapsed economy, he turned to a long-latent ambition and taught himself to write pulp fiction — reportedly by closely studying and imitating a novelette by Erle Stanley Gardner. His first story, "Blackmailers Don't Shoot," appeared in the pulp magazine Black Mask in 1933, when he was forty-five, for very little money. He published more stories through the 1930s, sharpening his style, and in 1939, at age fifty-one, published his first novel, The Big Sleep, introducing the private detective Philip Marlowe. Chandler went on to become one of the most influential crime writers in the English language, elevating hard-boiled detective fiction into literature, and later a celebrated Hollywood screenwriter (co-writing Double Indemnity). He died in 1959.`,
  sources: [
    "Hiney, Tom. Raymond Chandler: A Biography (London: Chatto & Windus, 1997).",
    "MacShane, Frank. The Life of Raymond Chandler (New York: E. P. Dutton, 1976).",
    "\"Raymond Chandler Biography,\" Chicago Public Library.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A successful oil-industry executive whose drinking and unreliability were unraveling a respectable career is documented. The complacency is a fair reading.",
      text: `There was a man in his early forties.

On paper, he had made it. He was an executive at a company — a good job, a real salary, the kind of position people respected. He wore the suit. He had the office.

But he was coming apart underneath it. He drank, more and more. He stopped showing up. He had been good at the work once, but he had lost interest in it, and it showed.

He was the kind of man other men pointed to as a cautionary tale — talented, well-paid, and quietly throwing it all away.

He probably told himself he had plenty of time to pull it together.

He was about to find out he didn't.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Fired at 44 in the depths of the Depression, with the resulting unemployability of a middle-aged man with a bad reputation, is documented. The shame is editorial but well-grounded.",
      text: `They fired him.

At forty-four, in the middle of the worst economy the country had seen, he lost the good job and everything that came with it.

The timing could not have been worse. There was no work out there. Men far younger and steadier than him were standing in lines for anything at all. And here he was — middle-aged, with a drinking problem and a reputation for being unreliable, looking for someone to take a chance on him.

No one was going to.

He had spent his best years climbing a ladder that had just been kicked out from under him. He was too old to start over, by every rule anyone knew. He had a wife to support and almost nothing coming in.

He sat with the particular shame of a grown man who'd had it all and lost it through his own fault.

He had to do something. He had no idea what.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "He taught himself to write pulp fiction by closely studying and imitating an existing writer's work - documented. \"A beginner again at forty-five\" is accurate.",
      text: `So he tried something almost embarrassing for a man his age.

He decided to teach himself to write.

He had always had a feeling there was a writer somewhere in him, buried under decades of business. Now, with nothing left to lose, he went looking for it. He got hold of the cheap, pulpy magazines people read on trains, the ones full of crime stories, and he studied them like a student. He took them apart. He copied them out by hand to learn how they worked.

Then he started writing his own.

It was slow. He was a beginner again at forty-five, learning a craft most writers start in their twenties. He wrote, and rewrote, and threw away, and tried again.

He had no idea if any of it was good. He just knew it was the only door left, so he kept walking toward it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of low-paying pulp stories through the 1930s, gradually refining his voice, are documented. No sudden break preceded the first novel.",
      text: `It took years.

His first little stories sold for almost nothing — a few dollars from those cheap magazines, barely enough to live on. He wrote one, then another, then another, getting a little better each time, learning his own voice slowly, in his late forties, story by story.

There was no overnight anything. No big break. Just a middle-aged man at a desk, doing the unglamorous work of getting good at something late, with the clock running and the money tight.

He kept at it. The drinking, the lost job, the shame — none of it had stopped him from finding, of all things, a brand-new craft on the far side of fifty.

He was building toward something. He just couldn't see how big yet.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "First novel at 51, introducing his famous detective and a distinctive new voice in crime writing - documented.",
      text: `Then, at fifty-one, he wrote a book.

A real one. A novel, built out of everything he had taught himself in those years of cheap stories. It had a detective in it — a tough, lonely, decent man walking through a corrupt city — and a voice unlike anything else out there. Hard and clean and a little heartbroken.

People noticed. This wasn't pulp anymore. This was something new.

The man who had been fired in disgrace at forty-four, who had taught himself to write from magazines, had just published one of the books that would change what crime stories could be.

At an age when most people are settled — finished becoming whoever they are going to be — he had just become a writer.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "His later novels, the iconic detective, his lasting influence on the genre, and his Hollywood screenwriting are documented. Name and titles withheld for the bridge.",
      text: `He had found it. Late, but completely.

He wrote more novels, and they got better, and the lonely detective he had invented became one of the most famous characters in the language. Other writers studied him the way he had once studied those cheap magazines. The movies came calling, and he helped write some of the most admired films of his day.

The voice he had built at a desk in middle age — that hard, sad, beautiful way of seeing a city — outlived him completely. People still read him. People still copy him. He basically invented a whole style.

And he didn't even start until he had already failed, been fired, and run out of other options.

The end of his old life turned out to be the beginning of the only one that mattered.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Raymond Chandler.

He became one of the greatest crime writers who ever lived — the man who turned detective stories into real literature, and created the legendary private eye Philip Marlowe. Writers and filmmakers still imitate him today. And he didn't publish his first novel until he was fifty-one, after getting fired from his executive job at forty-four, broke and middle-aged in the Great Depression.

Your life is not theirs. But a piece of this story may still sit beside you.

He had every reason to believe his best years were behind him. He'd had a career and wrecked it. He was too old, by all the usual rules, to begin again. So he began anyway, from scratch, at an age when you're supposed to be done.

It is not too late to become who you actually are. He didn't start until midlife either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1917; daughter of Eugene Meyer, who owned The Washington Post and handed it to her
//    husband, Phil Graham, rather than to her; Phil was charismatic, domineering, and belittling,
//    and had bipolar disorder; he died by suicide on 3 Aug 1963; Katharine, 46, took over the
//    company; she was gripped by self-doubt and underestimated by the men around her; she made the
//    call to publish the Pentagon Papers (1971) and backed the Watergate reporting; she became one
//    of the most powerful publishers in America; memoir Personal History won the Pulitzer (1998);
//    d.2001. (Graham, Personal History.)
//  Interpretive: "raised to pour the coffee," the imposter dread. Drawn from her memoir.
//  Avoid saying: don't name Graham / The Washington Post / Pentagon Papers / Watergate before the
//    bridge - soften to "the biggest, most dangerous story of its time." Handle the husband's death
//    gently in-beat ("died suddenly"); the suicide stays in the facts, not the prose. Don't imply
//    she sought power - it was thrust on her.
const graham: FigureStageRow = {
  figureKey: "graham",
  displayName: "Katharine Graham",
  birthYear: 1917,
  deathYear: 2001,
  stageId: "1963-1971-thrust-into-the-chair",
  stageLabel: "Thrust into the chair: a diminished wife who became formidable",
  ageMin: 45,
  ageMax: 48,
  themes: ["self_doubt", "social_constraint", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "She had been raised and married to be a wife in a powerful man's shadow, taught by everyone, including herself, that she was not the kind of person who runs things.",
    "When her husband died suddenly and the family business fell to her, she was certain she would fail at it, publicly and badly, in front of everyone who already doubted her.",
    "She kept walking into rooms where she felt like a fraud until, one decision at a time, she discovered she was the strongest person in them.",
  ],
  facets: {
    emotionalCore:
      "She carried the deep self-doubt of a woman taught her whole life that her judgment didn't count — the conviction that she was a fraud the moment she stepped outside the narrow role she'd been handed.",
    decisionShape:
      "Whether to do the expected thing and hand the business to some capable man and retreat to her old life, or to take a job she felt wholly unequal to and risk failing at it in public.",
    triggerEvent:
      "Her husband, who ran the powerful family company, died suddenly, leaving the business — and a role she had never been prepared for — abruptly in her hands.",
    agencyState:
      "She suddenly held enormous power she had never been trained to use and did not believe she deserved, surrounded by men who assumed she would fail and quietly hoped she would step aside.",
  },
  biographicalFacts: `Katharine Graham was born June 16, 1917, the daughter of the financier Eugene Meyer, who bought The Washington Post in 1933. When Katharine married Philip Graham in 1940, her father eventually handed control of the Post to her husband rather than to her — a choice she accepted as natural for the time. Phil Graham was brilliant and charismatic but also domineering and often belittling toward her, and he suffered from severe bipolar disorder. On August 3, 1963, he died by suicide. At forty-six, having spent her adult life as a wife and mother in his shadow, Katharine unexpectedly took over the company to preserve it for her children. She was gripped by self-doubt, felt like an impostor among the powerful men of the business, and was widely underestimated. She learned the job in public. In 1971 she made the decision to publish the Pentagon Papers, and through 1972–74 she backed her reporters' Watergate investigation despite enormous political and financial pressure. She became one of the most powerful and respected publishers in America. Her memoir, Personal History, won the Pulitzer Prize in 1998. She died in 2001.`,
  sources: [
    "Graham, Katharine. Personal History (New York: Alfred A. Knopf, 1997).",
    "Felsenthal, Carol. Power, Privilege, and the Post: The Katharine Graham Story (New York: Putnam, 1993).",
    "\"Katharine Graham,\" Britannica.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Raised to be a wife, married to a charismatic, belittling man who ran the family business her father gave to him (not her); her diminished self-image is documented in her memoir.",
      text: `There was a woman in her forties.

She had been raised, her whole life, to be a wife. A good one. The daughter of a powerful man, married to a brilliant, charming, difficult one. Her husband ran the important family business — the one her own father had built, and had handed to her husband instead of to her.

She kept the house. She raised the children. She stood a little behind her husband at parties and let him shine, because that was the role, and she had never been taught there was another one.

He could be cruel to her. He made her feel small, and slow, and not very bright.

She had come to half-believe it. She thought of herself as a wife, a hostess, a helper. Nothing more. Certainly not someone who could ever run anything herself.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Her husband's sudden death and her abrupt, unprepared inheritance of the company, the assumption she'd sell or hand it off, and her terror and impostor feelings are documented. The suicide is softened to \"died suddenly.\"",
      text: `Then her husband died, suddenly, and everything fell on her.

The business — the big, important, powerful one — had no one to run it. It was hers now, by family, but she had never been groomed for it. She had been groomed to pour the coffee.

Everyone around her assumed she would sell it, or hand it to some man to run, and go quietly back to her old life. That was what a woman in her position did.

She thought so too, at first. She was terrified. She walked into rooms full of powerful men who had spent their whole careers in this world, and she felt like a fraud — a housewife playing at a job she had no business holding. She second-guessed every word out of her own mouth.

She was sure, deep down, that she was going to fail. Publicly. Badly. In front of everyone who already doubted her.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She chose to run it herself rather than sell or delegate, working through intense nerves and over-preparation - documented in her memoir.",
      text: `But she didn't sell it. And she didn't hand it off.

She decided, against all her own doubt, to try to do it herself.

It was not brave and confident. It was shaky. She would go into meetings sick with nerves. She would prepare three times as hard as the men, because she was sure she was three times as likely to be caught out. She made mistakes and burned with embarrassment over them.

But she kept showing up. Day after day, into rooms where she felt she didn't belong, doing a job everyone expected her to fail at.

She didn't feel like a leader. She just refused to run away from the chair she'd been put in.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of learning a complex business in public, being underestimated, and gradually trusting her own judgment are documented.",
      text: `For a long time it was hard and lonely.

She was learning an enormous, complicated business in public, with no margin for error and an audience half-hoping she would stumble. The men around her were polite, mostly, in the way that doesn't quite hide that they don't take you seriously.

She kept at it. She learned. Slowly, the job stopped feeling like a costume. She started having opinions, and then trusting them, and then acting on them.

The voice she had spent her whole life keeping quiet — the one she'd been taught wasn't worth much — turned out to be sharp, and steady, and right more often than the loud, confident men around her.

She was becoming something nobody had expected. Including herself.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The defining test: deciding to publish a dangerous story, then backing her reporters under intense pressure, with the company at risk - documented (Pentagon Papers, Watergate), softened to remove identifying specifics.",
      text: `Then came the test that decided everything.

Her company got hold of the biggest, most dangerous story of its time — the kind that powerful people will destroy you to bury. Printing it could have ruined the whole business. The government leaned on her. Her own advisors were terrified.

It came down to her. One decision, hers alone, with everything on the line.

The woman who used to think she wasn't smart enough to have opinions looked at the risk, and looked at what was right, and said: print it.

And then, when it got even more dangerous, she backed her people again. And again.

The frightened housewife everyone expected to fold turned out to have more nerve than any of the men who'd doubted her. When it mattered most, she didn't blink.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Two decades running the company, becoming one of the most powerful figures in the country, while never fully losing the memory of her early self-doubt - documented. Name withheld for the bridge.",
      text: `She ran that company for more than twenty years.

She turned it into one of the most respected and powerful of its kind in the country, and she became one of the most powerful people in the nation — a person the most important men alive treated with care, because they knew, now, exactly how formidable she was.

The girl who was raised to pour the coffee had become someone whose decisions shaped the country.

And she never quite lost the memory of the scared woman in the meeting, sure she didn't belong. She just stopped letting that woman have the final say.

She had been underestimated her whole life — most of all by herself. It turned out she was the last one to find out who she really was.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Katharine Graham.

She ran The Washington Post for more than two decades. She made the call to publish the Pentagon Papers, and she backed the reporters whose work brought down a president. She became one of the most powerful and respected people in America — and she did it after her husband's death forced her, at forty-six, into a job she was certain she would fail at, having spent her whole life being treated, and treating herself, as just a wife.

Your life is not theirs. But a piece of this story may still sit beside you.

Nobody believed she could do it. She least of all. The doubt didn't disappear. She just kept walking into the room anyway, until one day she looked up and discovered she had become the strongest person in it.

You can feel like a fraud and still be exactly the right person for the thing. She did, for years. And she was.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1902; maize geneticist; discovered transposition ("jumping genes") ~1944-48,
//    presented it ~1951 to a cold, uncomprehending reception; deeply disappointed, she stopped
//    publishing those results and stopped lecturing (~1953) but kept researching in isolation for
//    decades; vindicated in the late 1960s-70s as molecular biology caught up; solo Nobel in
//    Physiology or Medicine 1983 (age 81), the first woman to win it unshared; d.1992. (Keller, A
//    Feeling for the Organism; Nobel; Britannica.)
//  Interpretive: "she loved the work for itself, so being ignored couldn't stop her, only delay the
//    recognition." A fair reading of her documented temperament.
//  Avoid saying: don't name McClintock / Nobel / "jumping genes" / corn-maize before the bridge.
//    Don't make her a bitter martyr - the record shows equanimity, not resentment.
const mcclintock: FigureStageRow = {
  figureKey: "mcclintock",
  displayName: "Barbara McClintock",
  birthYear: 1902,
  deathYear: 1992,
  stageId: "1951-1960s-dismissed-and-right",
  stageLabel: "Dismissed and right: the discovery the field ignored for decades",
  ageMin: 48,
  ageMax: 55,
  themes: ["dismissed", "quiet_defiance", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "She made the discovery of her life, showed it to her field, and watched them look at her as if she had gone strange — because what she had found was decades ahead of what they could understand.",
    "Rather than beg them to believe her, she simply stopped trying to convince anyone and kept doing the work alone, in near-total scientific silence, for the better part of thirty years.",
    "She let being right be its own reward, because for a very long time it was the only reward on offer — until, at last, the world caught up.",
  ],
  facets: {
    emotionalCore:
      "She felt the lonely certainty of someone who has seen a true thing clearly and cannot get anyone else to see it — and the quiet grief of being treated as eccentric for being early.",
    decisionShape:
      "Whether to fight for recognition and water down her findings to make them palatable, or to keep following the truth alone, unpublished and unrecognized, for as long as it took.",
    triggerEvent:
      "She presented a discovery that contradicted the deepest assumptions of her field, and instead of curiosity she met blank incomprehension and dismissal.",
    agencyState:
      "She had no power to make the field understand her, but complete power over whether she kept doing the work — and she chose to keep going, in obscurity, on her own terms.",
  },
  biographicalFacts: `Barbara McClintock was born June 16, 1902. A maize geneticist of extraordinary gifts, she spent decades in painstaking observation of corn and, in the 1940s, discovered "transposition" — that genetic elements can move and rearrange themselves on the chromosome (now called transposons, or "jumping genes"). It overturned the assumption that the genome was a stable, fixed thing. When she presented her findings around 1951, the scientific community largely met them with incomprehension and skepticism; the idea was too far ahead of what the field could then grasp. Deeply disappointed, she stopped publishing her results and stopped giving lectures around 1953 — but she never stopped doing the research, continuing in relative scientific isolation for decades. Only in the late 1960s and 1970s, as molecular biology matured, did other scientists confirm what she had seen, and her work was recognized as foundational. In 1983, at age eighty-one, she was awarded the Nobel Prize in Physiology or Medicine — the first woman to win that prize unshared. She continued her research almost to the end of her life. She died September 2, 1992.`,
  sources: [
    "Keller, Evelyn Fox. A Feeling for the Organism: The Life and Work of Barbara McClintock (San Francisco: W. H. Freeman, 1983).",
    "\"Barbara McClintock,\" The Nobel Prize, nobelprize.org.",
    "\"Barbara McClintock,\" Britannica.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Decades of patient close observation of one organism, indifference to status, and a major discovery that didn't fit the textbooks - all documented.",
      text: `There was a woman, around fifty, who studied living things.

She was brilliant — everyone in her field knew it. She had spent her whole life looking very, very closely at one kind of plant, season after season, decades of patient watching, until she understood it better than almost anyone alive.

She wasn't interested in fame or committees. She was interested in the truth of how living things actually worked. She would sit with her plants for hours, noticing what no one else noticed.

And after all those years of looking, she had seen something. Something big. Something that didn't fit anything the textbooks said.

She was sure of it. She had the evidence, row after row of it.

She couldn't wait to show them.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Her ~1951 presentation met with incomprehension and dismissal because the idea was too far ahead of the field - documented. The interior shutting-down is a fair reading.",
      text: `She stood up in front of the other scientists and showed them what she had found.

And they didn't get it.

Worse than didn't get it — they looked at her like she had lost her way. What she was describing went against the deepest assumptions of her field, and rather than wonder if she might be onto something, the room mostly decided she had gone strange. Too long alone with her plants.

There were polite silences. Blank faces. A few people were openly dismissive. Almost no one understood, and the few who half-did weren't sure they believed it.

She had handed them the discovery of her life, and they had handed it back as if it were nothing.

She was not a person who showed much. But something in her closed that day. She had been so sure they would see it. They hadn't. And she did not know how to make them.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She stopped publishing and lecturing around 1953 rather than fight for acceptance, but kept doing the research - documented. The framing of this as a deliberate, dignified choice is fair.",
      text: `So she made an unusual choice.

She stopped trying to convince them.

She didn't argue. She didn't fight for credit, or campaign, or water down her findings to make them easier to swallow. She also didn't quit. She did something quieter and stranger than either.

She just kept working. Alone. She stopped publishing the results no one understood, stopped giving the talks that fell flat — and went right back to her plants, and kept following the truth wherever it led, whether or not anyone ever came along.

She decided the work was worth doing even if she was the only person alive who knew it mattered.

So she did it. For years. In near-total scientific silence.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Decades of scientific isolation, being seen as an eccentric while her finding sat unrecognized, and her refusal to become bitter, are documented.",
      text: `The years stretched on. A lot of them.

She worked in a kind of exile — not forced out, exactly, just quietly set aside. Seen as the eccentric woman doing her odd, outdated thing in the corner. Younger scientists came up barely knowing what she had discovered. Her great finding sat there, unread, ahead of its time, waiting.

It would have been so easy to grow bitter. To decide the world was stupid and stop. Or to want the recognition so badly it poisoned the work.

She did neither. She kept her head down and kept looking, and she let being right be its own reward, since it was the only reward on offer.

Decade after decade. The truth she had found just sat there, patient, while the world slowly built the tools to finally understand it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "As molecular biology matured (late 1960s-70s) others confirmed her discovery; recognition came late, culminating in the top prize when she was 81 - documented.",
      text: `And then, slowly, the world caught up to her.

New tools came along. New discoveries. And as other scientists pushed deeper into how living things really work, they kept bumping into the exact thing she had seen, alone, decades before. The impossible idea that had gotten her dismissed turned out to be simply, profoundly true.

People went back and read the work everyone had ignored. And they realized this quiet woman had seen, half a lifetime early, something the whole field was only now able to grasp.

The recognition came in a flood, late. The highest honors. The award that sits at the very top of her science.

She was an old woman by then. She accepted it gracefully — and went back to her plants. The prize was nice. But she'd had the thing that actually mattered all along: she had been right, and she had never stopped doing the work.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Her discovery became foundational and is now textbook biology; her equanimity about recognition is documented. Name and prize withheld for the bridge.",
      text: `She had been right. About all of it.

The discovery they had dismissed became one of the foundations of how we understand life itself. It is in the textbooks now — the same kind of textbooks that once said she was wrong. Students learn her finding as basic fact, often without ever knowing the woman who waited thirty years for the world to believe her.

She never needed them to clap. That was her strange power. She had loved the work for itself, not for what it could get her, and so when the world ignored her, it couldn't actually stop her. It could only be late.

She had spent the lonely decades doing exactly what she would have done if she had been famous the whole time: looking closely, and telling the truth about what she saw.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Barbara McClintock.

She discovered "jumping genes" — that the genetic code can move and rearrange itself — one of the most important findings in all of biology. Her field dismissed it for decades. She stopped publishing rather than beg them to listen, and just kept working. More than thirty years later, science caught up, and in 1983 she won the Nobel Prize, alone — the first woman ever to win that prize unshared.

Your life is not theirs. But a piece of this story may still sit beside you.

For most of her life, the very people who should have understood her work simply didn't. She didn't let that make her bitter, and she didn't let it make her stop. She trusted what she had seen, and she kept doing the work in the dark, for as long as it took.

Being right early can look exactly like being wrong. She would tell you to keep going anyway.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1912; Quaker; master nonviolent strategist of the civil-rights movement; chief
//    organizer of the 1963 March on Washington (200,000+ people, built in under two months); gay,
//    openly so for the era; a 1953 morals-charge arrest was used repeatedly to discredit him; kept
//    out of public leadership and denied credit (Roy Wilkins did not want him credited; Sen. Strom
//    Thurmond attacked him on the Senate floor); Quaker ethic of not pushing oneself forward;
//    largely written out of the movement's history for decades; posthumous Presidential Medal of
//    Freedom, 2013; d.1987. (Branch, Parting the Waters; the King Institute; PBS/NPR profiles.)
//  Interpretive: the loneliness of being needed but hidden; "doing right matters more than being
//    seen." Grounded in his own Quaker statements.
//  Avoid saying: HEAVY softening - don't name Rustin / the March on Washington / MLK / "civil
//    rights" / the famous speech before the bridge. Render the cause generically ("a great movement
//    for justice," "a huge gathering"). The 2023 film raised his profile, so anonymize firmly.
//    Handle his sexuality with dignity, never as scandal.
const rustin: FigureStageRow = {
  figureKey: "rustin",
  displayName: "Bayard Rustin",
  birthYear: 1912,
  deathYear: 1987,
  stageId: "1963-the-man-in-the-back",
  stageLabel: "The genius in the back: erased from the movement he built",
  ageMin: 48,
  ageMax: 54,
  themes: ["dismissed", "social_constraint", "quiet_defiance"],
  antiThemes: [],
  shapeSentences: [
    "He was the brilliant organizer behind one of the great movements of his time, and the people he gave his life to kept him hidden because of who he loved.",
    "He was told, again and again, to do the work but stay in the back, and to let other men stand at the front and take the credit.",
    "He built the most important day that movement would ever have, watched other men's names go in the papers, and decided the work itself was worth more than being seen doing it.",
  ],
  facets: {
    emotionalCore:
      "He carried the deep loneliness of being needed and hidden at the same time — indispensable to the cause and an embarrassment to the people leading it, for a reason that had nothing to do with the quality of his work.",
    decisionShape:
      "Whether to demand the recognition he had earned, or to keep pouring himself into the cause from the shadows it insisted he stay in, knowing the credit would go to others.",
    triggerEvent:
      "Because he was a gay man in an unforgiving time, the movement he was helping to lead kept pushing him out of public view, afraid his enemies would use who he was to discredit everything.",
    agencyState:
      "He had enormous skill and almost no permission to be seen using it; the only thing fully his was the choice to do the work anyway, brilliantly, without his name on it.",
  },
  biographicalFacts: `Bayard Rustin was born March 17, 1912, and raised a Quaker. A master strategist of nonviolent protest, he became one of the most important organizers of the American civil rights movement and a key teacher of its philosophy of nonviolence. In 1963 he was the chief organizer of the March on Washington for Jobs and Freedom, building in under two months an event that brought more than 200,000 people peacefully to the capital — the day of the most famous speech in the movement's history. Rustin was also an openly gay man at a time when that was dangerous; in 1953 he had been arrested on a "morals charge," which was used against him for the rest of his career. Though leaders knew how essential he was, many worked to keep him out of public view and to deny him credit, fearing his sexuality and his past would be used to discredit the cause; one prominent leader objected to putting "a person of his liabilities" at the head, and a segregationist senator attacked him on the Senate floor as a communist and a homosexual. Shaped by a Quaker conviction that one should not push oneself forward, Rustin did the work from the background. For decades he was written out of the movement's popular history. Long after his death in 1987, he was posthumously awarded the Presidential Medal of Freedom in 2013.`,
  sources: [
    "Branch, Taylor. Parting the Waters: America in the King Years 1954-63 (New York: Simon & Schuster, 1988).",
    "\"Rustin, Bayard,\" The Martin Luther King, Jr. Research and Education Institute, Stanford.",
    "\"Bayard Rustin: The Man Who Organized the March on Washington,\" NPR Code Switch (2013).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A brilliant behind-the-scenes organizer who had given everything to a justice movement - including jail and beatings - yet was little known publicly. Documented. The movement is kept generic for the bridge.",
      text: `There was a man, around fifty, who was the quiet engine behind a great cause.

He was one of those people who make enormous things happen and are almost never seen doing it. Brilliant at it. He could take a wild, impossible dream and turn it into a real plan — who stands where, who does what, how to move a sea of people safely toward one goal.

He believed, with his whole life, in justice for people who had been denied it. And he had given that belief everything: his freedom, his safety, his youth. He had gone to jail for it. He had been beaten for it.

He was, by any honest accounting, one of the most important people in the whole movement.

And almost no one outside it knew his name.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "He was a gay man in a dangerous era; a past public humiliation (the 1953 arrest) followed him; movement leaders kept him in the shadows fearing his sexuality would discredit the cause. Documented; rendered without the identifying specifics.",
      text: `Here is why.

He was a gay man, in a time and place where that could destroy you. He had never been able to fully hide it, and once, years before, it had been used to humiliate him publicly, in a way that followed him for the rest of his life.

And so the very movement he was helping to build kept him in the shadows. The leaders knew exactly how good he was. They needed him. But they were afraid that if his enemies pointed at who he loved, it would be used to discredit everything.

So he was told, again and again, in so many words: do the work, but stay in the back. Don't lead, where people can see you. Let other men stand at the front and take the credit and give the speeches.

He had given his life to this. And the people he gave it to were ashamed to be seen with him.

That is a particular kind of lonely.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His Quaker ethic of not pushing himself forward, and his choice to keep working from the background without credit, are documented.",
      text: `He could have walked away. He could have demanded his name in lights, or gone to the press, or let the bitterness eat him.

He didn't.

He kept doing the work. Brilliantly. Without his name on it.

He had been raised in a faith that taught him you don't push yourself to the front — that the point is the truth and the good you do, not the credit you collect for doing it. He took that seriously. If the cause needed him in the shadows, he would work in the shadows.

So he poured himself into the thing fully, knowing the applause would go to other men. He decided that doing the right thing mattered more than being seen doing it.

And then he was handed the hardest job of all.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "He organized an enormous, high-stakes mass gathering in a very short time, from the background, with disaster a constant risk - documented (the 1963 March), rendered generically.",
      text: `They asked him to build the biggest single event the movement had ever attempted. Hundreds of thousands of people, brought to one place, on one day, peacefully, to demand justice in front of the whole world.

He had almost no time to do it. Weeks, not months. Everything that could go wrong would set the cause back years. If a single thing broke — violence, chaos, too few people, too many — it would be a disaster seen around the globe.

And he had to do all of it from the back. Quietly. Without the authority that comes from being a public leader, because he wasn't allowed to be one.

He worked around the clock. He thought of everything. The water, the routes, the sound, the safety, the ten thousand details no one would ever thank him for.

He carried the whole impossible thing on his shoulders, in the dark.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The day was a historic, peaceful success that changed the country; he made it work from behind the scenes while others were seen. Documented; the famous speech kept unnamed.",
      text: `The day came.

And it was perfect. Hundreds of thousands of people gathered in peace. No chaos. No disaster. One of the most powerful, moving days that cause would ever have — a day that changed the country, that people would still be talking about generations later.

It worked because he made it work. Every piece of it ran the way it did because a man almost no one could see had thought it all through.

He stood at the edge of the enormous thing he had built and watched it succeed beyond anyone's hope. Other men gave the speeches. Other men's names went in the papers.

He did not get up front. That was the deal. But he knew. He knew exactly whose hands had built this.

Sometimes that has to be enough. For him, that day, it was.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "He was written out of the movement's popular history for decades, then rediscovered and honored, including a posthumous national honor. Documented. Name and the specific honor withheld for the bridge.",
      text: `For a long time, history did what the movement had done: it left him out.

The famous day got remembered. The famous speeches got quoted. The man who had actually built it stayed a footnote, pushed aside in the records for the same reason he'd been pushed aside in life — because of who he loved.

But the truth has a way of surfacing. Slowly, people went back and asked who had really made that day happen. And they found him. The quiet genius in the back. They began, finally, to say his name out loud, and to honor it.

Long after he was gone, his own country gave him its highest honor for a citizen — the recognition it had denied him while he lived.

He had done the work without it. But it was right that it finally came.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Bayard Rustin.

He was the chief organizer of the March on Washington in 1963 — the day of the most famous speech in American history. He was a genius of nonviolent organizing who helped shape the entire civil rights movement. And he was pushed to the background for decades, denied the credit he had earned, because he was a gay man. Long after his death, the country awarded him its Presidential Medal of Freedom.

Your life is not theirs. But a piece of this story may still sit beside you.

He did some of the most important work of his century and watched other people take the credit for it, because of who he was. He didn't stop. He decided the work itself was worth doing, seen or unseen.

Being unseen is not the same as not mattering. He mattered more than almost anyone in the room — and the room is only now admitting it.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1890; many failed early jobs/ventures; built the successful Sanders Court & Cafe on
//    US-25 in Corbin, KY, locally famous for his fried chicken (pressure-cooker + "11 herbs and
//    spices"); ~1956 Interstate 75 bypassed the town and killed the business; he owed ~$165k, the
//    business auctioned for only ~$75k, barely covering his debts; at 65, broke, he drove the
//    country selling "handshake" franchises of the recipe; ~400 franchises by age 71; sold the
//    company for $2M in 1964 (age 74) to John Y. Brown Jr. and Jack Massey; d.1980. (Corbin KY
//    Tourism / Harland Sanders Cafe and Museum; standard biographies.)
//  Interpretive: the "earned a rest, then the ground dropped out" framing. Grounded.
//  Avoid saying: don't name Sanders / Colonel / KFC / Kentucky Fried Chicken / "fried chicken"
//    before the bridge. STRIP the motivational-poster myth: NOT "$105 Social Security check," NOT
//    "rejected 1,009 times" - the real story is the mortgage/auction and the road-trip franchising.
//    Soften era markers (the highway is fine; keep exact dates/places out).
const sanders: FigureStageRow = {
  figureKey: "sanders",
  displayName: "Harland Sanders",
  birthYear: 1890,
  deathYear: 1980,
  stageId: "1956-broke-at-sixty-five",
  stageLabel: "Broke at sixty-five: the highway, the auction, and the road",
  ageMin: 62,
  ageMax: 66,
  themes: ["late_start", "public_failure", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "After a lifetime of false starts he had finally built one good thing — a roadside business people loved — and then a new highway went around his town and killed it.",
    "He was sixty-five and broke, at the exact age people retire, with almost nothing left but the one recipe nobody could take from him.",
    "So he got in his car and started over from scratch, driving town to town to sell that recipe, and built the biggest thing of his life on the far side of sixty-five.",
  ],
  facets: {
    emotionalCore:
      "He felt the cruel timing of losing everything at the age when starting over is supposed to be off the table — the humiliation of being wiped out, old, after finally getting something right.",
    decisionShape:
      "Whether to accept that a broke man in his mid-sixties is finished and quietly give up, or to take the one asset he had left and begin an exhausting new venture far too late.",
    triggerEvent:
      "A new highway bypassed his town and destroyed the roadside business he had built, and when he sold it, it brought far less than he owed, leaving him broke at sixty-five.",
    agencyState:
      "He had lost his business, his savings, and the years he should have been able to coast on, and was left with one thing entirely his: a recipe and the method to cook it.",
  },
  biographicalFacts: `Harland David Sanders was born September 9, 1890. His early life was a long string of jobs and ventures that mostly failed or fell apart. In middle age he finally found something that worked: a roadside restaurant and motel, the Sanders Court & Café, on a busy highway (U.S. 25) in Corbin, Kentucky, where travelers stopped for the fried chicken he cooked, using a pressure cooker and a blend of seasonings. The business thrived for years — until, around 1956, the new Interstate 75 bypassed Corbin, and the stream of travelers vanished almost overnight. The business collapsed. Sanders owed roughly $165,000; when the property was auctioned, it brought only about $75,000, barely enough to cover his debts. He was sixty-five and broke. With little more than his recipe and his cooking method, he took to the road, driving from restaurant to restaurant to persuade owners to cook his chicken and pay him a few cents for each one sold — "handshake" franchise deals. Many turned him down; he kept going. By about age seventy-one he had some 400 franchises; the operation grew explosively. In 1964, at seventy-four, he sold the company for $2 million. It became Kentucky Fried Chicken, one of the most recognized food brands in the world. He died December 16, 1980.`,
  sources: [
    "\"Harland Sanders Cafe and Museum,\" Corbin, Kentucky Tourism.",
    "Sanders, Harland. Life As I Have Known It Has Been Finger Lickin' Good (autobiography, 1974).",
    "Ozersky, Josh. Colonel Sanders and the American Dream (Austin: University of Texas Press, 2012).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A man with a long history of failed ventures who finally built a thriving roadside restaurant locally famous for one dish - documented. The dish/brand kept unnamed for the bridge.",
      text: `There was a man in his sixties.

He'd had a hard, scrappy life — dozens of jobs, a lot of them gone wrong — but late in middle age he had finally built something good. A little roadside spot on a busy highway, where travelers stopped to eat. He had gotten locally famous for one thing he cooked better than anyone around. People drove out of their way for it.

It wasn't a fortune. But it was his, and it worked, and after a lifetime of false starts he could finally see himself coasting gently into old age on the strength of it.

He had earned a rest. He thought he was going to get one.

He had no idea the ground was about to drop out from under him, at the worst possible age for it to happen.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "A new interstate bypassed the town and killed the business; the sale brought far less than he owed; he was left broke at 65. Documented (mortgage/auction). The motivational myth is deliberately avoided.",
      text: `They built a new road.

A big, fast highway, the kind that lets people skip the old route entirely. And the new road went around his town. Just like that, the steady stream of travelers who had kept his little place alive simply... stopped coming. They were all out on the new highway now, miles away.

His business dried up almost overnight. He held on as long as he could, then had to give it up. When he sold it, it went for far less than he owed. After he paid his debts, there was almost nothing left.

He was sixty-five years old. Broke. The thing he had spent his best late years building was gone, killed by a road he could do nothing about.

Sixty-five. The age when people retire. He had next to nothing, and he was, by every reasonable measure, too old to start over.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "With essentially only his recipe and method left, he began driving to other restaurants to license it for a few cents per sale - documented. The \"a little crazy at his age\" framing is fair.",
      text: `He took stock of what he had left.

It wasn't much. But there was one thing. The way he cooked that one dish — the recipe, the method, the thing people used to drive out of their way for. That was still his. Nobody could build a highway around that.

So he had an idea that, at his age, must have looked a little crazy.

He would take the recipe to other restaurants. He'd show their owners how to make it, and if their customers loved it the way his had, they would pay him a few cents for every plate they sold.

He got in his car. An old man with a recipe and not much else, and he started driving from town to town, restaurant to restaurant, asking strangers to let him into their kitchens.

He was starting completely over. At sixty-five.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Long drives, frequent rejection, cooking his dish on the spot to prove it, accumulating slow handshake deals - documented in the franchising period.",
      text: `It was a hard, humbling way to live.

He drove enormous distances. He slept cheap. He walked into restaurants run by people half his age and asked them to trust an old man they had never met. Plenty of them said no. Plenty looked at him like what he obviously was — an elderly man whose own place had failed, trying to sell them something.

He cooked his dish for them right there, in their kitchens, to prove it. Some still passed. He would thank them and drive to the next town and do it all again.

For a man in his late sixties, it was exhausting and often discouraging. Every yes was paid for with a lot of nos.

But every so often, someone said yes. And then their customers came back asking for more. And slowly, one handshake at a time, the thing began to grow.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The franchises multiplied rapidly - hundreds by his early seventies - and the bypassed little business was reborn far larger. Documented.",
      text: `And then it caught.

A few restaurants became a dozen. A dozen became a hundred. The thing people used to drive out of their way for, it turned out, people everywhere would line up for. His one good recipe, carried door to door by a broke old man, started spreading across the country faster than he could keep up with.

By his early seventies — an age when most people are long retired — he had hundreds of places paying him for his recipe. The little roadside spot that the highway had killed had been reborn as something a hundred times bigger, with his cooking in town after town after town.

The failure at sixty-five had not been the end of his story. It had forced the beginning of the biggest chapter of his life.

He had been right about the one thing he had left.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The recipe became a globally famous brand and he sold the company for a fortune in his seventies. Documented. Name and brand withheld for the bridge.",
      text: `It became enormous. Bigger than he could have dreamed standing in his dead restaurant at sixty-five.

The recipe he drove around selling out of his car turned into one of the most famous foods on the planet — his face, eventually, on signs in countries he had never visited. When he finally sold the business, he sold it for a fortune. The broke old man became a wealthy one, and far more than that: he became known, everywhere, for the thing he had refused to give up on.

He had lived most of his life as a man whose ventures kept falling apart. And then, at the age when most people stop, he built the thing he would be remembered for forever.

Not despite starting late. Because he was willing to start at all, when everything said he was finished.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Harland Sanders — though you know him as Colonel Sanders.

After a new highway killed his roadside restaurant and left him broke at sixty-five, he drove around the country selling his fried chicken recipe one handshake at a time. It became Kentucky Fried Chicken — KFC — one of the most famous food brands in the world. His face is still on it.

Your life is not theirs. But a piece of this story may still sit beside you.

He was sixty-five and wiped out, at the exact age when you're supposed to be done. He had every reason to call it a life and sit down. Instead he took the one thing he had left and started over, and built the biggest thing he would ever build.

It is not too late. It really isn't. He was past retirement when he even began.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. May 11, 1888 (Israel Baline, Russian Empire); family emigrated 1893 to the Lower
//    East Side; father Moses (part-time cantor) died July 1901 when Irving was 13; left home at 14
//    believing the family was better off with one less mouth (his own later account — he felt he
//    "contributed less than the least"); Bowery lodging houses, busked in saloons for pennies,
//    song-plugger work; 1906 (18) singing waiter at the Pelham Cafe in Chinatown; 1907 first
//    published song "Marie from Sunny Italy" (earned 37 cents), printer credited "I. Berlin" and he
//    kept the name; "Alexander's Ragtime Band" (1911, age 23) made him internationally famous;
//    never learned to read/write music fluently; supported his family later; died 1989 at 101.
//  Interpretive: the "did the math on himself and came out worth almost nothing" framing of why he
//    left home. Grounded in his own retrospective accounts.
//  Avoid saying: don't name Berlin / the Bowery / Chinatown / Pelham Cafe / song titles before the
//    bridge; no dollar amounts (the 37 cents becomes "less than the price of a meal"); soften era
//    (no "ragtime", no "Tin Pan Alley"); the misspelled-name detail stays but unnamed.
const berlin_i: FigureStageRow = {
  figureKey: "berlin_i",
  displayName: "Irving Berlin",
  birthYear: 1888,
  deathYear: 1989,
  stageId: "1901-1907-bowery-to-first-song",
  stageLabel: "One less mouth: leaving home at fourteen to the first published song",
  ageMin: 13,
  ageMax: 19,
  themes: ["dispossession", "worthlessness", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "His father died when he was thirteen, and at fourteen he left his grieving family because he believed they were better off with one less mouth to feed — and that his was the mouth worth least.",
    "For years he slept in cheap lodging houses and sang in saloons for pennies, a boy with no schooling and no trade, only a voice.",
    "When a printer misspelled his name on the first song he ever sold, he kept the mistake and built the rest of his life under it.",
  ],
  facets: {
    emotionalCore:
      "He felt like the one useless member of a family that had nothing — the child who brought in less than anyone and would cost less if he were gone.",
    decisionShape:
      "Whether to stay a burden in a crowded, grieving home, or to disappear into the streets at fourteen and make his own way with nothing to offer but a voice.",
    triggerEvent:
      "His father died when he was thirteen, and the family's survival fell to the children — and he was sure his share was the smallest.",
    agencyState:
      "A boy alone in cheap lodging houses with no schooling, no trade, and no money — only a voice, and the saloons that might pay pennies to hear it.",
  },
  biographicalFacts:
    "Irving Berlin was born Israel Baline on May 11, 1888, in the Russian Empire; his family fled anti-Jewish violence and arrived on New York's Lower East Side in 1893 with almost nothing. His father Moses, who had been a cantor and now worked in a kosher meat market, died in July 1901, when Israel was thirteen. Everyone in the family worked; Israel sold newspapers and, by his own later account, was convinced he contributed less than any of his siblings. At fourteen he left home so the family would have one less mouth to feed, living in Bowery lodging houses and singing in saloons for pennies. He worked as a busker and then as a song plugger. In 1906, at eighteen, he became a singing waiter at the Pelham Cafe in Chinatown, where the owner asked him and the house pianist to write an original song after a rival cafe's singing waiter had published one. The result, \"Marie from Sunny Italy\" (1907), earned him 37 cents — and the sheet-music cover credited the lyricist as \"I. Berlin,\" a printer's error he kept as his name. He kept writing. \"Alexander's Ragtime Band\" (1911), written when he was 23, became an international sensation and made him famous. He never learned to read or write musical notation fluently, composing everything by ear. He went on to write an estimated 1,500 songs, including \"White Christmas\" and \"God Bless America,\" supported his mother and siblings, and died in 1989 at 101.",
  sources: [
    "Bergreen, Laurence. As Thousands Cheer: The Life of Irving Berlin (New York: Viking, 1990), Chapters 1-3.",
    "Furia, Philip. Irving Berlin: A Life in Song (New York: Schirmer Books, 1998).",
    "Jablonski, Edward. Irving Berlin: American Troubadour (New York: Henry Holt, 1999).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Immigrant family, father's death at 13, everyone working, his conviction that he contributed least — documented in his own accounts. The counting-at-the-table image is dramatized texture for that conviction.",
      text: `There was a boy in a crowded city apartment. He was thirteen, one of the youngest of many, and his father had just died.

The family had come from another country with nothing. Everyone worked. His sisters brought home wages. His mother took in whatever work there was. The boy sold newspapers on the street and brought home less than anyone.

He noticed things like that — who carried what, who cost what. At the table he did the math on himself, and it kept coming out wrong.

He was sure of one thing: of everyone in that apartment, he was the one they could least afford.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Left home at 14 by his own choice, believing the family was better off; Bowery lodging houses paid night by night — documented. 'Nobody chased him down the stairs' is texture for the documented fact that he left on his own.",
      text: `At fourteen he packed what he had, which was almost nothing, and left home.

Nobody told him to go. He left because he had decided his family was better off with one less mouth at the table. And nobody chased him down the stairs.

That was the part that stayed with him.

He slept in the cheap lodging houses where men at the bottom of the city slept — a boy on a cot in rooms full of grown strangers. He paid for the cot night by night. Some nights he couldn't, and he walked until morning.

He was fourteen, and as far as he could tell, the world agreed with his math: he wasn't worth much, and no one had argued.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Busked in saloons for pennies; began improvising his own words to popular tunes — documented in the biographies of the busking years.",
      text: `He had one thing. He could sing.

Not beautifully — nobody ever said beautifully. But he could carry a song and make a room feel like the night was going well.

So he sang wherever pennies might come back. In saloons. At tables. On corners. He followed the coins, and when one place dried up he found another.

It wasn't a plan. It was rent for a cot, one night at a time. But it kept him alive, and it kept a song in his mouth all day, every day.

After a while he started making up his own words to the tunes everybody knew. Just to see if he could.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of busking and song-plugging (singing publishers' songs in public for pay); never returned to school — documented. The 'learning what made a room lean in' framing is interpretive.",
      text: `Years went by like that. He never went back to school.

He got small jobs around music — the lowest ones there were. Singing other people's songs in the street so that someone upstairs could sell more copies. The boys who did that work were nobody, and they knew it.

But at night, in the noise, he was listening. He learned what made a room lean in and what made it turn away. He learned it the way you learn a language: by living inside it, broke.

He still had nothing. He still sent nothing home, because there was nothing to send. But he was becoming, without anyone noticing, a person who understood songs from the inside.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Singing-waiter job at 18; owner demanded an original song to compete with a rival cafe; first published song earned him 37 cents ('less than a meal'); the printer's misspelling became his name — all documented.",
      text: `At eighteen he got a steady job — a waiter in a loud cafe, the kind of place where the waiter was expected to sing while he worked.

A rival cafe down the street had a singing waiter who had written his own song, and it was getting attention. So the owner told the boy and the house piano player: write us one too.

He had never written a song. He wrote one.

It got published. It sold almost nothing. His share of the money came to less than the price of a meal.

But on the printed cover, the printer had made a mistake. The name was spelled wrong — a new name, really. He looked at it for a while. It looked like someone who could be somebody.

He kept the mistake. And he kept writing.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "One song (1911) made him internationally famous; wrote ~1,500 songs by ear, never fluent in notation; lived to 101; supported the family he had left — all documented.",
      text: `The songs did not stop coming. He wrote in the noise of the cafe, in the middle of the night, anywhere. A few years later, one of them took off — not in one city, everywhere. The kind of song strangers on two continents were humming in the same month.

The boy from the lodging houses became the most successful songwriter alive. He wrote for the stage. He wrote for the movies. He wrote the songs whole countries sing on their holidays. And he never did learn to read music properly — he wrote it all by ear, the ear he had trained in rooms where he sang for pennies.

He lived past a hundred.

And the family he had left at fourteen, so they'd have one less mouth to feed? He took care of them, all of them, for the rest of their lives.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Irving Berlin.

He wrote "White Christmas" and "God Bless America" — two of the most famous songs in American history — and about fifteen hundred others. There is a fair chance one of his songs is playing somewhere in the world right now. None of that had happened yet when he was fourteen, lying on a rented cot, adding himself up and getting almost zero.

Your life is not theirs. But a piece of this story may still sit beside you.

He honestly believed his family was better off without him at the table. He was wrong about what he was worth — wildly, historically wrong — but he couldn't have known it yet. The proof only came from staying alive and doing the one small thing he could do, over and over, until it grew.

The math you're doing on yourself can be wrong too. His was.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 23, 1930 (Albany GA, raised Greenville FL); sight failed ~5-7 (glaucoma),
//    fully blind by 7; mother Aretha ('Retha) Robinson, poor and fiercely insistent on his
//    self-reliance ("blind, not stupid" is the family's remembered register); Florida School for
//    the Deaf and the Blind, St. Augustine, 1937-1945 (braille music, piano, clarinet); mother died
//    suddenly spring 1945 when he was 14 — he called it the great devastation of his life; a family
//    friend ("Ma Beck") helped him through the locked grief; he left school, played Florida bands
//    1945-48 (lean, sometimes hungry; had pay counted into his hand); March 1948, age 17, asked a
//    friend to find the farthest big city from Florida on a map — Seattle — and rode a bus ~5 days
//    alone; first recordings within a year; dropped "Robinson" (Sugar Ray Robinson collision);
//    invented soul (gospel+blues); "Georgia on My Mind" became Georgia's state song (1979); d. 2004.
//  Interpretive: "the voice that organized his world was the thing that vanished" framing; the
//    map-decision as self-invention. Grounded.
//  Avoid saying: don't name Ray Charles / Seattle / St. Augustine / Georgia before the bridge; no
//    pity register anywhere; the brother's drowning (pre-episode, he was ~5) is deliberately left
//    out of the beats; keep the mother's death un-graphic; no "soul music" before the bridge.
const charles_r: FigureStageRow = {
  figureKey: "charles_r",
  displayName: "Ray Charles",
  birthYear: 1930,
  deathYear: 2004,
  stageId: "1945-1948-orphaned-to-the-bus",
  stageLabel: "Blind, fourteen, and alone: his mother's death to the five-day bus",
  ageMin: 14,
  ageMax: 17,
  themes: ["grief", "disability", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "He went blind at seven and lost his mother at fourteen — the one person who had refused to treat him as helpless — and he had to decide whether to be taken care of or to carry himself.",
    "At an age when most kids sit in classrooms he was playing piano for strangers town to town, blind, broke, and learning that pity and work don't mix.",
    "At seventeen he picked the farthest city on the map from everything he knew and rode a bus five days alone to start from nothing.",
  ],
  facets: {
    emotionalCore:
      "He had lost the one person who taught him he could survive, at exactly the moment he had to start surviving — fourteen, in the dark, with no home to go back to.",
    decisionShape:
      "Whether to stay where people would look after a blind orphan, or to bet that the skill his mother had made him build could actually carry him.",
    triggerEvent:
      "His mother died suddenly when he was fourteen — the person who had refused to let his blindness make him helpless.",
    agencyState:
      "Blind, orphaned, and fourteen, with no money and no family home — but carrying a trained skill and his mother's one rule: he was never to beg.",
  },
  biographicalFacts:
    "Ray Charles Robinson was born September 23, 1930, in Albany, Georgia, and raised in deep poverty in Greenville, Florida, by his mother, Aretha (Retha) Robinson. His sight began failing around age five — probably from glaucoma — and he was completely blind by seven. His mother, determined that blindness would not make him helpless, made him do chores, find his own way around, and fend for himself, over the objections of neighbors who thought her too hard on him. From 1937 to 1945 he attended the Florida School for the Deaf and the Blind in St. Augustine, where he learned to read braille music and to play piano and clarinet, and trained his memory to hold whole arrangements. In the spring of 1945, when he was fourteen, his mother died suddenly; she was in her early thirties. He later described it as the most devastating loss of his life, and said he could not cry until a family friend, an older woman known as Ma Beck, talked him through the grief. He did not return to school. Taken in by family friends in Jacksonville, he made his living as a working musician around Florida — Jacksonville, Orlando, Tampa — from fifteen to seventeen, often broke and sometimes hungry, and learned to have his pay counted aloud, bill by bill, into his hand. In March 1948, at seventeen, he asked a friend to look at a map and find the biggest American city farthest from Florida. The answer was Seattle. He rode a bus roughly five days across the country alone, knowing no one there. Within weeks he was playing Seattle clubs; within a year he had made his first recordings, and he dropped his surname to avoid confusion with the boxer Sugar Ray Robinson. He went on to fuse gospel and blues into what became soul music, won seventeen Grammy Awards, and his recording of \"Georgia on My Mind\" became the official state song of Georgia in 1979. He died June 10, 2004.",
  sources: [
    "Charles, Ray, and David Ritz. Brother Ray: Ray Charles' Own Story (New York: Dial Press, 1978).",
    "Lydon, Michael. Ray Charles: Man and Music (New York: Riverhead Books, 1998), Chapters 1-3.",
    "Evans, Mike. Ray Charles: The Birth of Soul (London: Omnibus Press, 2005).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Blind by 7; mother's fierce self-reliance rules (chores, no pity, over neighbors' objections); boarding school far from home; braille music, piano, clarinet — all documented.",
      text: `There was a boy at a boarding school for blind children, far from home.

He had lost his sight slowly, when he was little — the world dimming out by the time he was seven. His mother had no money, but she had rules. The big one: he was blind, not helpless, and nobody — including him — was allowed to confuse the two. She made him do chores. She made him find his own way. Neighbors said she was too hard on a blind child. She didn't care.

At school he found the thing: music. He learned to read notes with his fingers and hold whole songs in his head. Piano. Clarinet. He was good, and he knew he was good, and being good at something felt almost like seeing.

Home was poor and far away. But it was there, and she was in it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Mother's sudden death in spring 1945 (he was 14); his own account calls it the worst loss of his life; he couldn't cry until an older family friend talked him through it; he did not return to school — all documented.",
      text: `One day in spring, when he was fourteen, they came and got him out of class. His mother had died. No warning. She was still young.

He went home for the funeral. He stood in the crowded little room while it cried around him, and he could not cry at all. The grief had locked itself somewhere he couldn't reach.

He said later it was the worst thing that ever happened to him. Worse than going blind. Going blind had happened slowly, with her voice right beside him. This happened all at once — and her voice was the thing that was gone.

For days he stayed locked like that. Finally an old woman in town, a friend of his mother's, sat him down and talked to him, plainly, for a long time, until the grief broke open and let him through it.

He did not go back to school.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "No family home to return to; taken in by family friends in a bigger city; began sitting in with working bands at 14-15 — documented. The 'her list' framing is interpretive, grounded in his account of her teaching.",
      text: `He was fourteen, blind, and now without her, in a poor little town that had no way to keep him.

He took stock the way she had taught him. Feeling sorry for himself was not on her list. Begging was not on her list. Doing for himself — that was the whole list.

He had one skill the world might pay for. So he went where the music was. Family friends in a bigger city took him in, and he started showing up wherever bands played, asking to sit in.

Fourteen years old, out at night, in rooms full of grown men.

He played whatever they needed played.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Three years of band work around the state; lean weeks (crackers and water is from his own account); could play anything heard once; had pay counted aloud into his hand — documented.",
      text: `For three years he scraped by as a working musician, town to town around the state.

Some weeks there was work. Some weeks he ate crackers and drank water and told nobody. Bandleaders took a chance on the blind kid and found out he could play anything he heard once. Other people tried to shortchange him on pay, figuring he couldn't count what he couldn't see. He learned to have them count it out loud, bill by bill, into his hand.

He was getting better. He was also going in circles — the same little towns, the same little rooms, the same state he had grown up in.

He knew that map by heart. That was exactly the problem.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The documented map decision at 17: asked a friend to find the biggest city farthest away; ~5-day bus ride alone; playing clubs within weeks, recording within about a year.",
      text: `At seventeen he made a decision that still sounds half crazy.

He asked a friend to look at a map of the whole country and find the biggest city that was farthest from where they stood. The friend measured it out and named a city in the far opposite corner — about as far as you could go without leaving the country.

That one, he said.

He had never been there. He knew no one there. He was blind and seventeen, and he got on a bus alone and rode for five days and nights to a city he had chosen because it was far.

Within weeks he was playing in its clubs. Within a couple of years, people were paying to record him.

The new city didn't know what he used to be. It only knew what he sounded like.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Dropped his surname over the famous-boxer collision; stopped imitating his idols and fused gospel and blues against loud objections; toured the world, played for presidents — documented. Kept anonymous.",
      text: `He dropped his last name — there was already a famous fighter with almost the same one — and went by his first and middle names instead. A new name for the new life.

For a few years he sounded like the singers he admired. Then he stopped imitating and let everything in at once — the church music of his childhood, the blues, the dance bands — mixed together in a way nobody had dared. People told him you couldn't put those together, that it was almost blasphemy. He put them together.

What came out was a new kind of American music, and he was its inventor.

He toured the world. He won every prize his field had to give. He played for presidents. And every bit of it ran on the rules of a woman from a poor little town who had refused, ever, to let him be helpless.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Ray Charles.

He invented soul music — the fusing of gospel and blues that half of everything on the radio still descends from. His version of "Georgia on My Mind" became the official song of the state he was born in. He did all of it blind, and he never once performed as a man to be pitied. None of it had happened yet when he was fourteen, standing at his mother's funeral with no home to go back to.

Your life is not theirs. But a piece of this story may still sit beside you.

He lost the person who had taught him how to survive at exactly the moment the surviving started. What she left him wasn't money — there wasn't any. It was the stubborn idea that he could do for himself. It turned out that was enough to cross the whole map with.

Grief takes what it takes. It doesn't get to take what you know how to do.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 14, 1866, Feeding Hills MA, poor Irish immigrant family; mother died of TB
//    when she was 8; father abandoned the children; sent to Tewksbury Almshouse Feb 1876 (age 9)
//    with her small brother Jimmie, who died there within about three months; trachoma left her
//    nearly blind; ~4 years in wards among the sick and dying, no family visits; 1880 state
//    investigation of Tewksbury — when Frank B. Sanborn's inspection party toured, she threw
//    herself at him crying "Mr. Sanborn, I want to go to school!"; entered Perkins Institution
//    Oct 7, 1880, age 14, illiterate; mocked by younger students, temper nearly got her expelled;
//    eye operations partially restored her sight; graduated valedictorian June 1886, age 20 (her
//    address: "duty bids us go forth into active life"); March 1887 went to Tuscumbia, Alabama, to
//    teach 6-year-old Helen Keller. d. 1936.
//  Interpretive: the "one overheard word — school — held like something in a pocket" framing; the
//    invisibility-ended-because-she-ended-it reading of the Sanborn moment. Grounded.
//  Avoid saying: don't name Sullivan / Tewksbury / Perkins / Sanborn / Helen Keller before the
//    bridge; keep the almshouse un-lurid (no cannibalism-investigation detail); the brother's death
//    is handled in one quiet line; no "Miracle Worker" before the bridge.
const sullivan_a: FigureStageRow = {
  figureKey: "sullivan_a",
  displayName: "Anne Sullivan",
  birthYear: 1866,
  deathYear: 1936,
  stageId: "1880-1886-almshouse-to-valedictorian",
  stageLabel: "I want to go to school: the almshouse plea to valedictorian",
  ageMin: 14,
  ageMax: 20,
  themes: ["dispossession", "worthlessness", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "She spent her girlhood in a state poorhouse, nearly blind, with no one coming for her, and she begged a passing stranger to let her go to school — arriving at fourteen unable to read and leaving first in her class.",
    "Being years behind children half her age shamed her every day, and she learned anyway, at a furious rate, through operations and humiliations.",
    "The girl nobody came for became the teacher nobody else could have been.",
  ],
  facets: {
    emotionalCore:
      "The shame of being a teenager who could not read or write her own name, surrounded by small children who could, after years of being stored away where nobody visits.",
    decisionShape:
      "Whether to keep waiting quietly in the place the state had filed her, or to grab the one stranger with the power to move her and beg — publicly, desperately — for a different life.",
    triggerEvent:
      "State inspectors walked through the poorhouse where she had spent four years, and she understood that men like that might never come again.",
    agencyState:
      "She owned nothing, could barely see, and had no family left — only the nerve to ask out loud and the will to catch up from zero.",
  },
  biographicalFacts:
    "Anne Sullivan was born April 14, 1866, in Feeding Hills, Massachusetts, to poor Irish immigrant parents. Her mother died of tuberculosis when Anne was eight; her father, unable or unwilling to care for the children, abandoned them. In February 1876 Anne and her younger brother Jimmie were sent to the state almshouse at Tewksbury — a warehouse for the destitute, the sick, and the dying. Jimmie, who had a tubercular hip, died there within about three months and was buried on the grounds. Anne, whose eyes had been badly damaged by trachoma since early childhood, spent roughly four years in the wards, nearly blind, with no family visits, undergoing failed eye operations. From ward talk she learned that schools for the blind existed. In 1880 the state investigated conditions at Tewksbury, and when the inspection party led by Frank B. Sanborn of the State Board of Charities toured the wards, fourteen-year-old Anne threw herself toward him and cried, \"Mr. Sanborn, I want to go to school!\" That October she entered the Perkins Institution for the Blind in Boston — fourteen years old and unable to read, write, or spell her own name. Younger students mocked her ignorance; her temper nearly got her expelled more than once. Surgeries at Perkins partially restored her sight, and she rose through the school at a furious pace. In June 1886, at twenty, she graduated as class valedictorian, telling her classmates that \"duty bids us go forth into active life.\" The following March she traveled to Tuscumbia, Alabama, to become the teacher of a deaf-blind six-year-old named Helen Keller. She died October 20, 1936.",
  sources: [
    "Nielsen, Kim E. Beyond the Miracle Worker: The Remarkable Life of Anne Sullivan Macy (Boston: Beacon Press, 2009), Chapters 1-3.",
    "Braddy, Nella. Anne Sullivan Macy: The Story Behind Helen Keller (New York: Doubleday, 1933).",
    "Perkins School for the Blind archives, \"Anne Sullivan\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Mother's death, father's abandonment, the almshouse placement with her brother, near-blindness — all documented. Kept un-lurid.",
      text: `There was a girl in a state poorhouse.

Her mother had died when she was eight. Her father drank, and then he was gone. The state took her and her little brother and sent them to the place where it sent everyone it had no plan for — the old, the sick, the dying. And, somehow, two children.

Her eyes were bad and getting worse. Some days the world was only shapes and light.

She and her brother stuck together in the wards. He was small and frail and she was fierce, and they had exactly one thing in the world, which was each other.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Jimmie's death within months, burial on the grounds, four years without a single visitor, ward talk about schools for the blind — documented. The 'word in a pocket' image is texture.",
      text: `Her brother died a few months after they arrived. They buried him on the grounds. She was ten.

After that, she was simply... there. Year after year. Nobody came to visit her. Nobody came to claim her. She grew up in wards full of women at the end of their lives, listening to how lives end, going half blind among people the world had already filed away.

She was headed for the same filing. She knew it.

But once, in the ward talk, she heard a rumor: there were schools. Real schools, where they taught girls who couldn't see.

Nobody had ever taught her to read. She could not write her own name. But she held onto that one word the way you hold something small in your pocket through a bad winter.

School. If the world had a door in it anywhere, that was the shape of it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 1880 state inspection and her documented plea to the head of the visiting party — 'I want to go to school!' — which got her sent to the school for the blind that fall.",
      text: `One day, when she was fourteen, important men came to inspect the place. Word ran through the wards ahead of them — men from the state, come to see how bad it really was.

She understood one thing clearly: men like this might never come again.

She followed the group all day, working up her nerve. She couldn't even see well enough to tell which one was in charge. When she felt the visit ending — the voices turning toward the door — she threw herself toward the sound of them and cried out:

I want to go to school!

The men stopped. One of them asked her name. Asked about her eyes.

She had spent four years being invisible. It ended because she ended it — one sentence, thrown into the dark, at exactly the right moment.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Entered at 14 illiterate; mocked by younger children; temper nearly got her expelled; eye operations partially restored sight; rapid rise through the grades — all documented.",
      text: `They sent her to the school for the blind that fall.

She was fourteen years old, and she could not read, could not write, could not spell her own name. The other students who were starting out were little children — and they could. They laughed at her. Some teachers found her rude and wild, and she was; nobody had ever taught her manners either.

She was humiliated in small ways, daily, for a long time. Her temper went off like a struck match, and it nearly got her thrown out more than once.

But she was also learning at a furious rate — reading, writing, all of it — rising through the school like something coming up from underwater. Doctors operated on her eyes, and part of her sight came back.

She caught up to the little children. Then she passed them.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Valedictorian at 20, June 1886; 'duty bids us go forth into active life' is from her actual address. The 'distance nobody else in the room knew' framing is interpretive.",
      text: `Six years after she arrived unable to spell her own name, the school chose her — out of everyone — to give the speech at graduation. First in her class.

She stood up in front of the assembled families and dignitaries, twenty years old, and gave the address. She told her classmates that duty was calling them out into active life, and that they should go gladly.

Nobody in that hall but her knew the whole distance she had crossed to be standing there. From a burial ground behind a poorhouse to the front of that room.

She had asked for one door. Given one, she had walked through it farther than anyone could have guessed.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The 1887 call to teach a deaf-blind six-year-old; what followed (language, education, world fame for her student) — documented, kept anonymous.",
      text: `A year later, a family in a faraway state wrote to the school. They had a little girl, six years old, who had lost both her sight and her hearing as a baby. The child had no language — no way in, no way out. Locked inside herself. The family needed a teacher, and what they were asking for had never really been done.

The school recommended the girl from the poorhouse.

She went. She was twenty-one. What she did in the months and years that followed — reaching that child, hand spelling into hand, giving her language and then books and then a university education — became the most famous story of teaching in human history.

Her student became one of the most celebrated people in the world.

And every door her student ever walked through had been unlocked first by the teacher — the girl nobody had come for.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Anne Sullivan.

She was Helen Keller's teacher — the one who spelled water into Helen's hand at the pump and cracked the world open for her. They called her the Miracle Worker. They still do. None of that had happened yet when she was a half-blind girl in a poorhouse, holding onto one overheard word.

Your life is not theirs. But a piece of this story may still sit beside you.

She spent years as the person nobody came for — behind everyone, ashamed of it, starting from zero at an age when starting felt impossible. She caught up anyway. And then she turned around and taught someone else the way out.

Starting behind is not staying behind. She started at fourteen, from nothing, and it was not too late.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 25, 1917, Newport News VA, raised Yonkers NY; loved dancing, took the
//    train to Harlem to watch the theaters; mother Tempie died early 1932 (Ella was 14) after a car
//    accident; passed to an aunt in Harlem, grades collapsed, ran lookout errands; sent to the NY
//    State Training School for Girls at Hudson (reform school; girls were beaten there — later NYT
//    reporting), got out and did not go back; homeless in Harlem ~1933-34, sang and danced on
//    street corners for change; Nov 21, 1934, age 17, Apollo Amateur Night — entered intending to
//    dance, followed the professional Edwards Sisters dance act, froze, sang "Judy" and "The Object
//    of My Affection" in the style of Connee Boswell instead, won first prize; the promised week's
//    booking was withheld over her unkempt appearance; Chick Webb's band took her in 1935 (Webb and
//    his wife informally looked after her); "A-Tisket, A-Tasket" (1938, age 21) made her a star;
//    13 Grammys; d. 1996.
//  Interpretive: "becoming invisible, and she knew it" street framing; "luck you only get if you
//    put your name in." Grounded.
//  Avoid saying: don't name Ella / the Apollo / Harlem / Chick Webb / song titles / Connee Boswell
//    before the bridge; reform-school violence in one non-graphic line; don't linger on what street
//    survival required; no "First Lady of Song" before the bridge.
const fitzgerald_e: FigureStageRow = {
  figureKey: "fitzgerald_e",
  displayName: "Ella Fitzgerald",
  birthYear: 1917,
  deathYear: 1996,
  stageId: "1932-1934-streets-to-amateur-night",
  stageLabel: "Meant to dance: orphaned and homeless to the amateur-night win",
  ageMin: 15,
  ageMax: 17,
  themes: ["dispossession", "solitude", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "She lost her mother at fourteen, was sent away to a place that treated her like a criminal, and ended up singing on street corners for change with nowhere to sleep.",
    "At seventeen she walked onto the hardest amateur stage in the city planning to dance, froze in the lights, and sang instead — and the room went still.",
    "The homeless girl they wouldn't book became the most celebrated singer of her century.",
  ],
  facets: {
    emotionalCore:
      "Being sixteen with no mother, no address, and no one responsible for her, and feeling herself turning invisible on streets full of people.",
    decisionShape:
      "Whether to keep surviving small and unseen, or to put her name in and walk onto a stage in front of a merciless crowd with nothing prepared and find out if she was anything.",
    triggerEvent:
      "Her mother died suddenly when she was fourteen, and within two years she had gone from a family kitchen to a state reform school to no roof at all.",
    agencyState:
      "She had no home, no family watching, and no training — only the steps and songs she'd taught herself, and the nerve to enter anyway.",
  },
  biographicalFacts:
    "Ella Fitzgerald was born April 25, 1917, in Newport News, Virginia, and raised in Yonkers, New York, by her mother, Tempie. As a girl she loved dancing above everything; she and her friends took the train into Harlem to watch the acts at the big theaters, and she planned to be a dancer. In early 1932, when Ella was fourteen, her mother died from injuries connected to a car accident. Ella was passed to an aunt in Harlem; her grades collapsed, she stopped attending school, and after run-ins with the authorities — she ran errands and kept lookout in her neighborhood's informal economy — the state sent her to the New York State Training School for Girls at Hudson, a reform school where, as later investigations reported, girls were routinely beaten. She got out and did not go back, and through 1933-34 she was homeless in Harlem in the depths of the Depression, singing and dancing on street corners for change and sleeping where she could. On November 21, 1934, at seventeen, she was drawn to perform at Amateur Night at the Apollo Theater. She had entered intending to dance, but the act before her was the Edwards Sisters, a polished professional dance duo, and she froze in the lights. As the notoriously unforgiving crowd began to rumble, she asked the band for \"Judy,\" a song her mother had loved, and sang it in the style of Connee Boswell, then sang \"The Object of My Affection.\" She won first prize. The prize was supposed to include a week's engagement at the theater; the management withheld it because of her disheveled appearance. In 1935 the drummer and bandleader Chick Webb reluctantly gave her a tryout and then a place in his band — he and his wife informally took the teenaged Ella under their care. Her playful 1938 recording of \"A-Tisket, A-Tasket,\" made at twenty-one, became a national sensation. She went on to win thirteen Grammy Awards and to be called the First Lady of Song. She died June 15, 1996.",
  sources: [
    "Nicholson, Stuart. Ella Fitzgerald: A Biography of the First Lady of Jazz (New York: Scribner, 1994), Chapters 1-2.",
    "Bernstein, Nina. \"Ward of the State: The Gap in Ella Fitzgerald's Life.\" The New York Times, June 23, 1996.",
    "Ella Fitzgerald Charitable Foundation, official biography.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The dancing dream, the train rides to watch the theaters, life with her mother, the sudden death when she was fourteen — documented.",
      text: `There was a girl who loved to dance.

She grew up just outside the big city, in a busy apartment with her mother, who worked hard and loved her. On good days the girl and her friends rode the train into the city to watch the dancers at the famous theaters, and she came home and practiced the steps on the sidewalk until dark. People said she was good. She believed them. Dancing was going to be her thing.

Then, when she was fourteen, her mother died. Suddenly. An accident, and then gone.

And the floor under her life just went.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Passed to an aunt, school collapse, reform school where girls were beaten (documented in later reporting), getting out, homelessness — documented. One non-graphic line on the beatings.",
      text: `Everything came apart fast, the way it does when a kid loses the one person holding things together.

She was passed to a relative. It didn't take. She stopped going to school, got into trouble, and the state stepped in — and the state's answer was to send her away to a reform school upstate. High windows, hard rules. Girls got beaten there for small things.

She got out. She did not go back.

Which left her sixteen, in the middle of the worst years anyone could remember, with no mother, no address, and no one in the world responsible for her. She sang and danced on street corners for coins. She slept where she could. She stopped looking after herself, because there was no one to look after herself for.

She was turning invisible, and she knew it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The famous amateur night, names drawn by lot, the merciless crowd, her plan to dance — documented. 'Luck you only get if you put your name in' is editorial framing.",
      text: `The theaters were still there. The music was still there.

The most famous theater in her part of the city ran a contest night for amateurs. Anyone could put a name in. Once a week, somebody's name got pulled, and that somebody got a stage and a crowd famous for two things: loving you loudly, or letting you know — fast — that they didn't.

She put her name in. The plan was to dance. Dancing was the thing she trusted.

Her name came up.

That's luck. But it's the kind of luck you only get if you put your name in.

She was seventeen, wearing what street life had left her, and she had one night and one stage.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The months of street survival preceding the contest; corner performing for change; staying near the music — documented in outline; compressed here.",
      text: `Getting to that night had taken everything she had.

Months of corners and coins. Of singing to strangers' backs while they walked past. Of counting change to see if she ate. Of finding a place to sleep and then finding another one when that one fell through.

Nobody was coming for her. She knew nobody was coming. The city was full of people surviving, and one skinny girl who used to have a mother and a plan was nobody's business.

But she stayed near the music. Whatever else the streets took, she kept the steps and she kept the songs — her mother's records still playing in her head.

It wasn't hope, exactly. It was closer to a habit she refused to drop.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The documented amateur night: followed a professional dance duo, froze, crowd rumbled, asked the band for a song her mother loved, sang, won first prize. Encore detail simplified.",
      text: `The act right before her: two sisters who danced for a living. Sequins, speed, polish — the best dancing the crowd had seen in weeks.

And she was supposed to walk out there next, in street clothes, and dance.

She stood in the lights and could not move. The crowd started to rumble. At that theater, they did not wait politely.

And then something in her decided. Not the feet. The voice.

She asked the band for a song her mother used to love, and she closed her eyes and sang it.

The room went still. Then it went up.

They wouldn't let her leave after one. She sang another. When the night ended, the homeless girl who had come to dance had won the whole thing.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Prize's week engagement withheld over her appearance; a famous bandleader and his wife took her in months later; the 1938 novelty hit at 21; six decades of singing — documented, kept anonymous.",
      text: `The prize was supposed to include a week performing at that theater. They kept that part back — they looked at how the streets had left her and decided she didn't look the part.

It stung. It didn't matter. Word gets around.

Within months, a famous bandleader gave the orphan girl a tryout, and then a place in the band. He and his wife looked after her like family — the first family arrangement she'd had since her mother died. Within a few years she recorded a playful little song built on a nursery rhyme, and it made her the most famous young singer in the country.

She sang for six more decades. Presidents, palaces, every great stage on earth.

The girl who froze before the dance became, by nearly everyone's account, the greatest singer her country ever produced.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Ella Fitzgerald.

The First Lady of Song. Thirteen Grammys, a voice musicians still study like scripture, and the definitive recordings of the American songbook. All of it runs back to one night when a homeless seventeen-year-old meant to dance, froze, and opened her mouth instead. None of it had happened yet while she was sleeping wherever the day left her.

Your life is not theirs. But a piece of this story may still sit beside you.

She was about as alone as a person can be. No family holding her, no address, no plan that had survived contact with her life. What she had was one thing she could do — and the nerve to put her name in.

Feeling invisible now doesn't mean staying invisible. She put her name in. Yours can go in too.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Feb 20, 1927 (Miami, prematurely, to Bahamian parents); raised on Cat Island and
//    Nassau (no electricity, little schooling); Miami at 15; NYC winter 1943 at 16 with a few
//    dollars, slept in a bus-terminal pay washroom / rooftops; dishwasher; brief underage Army stint
//    (Nov 1943 - Dec 1944); ~1945 (18) saw the American Negro Theatre's notice next to the
//    dishwasher want-ads, auditioned, read haltingly in a thick island accent, and was marched out
//    by Frederick O'Neal with words to the effect of "get a job as a dishwasher or something" — the
//    job he already had; bought a cheap radio and spent ~6 months repeating announcers (he cited
//    Norman Brokenshire) to flatten the accent; an elderly Jewish waiter at his restaurant sat with
//    him nightly helping him read the newspaper (Poitier said he never found him again to thank);
//    reapplied ~6 months later, traded janitor work for classes/a place at the theatre; understudy
//    to Belafonte; Broadway (Lysistrata, 1946); first Black man to win the Best Actor Oscar (1964,
//    Lilies of the Field). d. 2022.
//  Interpretive: "the accuracy stung worse than the no"; "a snapshot, not a prophecy." Grounded in
//    his memoirs' account of the humiliation.
//  Avoid saying: don't name Poitier / the American Negro Theatre / Belafonte / the Oscar-first
//    before the bridge; the audition rejection was about reading + accent (keep it that, not race);
//    no film titles; "island" is fine, "Bahamas" is not.
const poitier: FigureStageRow = {
  figureKey: "poitier",
  displayName: "Sidney Poitier",
  birthYear: 1927,
  deathYear: 2022,
  stageId: "1943-1945-dishwasher-to-second-audition",
  stageLabel: "Go be a dishwasher: the audition rejection and the radio nights",
  ageMin: 16,
  ageMax: 18,
  themes: ["dismissed", "worthlessness", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "He was thrown out of his first audition and told to go wash dishes — which was the job he already had — and he spent six months rebuilding his voice and his reading so he could walk back through the same door.",
    "Every night after the dishes he repeated the radio word by word to iron out his accent, and an old waiter taught him to read the newspaper across the counter.",
    "The boy a stranger summed up in ninety seconds became the most honored actor of his generation.",
  ],
  facets: {
    emotionalCore:
      "The shame of having a stranger size up his entire future in one minute — and half agreeing with him, which was the part that actually hurt.",
    decisionShape:
      "Whether to accept the small life a stranger had assigned him, or to rebuild the two things he had been mocked for — his voice and his reading — from nothing, at night, alone.",
    triggerEvent:
      "He was marched out of his first audition and told to go get a job washing dishes, which was exactly the job he already had.",
    agencyState:
      "Almost no schooling, an accent that marked him the moment he spoke, a job scrubbing plates — and full command of his own evenings, which turned out to be enough.",
  },
  biographicalFacts:
    "Sidney Poitier was born prematurely on February 20, 1927, in Miami, to Bahamian parents, and grew up poor on Cat Island and in Nassau in the Bahamas, with very little formal schooling. At fifteen he was sent to Miami; at sixteen, in the winter of 1943, he arrived in New York City with only a few dollars, sleeping at first in a pay washroom of a bus terminal and on rooftops, and finding work washing dishes. He served briefly in the Army (having lied about his age) from late 1943 to the end of 1944, then returned to dishwashing. Around 1945, at eighteen, he spotted an audition notice for the American Negro Theatre in the newspaper near the dishwasher want-ads. At the audition he stumbled through the reading — his schooling had stopped young and his Bahamian accent was heavy — and the director, Frederick O'Neal, angrily marched him out, telling him to stop wasting people's time and go get a job as a dishwasher or something. Poitier, who was a dishwasher, was stung most by the accuracy: a stranger had read the entire size of his life in about ninety seconds. He resolved to become an actor to disprove him. He bought a cheap radio and spent months listening to announcers — he later credited Norman Brokenshire — repeating everything they said, hour after hour, to flatten his accent; at the restaurant, an elderly Jewish waiter sat with him after closing, night after night, helping him read the newspaper (Poitier later said he never found the man again to thank him). About six months later he auditioned again, and worked as the theatre's janitor in exchange for acting classes. He understudied Harry Belafonte, was cast in a Broadway production of Lysistrata in 1946, and went on to a film career in which, in 1964, he became the first Black man to win the Academy Award for Best Actor. He died January 6, 2022.",
  sources: [
    "Poitier, Sidney. This Life (New York: Alfred A. Knopf, 1980).",
    "Poitier, Sidney. The Measure of a Man: A Spiritual Autobiography (San Francisco: HarperSanFrancisco, 2000).",
    "Goudsouzian, Aram. Sidney Poitier: Man, Actor, Icon (Chapel Hill: University of North Carolina Press, 2004), Chapters 1-2.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Island childhood, arrival at 16 with a few dollars, the bus-terminal washroom nights, dishwashing work — all documented in his memoirs.",
      text: `There was a young man washing dishes in the back of a restaurant in the biggest city in the country.

He had grown up far away, on a small island — a place with no electricity, hardly any cars, no movie houses. He'd arrived in the city at sixteen with a few dollars in his pocket. The cold stunned him; he'd never owned a winter coat. The first nights, he slept in a washroom stall at the bus terminal because it was warm and it locked.

He found work the way new arrivals do: dishes. Sink after sink, night after night. The work was honest and it was going nowhere, and he knew both of those things.

He was eighteen now, and looking — the way you look at that age — for any door at all with his name on it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The documented first audition: halting reading, heavy accent, marched out with 'go get a job as a dishwasher or something.' The 'accuracy' framing is from his own retrospective telling.",
      text: `One day, in the paper, right next to the dishwasher want-ads he was already reading, he saw a notice: a theater company was looking for actors.

He had barely ever seen a play. But that page was full of jobs that wanted nothing from him, and this one said wanted. He went.

They handed him a script. He could barely read it — his schooling had stopped young, and the words came out slow and broken, in an island accent thick enough to touch.

The man running the audition stopped him partway through. Came up on the stage. Took him by the arm, walked him to the door, and told him to quit wasting people's time — go get a job as a dishwasher or something.

The man had no way of knowing that was exactly the job he had.

Standing on the sidewalk afterward, that was the part he couldn't swallow. Not the no. The accuracy. A stranger had looked at him for ninety seconds and correctly measured his entire life.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His documented resolve to disprove the assessment; the cheap radio and the nightly repeat-after-the-announcers practice.",
      text: `Somewhere on the walk home, the sting cooled into something harder and more useful.

He decided the stranger was not going to stay right about him. Not because he loved acting — he barely knew what acting was. Because he refused to be a man whose whole future could be read in ninety seconds.

He broke the problem into its two names: the reading, and the accent. Problems with names can be worked on.

He bought a cheap radio. And every night after the dishes, alone in his rented room, he turned it on and repeated what the announcers said — the smoothest voices in the country — sentence by sentence, hour after hour, until his mouth learned the new shapes.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The ~6 months of radio nights; the elderly waiter who tutored his reading nightly and was never found again to thank — both documented.",
      text: `It went on for months.

Dishes all day. The radio half the night, the same sentences over and over until they lost their edges.

At the restaurant, an old waiter noticed the newspaper he kept trying to read and started sitting with him at the counter after closing. Night after night, a paragraph at a time, the old man walked him through it — patiently, asking nothing in return. Years later he would look for that waiter, to thank him. He never found him.

Progress was slow and invisible, the way real progress usually is. His voice flattened out. The words started to flow.

Nobody was watching him get better. That's the loneliest kind of getting better. He kept at it anyway.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The second audition ~6 months later and the documented janitor-for-classes arrangement; understudy work following. 'Raw as timber' is texture.",
      text: `Six months after being marched out the door, he walked back through it and asked to try again.

He read again. The accent was nearly gone. The words came smooth and level. He wasn't good yet — he was raw as fresh-cut timber — but he was no longer dismissible. And the distance between those two things was every night he'd spent with the radio.

They still didn't quite take him. So he offered a deal: he would clean the theater — mop it, haul for it, lock it up — in exchange for classes and a place inside.

They took the deal.

He was in the building. That was all he had wanted: to be inside, where the work was, instead of outside being summarized by strangers.

The rest — an understudy's chance, a first role, a director who noticed — followed the way it does once you're inside.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Stage to films to carrying films; the deliberate dignity of his role choices; the top prize of his profession — documented, kept anonymous (the 'first' is saved for the bridge).",
      text: `Within a couple of years he was acting professionally on stage. Within ten he was in films — and then he was carrying films, as a leading man, in an industry that had never made room for a man like him at the top of the bill.

He chose his roles the way a careful man builds an argument: dignity, intelligence, no clowning, no shuffling. A whole generation of moviegoers met, in him, a kind of leading man the movies had simply refused to imagine before.

And one spring evening, in front of the entire industry, he won the highest honor his profession gives an actor.

The young man marched off a stage for how he read had become, by most reckonings, the most important actor of his era.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Sidney Poitier.

In 1964 he became the first Black man to win the Academy Award for Best Actor. He broke the color line of American movies and stood, for fifty years, for a kind of dignity the screen had never been allowed to show. He was knighted. Presidents honored him. And once, a man threw him out of an audition and told him to go wash dishes. None of the rest had happened yet that night on the sidewalk.

Your life is not theirs. But a piece of this story may still sit beside you.

A stranger measured him in ninety seconds, and the measurement was accurate — that day. So he went home and changed what was true, quietly, at night, with a radio and a borrowed newspaper, until the measurement was wrong.

What someone sees in you today is a snapshot. It is not a prophecy. He's the proof.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Eunice Kathleen Waymon, Feb 21, 1933, Tryon NC, sixth of eight; church-piano
//    prodigy from ~3; her piano teacher (Muriel Mazzanovich, "Miss Mazzy") organized the Eunice
//    Waymon Fund — neighbors' collected money — to pay for her training; the stated plan: to be
//    the first Black concert pianist on America's great stages; summer 1950 (17) Juilliard prep
//    year; family moved to Philadelphia on the strength of the Curtis plan; April 1951 (18)
//    Curtis Institute audition — rejected (3 of ~75 admitted); she believed lifelong the reason
//    was race (Curtis never said; the motive is unverifiable and the beats keep that honest);
//    1951-54 taught children piano and accompanied a voice teacher's students; summer 1954 (21)
//    Midtown Bar & Grill, Atlantic City — took the name "Nina Simone" (niña + Simone Signoret) to
//    keep it from her Methodist-minister mother, for whom bar music was the devil's; first night
//    the owner (Harry Steward) told her she'd sing as well as play or lose the job — she had never
//    sung; "I Loves You, Porgy" hit the national top 20 in 1958 (age 25); Curtis awarded her an
//    honorary diploma in 2003, days before her death.
//  Interpretive: "the plan died in one envelope"; "the side door was hers." Grounded in her
//    autobiography.
//  Avoid saying: don't name Simone / Eunice / Curtis / Juilliard / Philadelphia / Atlantic City /
//    song titles before the bridge; do NOT assert the rejection WAS racial — render her lifelong
//    belief and the school's silence; "High Priestess of Soul" only in the bridge.
const simone: FigureStageRow = {
  figureKey: "simone",
  displayName: "Nina Simone",
  birthYear: 1933,
  deathYear: 2003,
  stageId: "1950-1954-curtis-no-to-the-bar",
  stageLabel: "The letter said no: the conservatory rejection to the night she sang",
  ageMin: 17,
  ageMax: 21,
  themes: ["dismissed", "shame", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "The conservatory she had spent her childhood training for said no, and the plan her whole town had paid for died in one afternoon — so she kept playing, in a bar, under a name her mother wouldn't recognize.",
    "She was ashamed of the rooms she played in and convinced the refusal had been about her skin, and she kept her hands on the keys anyway.",
    "The night an owner told her to sing or lose the job, she found the voice the world would know her by.",
  ],
  facets: {
    emotionalCore:
      "The grief of one closed door killing a plan an entire town had paid for, and the shame of hiding what she did next from the person she most wanted to make proud.",
    decisionShape:
      "Whether to quit music when the approved path was refused, or to keep playing in whatever room would have her, under whatever name it took.",
    triggerEvent:
      "The conservatory she had trained her whole childhood for turned her down, after her family had moved to a new city on the strength of the plan.",
    agencyState:
      "The sanctioned dream was dead and the fund was spent, but the skill was still hers, and nobody could take the piano out of her hands.",
  },
  biographicalFacts:
    "Nina Simone was born Eunice Kathleen Waymon on February 21, 1933, in Tryon, North Carolina, the sixth of eight children of a Methodist minister mother. A prodigy, she began playing piano in church around age three. Her piano teacher, Muriel Mazzanovich — \"Miss Mazzy\" — believed in her so completely that she organized the Eunice Waymon Fund, money collected from the townspeople, to pay for the girl's classical training. The plan was spoken aloud throughout her childhood: Eunice would become the first great Black concert pianist on America's classical stages. In the summer of 1950, at seventeen, she studied in the preparatory program at Juilliard in New York, and her family relocated to Philadelphia in anticipation of her enrolling at the Curtis Institute of Music. On April 7, 1951, at eighteen, she auditioned at Curtis; about seventy-five pianists auditioned that year and only three were admitted. She was rejected. She believed for the rest of her life that the decision was about the color of her skin; the school never gave a reason, and the true motive is unverifiable. The rejection ended the plan her town had funded and her family had moved for. From 1951 to 1954 she stayed in music at its smallest scale — teaching piano to children and accompanying the students of a voice teacher. In the summer of 1954, at twenty-one, she took a job playing piano at the Midtown Bar & Grill in Atlantic City, and to keep her Methodist-minister mother from learning she was playing in a bar, she worked under an invented name: Nina Simone. On her first night the owner, Harry Steward, told her that if she wanted to keep the job she would have to sing as well as play. She had never thought of herself as a singer. She sang. Within weeks people were coming specifically to hear her. Her recording of \"I Loves You, Porgy\" reached the national top twenty in 1958, when she was twenty-five, and she went on to become one of the most original figures in American music and a fierce voice of the civil rights movement. In 2003, two days before her death, the Curtis Institute awarded her an honorary diploma.",
  sources: [
    "Simone, Nina, with Stephen Cleary. I Put a Spell on You: The Autobiography of Nina Simone (New York: Pantheon, 1991), Chapters 1-3.",
    "Cohodas, Nadine. Princess Noire: The Tumultuous Reign of Nina Simone (New York: Pantheon, 2010), Chapters 1-4.",
    "Light, Alan. What Happened, Miss Simone? (New York: Crown Archetype, 2016).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Church prodigy from ~3; the teacher-organized town fund; the spoken plan of the classical stage — all documented.",
      text: `There was a girl from a small mountain town who could really play the piano.

She'd started at three, in church, feet dangling off the bench. By the time she was in school, the whole town knew what they had. Her piano teacher believed in her so hard that she went door to door and raised a fund — actual collected money, from neighbors who didn't have much — to pay for the girl's classical training.

The plan was said out loud, all through her childhood: this girl was going to be a concert pianist. A real one, in the great halls, in a country that had never yet allowed someone like her onto those stages.

She practiced like it was a religion. The town had paid for a dream, and she intended to deliver it whole.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The 1951 rejection (3 of ~75 admitted); the family's move made in anticipation; her lifelong belief about the reason and the school's silence — documented, rendered without asserting the motive.",
      text: `At eighteen, she auditioned for the great conservatory that was the next step — the whole point of everything. Her family had already moved north to a new city on the strength of the plan.

The answer was no.

Dozens of pianists had tried for a handful of places, so a no was always possible. But she had been the prodigy her entire life, and she could not make the no make sense — until she found the one explanation that, in the country she lived in, made a terrible kind of sense: the color of her skin.

Was that the reason? The school never said. She believed it was, to the last day of her life.

Either way, the dream her town had collected coins for, the dream her family had moved for, died in one afternoon, in one envelope.

She was eighteen, and the plan for her whole life was over.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 1951-54 teaching and accompanist years — documented. 'Hands went to the keys the way lungs go to air' is texture.",
      text: `She didn't stop playing. That part never seemed to be a decision — her hands went to the keys the way lungs go to air.

But she stopped being the town's dream and became a working musician nobody had heard of. She taught scales to children in the afternoons. She played accompaniment for a voice teacher's students — other people's auditions, other people's dreams, at her fingertips, hour after hour.

It was smaller than the plan. It paid.

And it kept her hands strong while the rest of her worked out what a life is supposed to be when the approved version is refused.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Three years of small music work; the Atlantic City bar offer; the invented name to hide the work from her minister mother — all documented.",
      text: `Three years went by like that.

Children's lessons. Other people's recitals. She kept some training going on the side, because she hadn't fully let go — maybe another audition someday. Maybe the plan could still be revived.

Then came a summer job offer: playing piano in a bar, in a beach town, nights. Real money — more than teaching paid by a long way.

A bar. Her mother was a minister. In her mother's house, that music, in that kind of room, was the devil's own payroll. If word ever got home —

She took the job. And to make sure word never traveled, she invented a new name to work under. Something a little foreign, a little glamorous. A mask.

Her first night, she sat down at the bar's piano as a person who did not officially exist.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The documented first-night ultimatum from the owner — sing or lose the job — and the voice that resulted; crowds coming specifically for her within weeks.",
      text: `She played that first night straight through — hours of it, classical runs threaded into popular tunes, everything she had in her hands.

At the end of the night the owner came over. She figured she'd done well.

He told her: fine, but if you want to keep this job, you sing too.

She had never been a singer. Singing was not the plan — the piano was the last piece of the old dream still standing, even here, even in a bar.

But the job was the job. The next night, she sang.

And the voice that came out — low, dark, unhurried, like nothing else in the room — was a thing she had never known she owned. People put their drinks down to listen.

Within weeks, they were coming just for her. For the voice. For the name that had started as a mask and was quickly becoming more real than the old one.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Bar seasons to clubs to a national top-20 record at 25; the fused style; the honorary diploma from the same conservatory days before her death — all documented, kept anonymous.",
      text: `The bar summers turned into club bookings. The club bookings turned into a record. Before she was twenty-six, one of her songs was on the national charts.

She became a category of one in American music — not jazz exactly, not blues exactly, not classical exactly, but all of it fused together at her piano, under the invented name. She filled the great halls after all. Her own way, on her own terms, singing.

And near the end of her life, the conservatory that had said no gave her an honorary diploma. It arrived days before she died.

Late is late. But by then, even they knew exactly who they had turned away.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Nina Simone.

The High Priestess of Soul — one of the most original voices in the history of American music, and later one of the fiercest voices of the civil rights movement. The name she invented to hide a bar job from her mother is the name the whole world knows her by. None of that existed yet on the afternoon the envelope came and the plan died.

Your life is not theirs. But a piece of this story may still sit beside you.

The door she had aimed her entire life at stayed shut, and it broke something in her that never fully healed. The life she actually got came through a side door she took half in shame, under a fake name, just to pay for things. The side door turned out to be hers.

The plan you lose is not always the life you lose. Sometimes it's the life making room.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 2, 1805, Odense, shoemaker's son; to Copenhagen at 14 chasing the theater;
//    patron Jonas Collin secured royal funding for grammar school — Slagelse 1822 (age 17), placed
//    with 11-year-olds; headmaster Simon Meisling picked on him in every lesson and humiliated him
//    before the class; writing poetry was forbidden during his schooling; boarded in Meisling's own
//    house from 1825; moved with the Meislings to Elsinore 1826; wrote "The Dying Child" in secret
//    during the Elsinore period; his letters to Collin long hid the abuse; Collin removed him in
//    1827 (age 22) and arranged private tuition; university entrance exam 1828; first fairy tales
//    1835 (age 30); he said "The Ugly Duckling" was about himself. d. 1875.
//  Interpretive: "believing the headmaster a little" as the core wound; the school-as-his-one-
//    chance dread that kept him silent. Grounded in his diaries and letters.
//  Avoid saying: don't name Andersen / Denmark / Copenhagen / Slagelse / Meisling / Collin / any
//    fairy-tale title before the bridge; keep him "the boy" not "the writer"; no era-marking
//    theater/patronage detail beyond "people paying for his school."
const andersen: FigureStageRow = {
  figureKey: "andersen",
  displayName: "Hans Christian Andersen",
  birthYear: 1805,
  deathYear: 1875,
  stageId: "1822-1827-the-headmasters-school",
  stageLabel: "The headmaster's target: five years of humiliation at school",
  ageMin: 17,
  ageMax: 22,
  themes: ["bullied", "worthlessness", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He was seventeen in a classroom of eleven-year-olds, and the headmaster made a daily sport of humiliating him — and because the school was his one chance, paid for by other people, he took it and stayed.",
    "He was forbidden to write, mocked for his looks and his voice and his dreams, and he began to believe the man was right about him.",
    "The boy the headmaster called stupid kept writing in secret, and became the most beloved storyteller in the world.",
  ],
  facets: {
    emotionalCore:
      "Believing his tormentor a little — that he really might be the stupid, ridiculous boy the man described every day — while being unable to leave, because this was his only chance.",
    decisionShape:
      "Whether to run from the school that was crushing him and lose everything people had paid for, or to endure years of daily humiliation for the education inside it.",
    triggerEvent:
      "A patron's money sent him to a grammar school at seventeen, years behind the children in his class, under a headmaster who chose him as a target.",
    agencyState:
      "He was poor, dependent on other people's charity, forbidden even to write — but they could not stop him from keeping words in his head and, once, on paper in secret.",
  },
  biographicalFacts:
    "Hans Christian Andersen was born April 2, 1805, in Odense, Denmark, the son of a poor shoemaker who died when Hans was eleven. At fourteen he went alone to Copenhagen to seek his fortune in the theater; he failed as a performer, but his strange talent attracted patrons, and Jonas Collin of the Royal Theatre secured royal funds to send him to grammar school. In 1822, at seventeen, he entered Slagelse Grammar School, placed in a class with boys around eleven years old. The headmaster, Simon Meisling, a classical scholar, made the gangly, sensitive, years-behind Andersen his target — picking on him in lessons and humiliating him in front of the class — and Andersen was banned from writing poetry so he would focus on his studies. From 1825 he boarded in Meisling's own house, so the torment followed him home; in 1826 he moved with the family to Elsinore when Meisling took over the school there, leaving him still more isolated. During the Elsinore period he broke the rule in secret and wrote \"The Dying Child,\" which became one of his most famous early poems. For years his letters to Collin politely hid how cruel the school was. When the truth finally reached Collin, he removed Andersen from the school in 1827 and arranged private tuition in Copenhagen; Andersen passed his university entrance examination in 1828 and began publishing. His first fairy tales appeared in 1835, when he was thirty, and made him, in time, the most famous writer in the world; he said of \"The Ugly Duckling\" that the story was about his own life. He died August 4, 1875.",
  sources: [
    "Andersen, Hans Christian. The Fairy Tale of My Life (Mit Livs Eventyr, 1855).",
    "Wullschlager, Jackie. Hans Christian Andersen: The Life of a Storyteller (New York: Knopf, 2001), Chapters 3-4.",
    "Hans Christian Andersen Centre, University of Southern Denmark, \"Schooling\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Placed at 17 with ~11-year-olds; the school funded by patrons as his one chance; his oddness and poverty — documented.",
      text: `There was a boy of seventeen sitting in a classroom of eleven-year-olds.

He was poor — his father had been a shoemaker, and dead a long time. He was odd-looking and too tall, with a high voice and big dreams he couldn't keep quiet about. Kind people who believed there was something in him had raised money to send him to this school. It was, and everyone said so, his one chance in life.

He was years behind the children around him. Latin, grammar, everything — the little boys knew things he didn't. He'd had almost no schooling at all.

So he sat where they put him, folded up at a small desk, grateful and terrified, determined to earn the chance.

The headmaster had other plans for him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Meisling's documented daily mockery in lessons; the ban on writing; boarding in the headmaster's house from 1825 so there was no escape. 'Believing him a little' is grounded in his diaries.",
      text: `The headmaster made the boy his sport.

Every lesson, in front of the class, he had something: the boy's looks, his voice, his slowness, his dreams. He called him stupid — day after day, in front of the little boys, who learned the game and laughed along. He said the boy would never amount to anything.

Writing was the one thing the boy loved, so writing was forbidden. Waste of a fool's time, the man said. Focus on your Latin.

Then it got worse: the boy was moved into the headmaster's own house as a boarder. Now the voice that ruled his days sat across from him at supper too. There was no room in his life the man didn't reach.

And here is the darkest part: the boy began to believe him. Maybe he was stupid. Maybe the kind people had wasted their money.

He didn't tell them. This was his one chance. He wrote polite letters home saying he was fine.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "He stayed and endured (leaving meant losing everything his patrons paid for); wrote 'The Dying Child' in secret during the Elsinore years — documented.",
      text: `He stayed.

Not because he was brave in any grand way. Because leaving meant losing everything — the school, the funding, the one door anyone had ever opened for him. So he got up every morning and took it, and did his Latin, and let the man have his sport.

But one rule he broke.

Once, in secret, he wrote a poem. Quietly, where no one would find him doing it. It was about a child who was dying — a small, sad, tender thing, nothing like his Latin exercises.

He kept it hidden. But he kept it.

If the man was right about him, the poem was pointless. He wrote it anyway. Some part of him refused to hand over the verdict.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The 1826 move with the Meislings to a new town; deeper isolation; years of hiding the truth in his letters — documented.",
      text: `Years passed like that.

The headmaster took over a school in another town and moved his household with him — including the boy. New town, same table, same voice. Farther now from anyone who knew him. The loneliness closed in until the days all had the same gray taste.

Five years, nearly. From seventeen to almost twenty-two — years other people spend becoming themselves — spent being told daily what he could never become.

His letters to his patron stayed polite. Everything is fine. I am working hard. He was ashamed to say the truth, and afraid of it too: complain, and maybe the money stops. Maybe the chance closes.

But the truth has a way of traveling on its own.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Word of Meisling's cruelty finally reached Collin (via others and Andersen's own appeals); removal in 1827; private tuition; passed the university exam — documented.",
      text: `Word of what the school really was finally reached the man who paid for it.

Others had seen it — a teacher who knew the headmaster, people who had watched the daily sport with growing disgust. And the boy, at last, stopped protecting everyone and told the truth.

His patron pulled him out at once.

No more headmaster. A private tutor instead — a patient one. And the strangest discovery: away from the daily grinding-down, the boy could learn. Quickly, even. The next year he passed the university entrance examination that was supposed to be beyond him.

The stupid boy, the hopeless boy, the boy who would never amount to anything, had passed.

He walked out of that chapter of his life carrying two things: an education, and a bone-deep knowledge of what it feels like to be small in a room where someone bigger sets the rules.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Poems and novels first; the fairy tales from 1835 onward; world fame in his lifetime — documented, kept anonymous.",
      text: `He began to publish. Poems first, then travel books, then novels. People noticed.

And then, in his thirties, he began writing something else — little stories, the kind you'd tell a child at bedtime. Simple words. Strange, sad, funny, true. Stories about tin soldiers and mermaids and emperors with no clothes. About the small and the mocked and the overlooked, and what becomes of them.

The little stories went around the world. They have never stopped going around the world.

Kings invited him to dinner. The country that had known him as a shoemaker's odd son came to treat him as its treasure. Children on every continent grew up inside his sentences, and still do.

Every story kind to the laughed-at came from somewhere. He knew exactly where.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Hans Christian Andersen.

He wrote The Little Mermaid, The Emperor's New Clothes, The Snow Queen, Thumbelina — fairy tales told in every language on earth. And he said himself that one of them, The Ugly Duckling — the odd, mocked bird who was never a duck at all — was his own story. None of it existed yet in the years when a grown man made a classroom laugh at him every day.

Your life is not theirs. But a piece of this story may still sit beside you.

He spent five years being told, daily, by the person with all the power in the room, exactly what he was worth. He half believed it — that's what those voices do. But only half. The other half wrote a poem in secret.

The loudest voice in the room is not the truth about you. It wasn't about him.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 24, 1925, Fairfax OK, Osage Nation (father Osage; family had oil-lease
//    income); serious piano and ballet training from early childhood, family moved to LA at 8;
//    moved to NYC 1942 at 17, joined Ballet Russe de Monte Carlo; director Sergei Denham suggested
//    she Russianize her name to "Tallchieva" (standard practice — American dancers took Russian
//    names to be booked); she refused: "Tallchief was my name, and I was proud of it"; endured
//    anti-Native mockery in the company (her memoir records war-whoop jokes and scalping cracks);
//    corps years of wartime touring; Balanchine arrived as choreographer 1944 and began casting
//    her; she was the first American to dance with the Paris Opera Ballet (1947, age 22);
//    Balanchine made Firebird on her in Nov 1949 (24), making her America's first prima ballerina.
//    (They married 1946; the marriage is deliberately left out of the beats.) d. 2013.
//  Interpretive: the name-or-career choice as the episode's spine; "twice as precise" corps
//    framing. Grounded in her memoir Maria Tallchief: America's Prima Ballerina.
//  Avoid saying: don't name Tallchief / Osage / Oklahoma / Balanchine / Firebird / Paris before
//    the bridge; don't fabricate poverty (the family had oil money); no marriage subplot; keep the
//    mockery brief and un-lurid.
const tallchief: FigureStageRow = {
  figureKey: "tallchief",
  displayName: "Maria Tallchief",
  birthYear: 1925,
  deathYear: 2013,
  stageId: "1942-1947-the-name-stays",
  stageLabel: "The name stays: refusing Tallchieva in a Russian ballet world",
  ageMin: 17,
  ageMax: 22,
  themes: ["social_constraint", "quiet_defiance", "dismissed"],
  antiThemes: [],
  shapeSentences: [
    "At seventeen she joined a company where every serious dancer had a Russian name, and the management told her to trade hers in — and she refused, and set out to be too good to ignore under the name she was born with.",
    "She was mocked for where she came from and treated as a novelty in the corps, and she answered by being twice as precise as anyone in the room.",
    "The girl who wouldn't change her name became her country's first great ballerina — under that name.",
  ],
  facets: {
    emotionalCore:
      "Being told the truest thing about her — her name, her people — was a career liability to be erased, and deciding the price of belonging was too high if it cost who she was.",
    decisionShape:
      "Whether to take the Russian-sounding name that would smooth her path, or to keep the name her family gave her and force the field to accept it.",
    triggerEvent:
      "The company's management suggested she Russianize her name because no one would take an American — let alone a Native American — ballerina seriously.",
    agencyState:
      "A teenager at the bottom of a rigid company, with no say in casting and no allies in power — but complete say over one thing: what she would answer to.",
  },
  biographicalFacts:
    "Maria Tallchief was born Elizabeth Marie Tall Chief on January 24, 1925, in Fairfax, Oklahoma, a citizen of the Osage Nation; her family's oil-lease income paid for serious piano and ballet training, and the family moved to Los Angeles when she was eight to further the children's education. In 1942, at seventeen, she moved to New York City and joined the Ballet Russe de Monte Carlo. Ballet in America was then a Russian world: American dancers routinely took Russian stage names to be cast, and the company's director, Sergei Denham, suggested she become \"Tallchieva.\" She refused — \"Tallchief was my name, and I was proud of it\" — at a time when her Osage heritage drew open mockery inside the company; her memoir records dancers greeting her with war whoops and asking whether her father scalped people. She spent her early years in the wartime corps de ballet, taking class relentlessly and gaining roles as the company's Russian stars moved on. When George Balanchine became the company's choreographer in 1944, he noticed her musicality and precision and began casting her; in 1947, at twenty-two, she became the first American to dance with the Paris Opera Ballet. In November 1949 Balanchine created the lead of his Firebird on her, and its premiere made her America's first prima ballerina — under the name she had refused to give up. She retired in 1966, founded the Chicago City Ballet, and died April 11, 2013.",
  sources: [
    "Tallchief, Maria, with Larry Kaplan. Maria Tallchief: America's Prima Ballerina (New York: Henry Holt, 1997), Chapters 2-5.",
    "Osage Nation and Oklahoma Historical Society biographical materials, \"Tallchief, Elizabeth Maria.\"",
    "National Women's History Museum, \"Maria Tallchief.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Arrival at 17 into the Russian-dominated company; the corps hierarchy; her disciplined training background — documented.",
      text: `There was a girl of seventeen at the barre of a famous touring ballet company.

She had trained her whole childhood for this — hours of piano, hours of ballet, a family that took her talent seriously and moved across the country for it. Now she was in, at the bottom, one girl in the long line of the corps.

The company was run by people from far away, in the old tradition. The stars had names from that faraway country. The teachers did. Even the American dancers did — because in this world, everyone understood, a dancer with a plain American name would not be taken seriously. You took a new name the way you took the right shoes. That was the custom.

She had a name already. It was her father's name, and his father's. Her people had carried it a long time.

She was about to find out what it would cost to keep it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Denham's documented 'Tallchieva' suggestion; the documented in-company mockery of her heritage (war whoops, scalping jokes in her memoir), kept brief.",
      text: `The management called it a small thing.

Just soften the name. Make it sound like it came from the old country — add a few letters, and doors open. Everyone does it. Surely she wanted a career more than she wanted a word.

And around the edges of the company, the other message came in less polite forms. Dancers who greeted her with mock war cries. Jokes about where she came from, about her father, about her people — said lightly, the way cruel things get said in dressing rooms, with a smile she was expected to return.

What they were all saying, politely and not, was the same thing: what you are is a problem. Fix it.

She was seventeen, at the very bottom of the ladder, with no power over casting, no allies in charge, and one career she had spent her whole childhood building.

All she had to do to keep it moving smoothly was erase her own name.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Her documented refusal and its stated ground ('Tallchief was my name, and I was proud of it').",
      text: `She said no.

No speech. No scene. She simply refused. The name was her name. She was proud of it — proud of her father, proud of her people — and she was not going to pretend to be from somewhere else to make strangers comfortable.

If the world of her art wouldn't take the name seriously, she would make the name impossible to ignore. That was the whole plan, and she knew exactly what it meant: everything she did from now on, she would have to do a little better than everyone, because she'd declined the discount.

She went back to the barre.

She took every class. Then she took more.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Wartime corps years, relentless class-taking, gradually inheriting roles as stars departed — documented in her memoir; 'twice as precise' framing is interpretive.",
      text: `The corps years were long.

Touring by train, town after town, dancing in the back lines where nobody watches. Watching the famous names take the bows. Being, to some in the company, a novelty act from the plains — no matter how clean her technique was.

She answered the only way available to a girl with no power: precision. She became relentlessly, unarguably exact. Musical in a way you can't teach. The kind of dancer other dancers stop to watch in class, even while the posters still spelled other people's names.

Slowly, the war and time thinned the company's stars. Roles opened. She was ready for every one of them — she had been ready for years.

And people who mattered had started to notice the girl who wouldn't change her name.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Balanchine's 1944 arrival and his casting of her; the 1947 Paris Opera first — documented; his 'watching class' is standard accounts compressed.",
      text: `A new ballet master arrived to run the company's dances — a quiet genius from the old country, already becoming the most important choreographer alive.

He stood at the front of class and watched. He didn't care about names, old country or new. He cared about music, and whether a body could keep up with what he heard in it.

Hers could.

He began setting roles on her — bigger ones, stranger ones, faster ones. Where others saw a girl from nowhere with an unfashionable name, he saw an instrument nobody had played yet.

Within a few years, she was dancing as a guest on the most storied opera stage in Europe — the first American ever invited to do it. The name they printed in the program, in the city where ballet was practically invented, was her own. Unchanged. Exactly as her father carried it.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Firebird (1949) created on her; first American prima ballerina; later career and teaching — documented, names withheld.",
      text: `Then the choreographer built a ballet on her — on her speed, her attack, her line. A firebird: something untamed and blazing that no one can cage.

Opening night made her, by common consent, her country's first true prima ballerina. Not an American dancing under a borrowed foreign name — an American, with an American name, a name older than the country itself, at the absolute summit of the art.

Little girls who had never seen anyone like her cut her picture out of magazines. Some of them, from her own people and others, became dancers because the picture existed.

She danced for two more decades, then taught for decades more. The name went up on marquees, exactly as it was, for the rest of her life.

They had told her it was a small thing to change. She had understood it was the whole thing.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Maria Tallchief.

A citizen of the Osage Nation, and America's first prima ballerina. Balanchine created Firebird on her; she was the first American to dance at the Paris Opera; and she did all of it after refusing to become "Tallchieva" — after refusing to trade her father's name for an easier road. None of that had happened yet when she was seventeen, at the bottom of the company, being told what she was needed fixing.

Your life is not theirs. But a piece of this story may still sit beside you.

Everyone with power over her career agreed the smart move was to erase a little of herself — just a few letters, just the surface. She bet her whole future the other way: that she could be undeniable as exactly what she was.

The parts of you they call a liability may be the parts history remembers. That's how it went for her.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Nov 14, 1907, Vimmerby (small, pious Swedish town); trainee at the local paper;
//    spring 1926 (age 18) pregnant by Reinhold Blomberg, the paper's married, much older editor
//    (divorce pending; he was ~30 years her senior); scandal risk in the town was severe; the plan
//    was marriage after his divorce — she broke it off and refused; moved alone to Stockholm,
//    secretarial school; traveled to Copenhagen (the one place allowing anonymous birth) and bore
//    Lars ("Lasse") Dec 4, 1926, at 19; left him with foster mother Marie Stevens; visited when
//    train fare allowed while typing for a living; collected Lasse in Dec 1929 (age 22) — he was
//    three and spoke Danish; married Sture Lindgren 1931; Pippi Longstocking published 1945 (37).
//    Biographers connect her books' fierce child-respect to these years. d. 2002.
//  Interpretive: "she said no to the man and the town at once"; the guilt of the train-window
//    goodbyes. Grounded in Andersen's biography and her own late-life accounts.
//  Avoid saying: don't name Lindgren / Pippi / Sweden / Stockholm / Copenhagen before the bridge;
//    no romance framing of Blomberg (older, married, her boss — stated plainly, briefly); never
//    moralize about the pregnancy; the foster mother is rendered kind (she was).
const lindgren: FigureStageRow = {
  figureKey: "lindgren",
  displayName: "Astrid Lindgren",
  birthYear: 1907,
  deathYear: 2002,
  stageId: "1926-1929-the-secret-son",
  stageLabel: "The secret son: pregnant at eighteen to bringing Lasse home",
  ageMin: 18,
  ageMax: 22,
  themes: ["shame", "new_parent_fear", "solitude"],
  antiThemes: [],
  shapeSentences: [
    "She was eighteen, unmarried, and pregnant by a married man in a small pious town, and instead of the respectable rescue everyone expected — marrying him — she said no and boarded a train alone.",
    "She gave birth among strangers in a foreign city and left her son with a kind foster mother, then spent three years typing for a living and visiting him when she could afford the fare, terrified she was failing him.",
    "The girl the town whispered about brought her boy home at last, and grew into the writer whose books took children's side against the whole adult world.",
  ],
  facets: {
    emotionalCore:
      "Carrying a secret the whole town would feast on, and the double guilt of a young mother — ashamed in public, and privately afraid her child was learning to love someone else's arms.",
    decisionShape:
      "Whether to accept the respectable exit — marriage to the much older man — or to refuse him and the town's script both, and carry the consequences alone at eighteen.",
    triggerEvent:
      "She became pregnant at eighteen by her married, much older employer, in a town small enough that the scandal would swallow her family whole.",
    agencyState:
      "She had no money, no husband, and no way to keep her baby with her — but the no was hers, the train ticket was hers, and the promise to come back for him was hers.",
  },
  biographicalFacts:
    "Astrid Lindgren was born Astrid Ericsson on November 14, 1907, on a farm outside Vimmerby, a small and pious town in southern Sweden. At sixteen she became a trainee at the local newspaper; its editor-in-chief, Reinhold Blomberg — married, and roughly thirty years her senior, though his divorce was in progress — began a relationship with her, and in the spring of 1926, at eighteen, she found she was pregnant. In a town of Vimmerby's size and piety the scandal threatened to engulf her family. The expected course was marriage once Blomberg's divorce was final; Astrid instead broke with him categorically and refused. She left for Stockholm alone, enrolling in secretarial school and living in a rented room on very little. On November 21, 1926, she traveled to Copenhagen — where the Rigshospitalet allowed anonymous births — and on December 4, 1926, at nineteen, gave birth to her son Lars, called Lasse. Unable to keep him, she left him in the care of a foster mother, Marie Stevens, who was kind to him. For three years Astrid worked as a typist and secretary in Stockholm, visiting Lasse when she could afford the train fare, watching him grow attached to another home and fearing she was failing him. In December 1929, at twenty-two, she collected the three-year-old Lasse — who by then spoke Danish and considered the Stevens family his own — and brought him home to Sweden. She married Sture Lindgren in 1931. Pippi Longstocking, published in 1945 when she was thirty-seven, made her in time the world's most translated children's author; her biographers trace the radical child-respect of her books to these years. She died January 28, 2002.",
  sources: [
    "Andersen, Jens. Astrid Lindgren: The Woman Behind Pippi Longstocking, trans. Caroline Waight (New Haven: Yale University Press, 2018), Chapters 2-4.",
    "The Astrid Lindgren Company, official biography, \"Youth.\"",
    "Lindgren, Astrid. Samuel August från Sevedstorp och Hanna i Hult (1975; her own account of her origins).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The farm childhood, the small pious town, the newspaper traineeship, the much older married editor — documented; rendered without romance.",
      text: `There was a girl in a small farm town, the kind of town with one church steeple and no secrets.

She was quick and funny and a little too modern for the place — she'd bobbed her hair before anyone, danced when dancing was frowned on. At sixteen she'd talked her way into a job at the town's little newspaper, writing and proofreading. People said she had a future.

The man who ran the paper was much older. Married, though the marriage was ending. He was her boss, and he turned his attention on her, and she was eighteen and flattered and much too young for any of it.

In the spring of her eighteenth year, she realized she was pregnant.

In that town, in those days, there was no such thing as a private catastrophe.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The scandal stakes for her family; the expected marriage-after-divorce script; her categorical refusal — documented.",
      text: `She could see the whole script laid out for her, and everyone in it.

The whispers were already starting. Her parents were devout, respected people; this would land on them too, hard. And the town had exactly one approved ending for a girl in her condition: marry the man. He was willing — eager, even. Wait for his divorce, take his name, become the third wife of a man three decades older, and let the scandal be papered over into respectability.

All she had to do was hand him the rest of her life.

She was eighteen. She sat with it — the shame pressing in from every window in town, the fear of what was coming, the arithmetic of a baby with no money and no husband.

And underneath all of it, one stubborn, inconvenient certainty: she did not want him.

Marrying him would fix everything except her.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The break with Blomberg, the move to Stockholm alone, secretarial school — documented.",
      text: `She said no.

No to the man. No, with the same word, to the town's whole script for her. She broke it off completely, and she got on a train to the capital, alone, with almost nothing.

She rented a little room. She enrolled in a school for secretaries — typing, shorthand, skills that could feed a person. By day she trained; by night she was one more anonymous girl in a city that didn't know her name, which was terrible and was also exactly the point.

The baby was coming either way. She found out there was one city, in the neighboring country, where a woman could give birth without her name being recorded and reported.

When the time came, she took the train there, by herself, and had her son among strangers.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Lasse with the kind foster mother; the three years of typing jobs and train-fare visits; his attachment to the foster family and her fear of failing him — documented.",
      text: `She could not keep him. There was no version of the arithmetic that let her keep him — no money, one rented room, a wage that barely fed one person.

A kind woman in that foreign city took him in. A real home, warm, decent. That was the mercy in it, and also the knife: her boy was loved — a few hundred miles away, by someone else.

For three years she worked and saved and visited when she could afford the fare. Each visit he was bigger. Each visit he spoke more — in the other country's language. He called the foster woman's home his home, because it was the only one he knew.

She rode the train back after each goodbye doing the darkest math a young mother can do: was she failing him? Would he ever really be hers again? Had she already, at twenty, made the mistake that couldn't be unmade?

She kept working. She kept visiting. She kept the promise alive on no evidence at all.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "December 1929: collected the three-year-old Lasse, who spoke Danish and knew the Stevens as family — documented. The train-ride texture is dramatized.",
      text: `Just before the Christmas he was three, it finally held together: a steady job, a room big enough, enough money to say the word she'd been saving for three years.

She went and got her son.

He was a small, serious boy who spoke a language she had to reach across. He knew the kind woman's kitchen as home, and the woman's family as his family. Now a young woman he'd only ever known as a visitor was taking his hand and telling him he was going home — to a place he had never been.

The train carried them north through the winter dark, the two of them, strangers and mother and son all at once.

It was not a storybook ending. It was harder than that, and better: it was a beginning. From that night on, whatever else happened, they would figure it out in the same house.

She was twenty-two, and she had kept the promise.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The later marriage and family; the mid-life turn to writing; biographers' documented linking of her child-respect to these years — kept anonymous.",
      text: `The life she rebuilt slowly became a good one. A marriage, a daughter, rooms full of children's noise. She turned out to be the kind of mother children flock to — the one who climbs trees at the birthday party.

And then, in her late thirties, almost by accident, she began writing stories down. Stories for children — but not like anybody else's. Her children were strong and wild and free. They talked back. They lived without supervision and thrived. Her books took the child's side against the whole grown-up world, without apology, every single time.

The books went everywhere. She became her country's most beloved writer — eventually one of the most read children's authors who has ever lived.

People often asked where her fierce tenderness for children came from. The readers of her books didn't know. The serious little boy on the winter train knew.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Astrid Lindgren.

She wrote Pippi Longstocking — and dozens of other books that made her one of the most beloved and translated children's authors in history. Whole generations, in nearly every language, grew up on her fierce, funny, free children. None of that existed yet when she was eighteen and pregnant in a town with no secrets, refusing the one respectable exit on offer.

Your life is not theirs. But a piece of this story may still sit beside you.

She was young, ashamed, and terrified she was failing her child — all three at once, for years. She did the impossible thing anyway: she refused the life that would have fixed her reputation and broken her, and she kept her promise to her son on a typist's wage.

Doing it scared and ashamed still counts as doing it. She's proof of that.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. ~July 4, 1844 (Greenbush NY; year contested 1843-45), mother Ojibwe/African
//    American, father Haitian; orphaned by ~9, raised among her mother's Ojibwe people; older
//    brother Samuel (California gold money) funded her schooling; Oberlin College from 1859 (one of
//    the only colleges admitting Black women); winter 1862: two white classmates fell ill after
//    spiced wine and accused her of poisoning them; before trial she was seized by a mob at night,
//    dragged to a field, and beaten so badly she was bedridden for weeks; defended at trial by
//    John Mercer Langston, charges dismissed for lack of evidence (no analysis of the alleged
//    poison), carried from the courtroom on friends' shoulders; resumed studies; early 1863 accused
//    of stealing art supplies (not proven), and the college then refused to let her register for
//    her final term — no degree; 1864, ~age 19-20, went to Boston with a letter of introduction to
//    William Lloyd Garrison, trained with sculptor Edward Brackett; her medallions of abolitionists
//    and bust of Col. Robert Gould Shaw sold well enough to fund her move to Rome in 1866; became
//    the first professional Black/Native American sculptor of international standing; The Death of
//    Cleopatra stunned the 1876 Centennial. d. 1907, London.
//  Interpretive: "the verdict didn't matter to the door" — the expulsion-after-acquittal as the
//    episode's core wound. Grounded.
//  Avoid saying: don't name Lewis / Oberlin / Langston / Garrison / Rome / Cleopatra before the
//    bridge; the beating rendered in two restrained sentences, no graphic detail; don't turn the
//    accusers' motive into stated fact — the record shows accusation and acquittal.
const lewis_e: FigureStageRow = {
  figureKey: "lewis_e",
  displayName: "Edmonia Lewis",
  birthYear: 1844,
  deathYear: 1907,
  stageId: "1862-1866-accused-acquitted-expelled",
  stageLabel: "Acquitted and expelled anyway: the Oberlin ordeal to the studio",
  ageMin: 17,
  ageMax: 21,
  themes: ["dismissed", "dispossession", "quiet_defiance"],
  antiThemes: [],
  shapeSentences: [
    "She was falsely accused at college, beaten half to death by a mob before her trial, and acquitted in court — and then the school closed its doors to her anyway, as if the verdict had never happened.",
    "An orphan far from any family, she watched the institution that was supposed to be her way up decide it would rather lose her than defend her.",
    "So she took her hands and her nerve to a new city, learned to carve stone, and made a name they could not take back.",
  ],
  facets: {
    emotionalCore:
      "Winning the verdict and losing the place anyway — learning that being proven innocent does not reopen a door that people have decided to close on you.",
    decisionShape:
      "Whether to keep begging an institution that had already decided against her, or to walk away from the degree and build a standing no committee could revoke.",
    triggerEvent:
      "Two classmates accused her of poisoning them, a mob beat her before she was ever tried, and after the court cleared her the college barred her final term anyway.",
    agencyState:
      "Orphaned, far from her people, with her body still healing and her name still whispered about — but her hands were hers, and there was one craft where the work speaks for itself.",
  },
  biographicalFacts:
    "Edmonia Lewis was born around July 4, 1844, near Greenbush, New York; her mother was of Ojibwe and African-American descent, her father Haitian. Orphaned by about nine, she spent much of her childhood among her mother's Ojibwe people; her older brother Samuel, who had made money in the California gold fields, paid for her schooling and in 1859 sent her to Oberlin College in Ohio, one of the only colleges in America that admitted Black women. In the winter of 1862, two white classmates fell ill after drinking spiced wine with her and accused her of poisoning them. Days before her hearing, she was seized at night by a mob, dragged to a field, and beaten so severely she was bedridden for weeks. At trial she was defended by John Mercer Langston, the celebrated Black attorney and Oberlin graduate; the charges were dismissed for lack of evidence — the alleged poison had never been analyzed — and supporters carried her from the courtroom on their shoulders. She resumed her studies while still recovering. In early 1863 she was accused of stealing art supplies; the charge was not proven, but the college then refused to let her register for her final term, ending her education without a degree. In 1864 she moved to Boston carrying a letter of introduction to the abolitionist William Lloyd Garrison, who connected her with the sculptor Edward Brackett; she learned to model and carve, and her portrait medallions of abolitionists and her bust of Colonel Robert Gould Shaw sold well enough to pay her way to Rome in 1866, where she set up a studio among the expatriate sculptors. She became the first Black and Native American sculptor to achieve international recognition; her monumental The Death of Cleopatra was one of the sensations of the 1876 Philadelphia Centennial Exposition. She died in London in 1907.",
  sources: [
    "Blodgett, Geoffrey. \"John Mercer Langston and the Case of Edmonia Lewis: Oberlin, 1862.\" Journal of Negro History 53, no. 3 (1968).",
    "Buick, Kirsten Pai. Child of the Fire: Mary Edmonia Lewis and the Problem of Art History's Black and Indian Subject (Durham: Duke University Press, 2010).",
    "National Park Service, \"Edmonia Lewis\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Orphaned young, raised among her mother's people, brother-funded schooling, one of very few such students at the college — documented.",
      text: `There was a young woman at a college — one of the only colleges in the country that would admit someone like her.

She had been an orphan since she was small. Her mother's people had raised her; her older brother, who'd gone west and come back with money, believed in her enough to pay for school. She was there on his faith and her own nerve, hundreds of miles from anyone who loved her.

She was good with her hands — drawing, making things. She was finding her feet.

She knew the town around the college didn't love having students like her there. Everyone like her knew it. You kept your head down and did the work, and mostly that was enough.

Until one winter, it wasn't.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The poisoning accusation; the night seizure and mob beating before trial (bedridden for weeks) — documented; rendered in two restrained sentences.",
      text: `Two classmates fell ill, and the story that went around was that she had poisoned them.

It wasn't true. But the story didn't need to be true. It needed only to be about her — the orphan, the outsider, the one the town already resented — and it spread like a dropped match.

Before she ever saw a courtroom, men came for her at night. They dragged her out to a field in the dark and they beat her, and they left her there. She was weeks in bed before she could stand through a day.

And then, body still broken, she had to get up and face the trial.

She was maybe eighteen years old. Everyone she loved was far away. The whole town believed a lie about her, and the mob had already delivered its verdict — the real court hadn't even started.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The trial: defended by a brilliant attorney, charges dismissed for lack of evidence, carried out on supporters' shoulders; she resumed her studies — documented.",
      text: `She stood trial, and she stood it well.

A brilliant attorney — a man who had walked her same road — took her case and took it apart. There was no evidence. There had never been any evidence. The charges were dismissed, and her friends carried her out of the courtroom on their shoulders.

And then she did the hard, unglamorous thing: she went back to class.

Still healing. Still whispered about — a verdict doesn't stop whispers. She walked back into those same buildings, past those same faces, and picked her education back up, because it was hers and her brother had paid for it and she had done nothing wrong.

She thought the worst was over. The court had said so.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The second accusation (art supplies, not proven) and the college's refusal to let her register for the final term — documented. 'The verdict didn't matter to the door' is interpretive framing.",
      text: `A year later, a new accusation. Smaller this time — supplies missing from the art room. Nothing was proven. It didn't matter.

The college had had enough of the trouble that kept finding her — as if she were the trouble, and not its target. When it came time to register for her final term, the answer was no. No hearing, no verdict, no appeal. She simply would not be allowed to finish.

She had won in court and it made no difference to the door.

That was the lesson the place taught her, in the end — not the one in the catalog. Innocence is not a key. Some doors are closed because of what you are, and no verdict reopens them.

She could have spent years pounding on that door. She looked at it, and she chose better.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The move to Boston with one letter of introduction; the sculptor who trained her; the medallions and the bust whose sales funded the Atlantic crossing — documented.",
      text: `She went east, to a big city, carrying one letter of introduction to a famous champion of her people's cause.

The letter worked. The famous man read it and sent her to a sculptor — a real one, with a working studio — and asked him to see what she could do.

Clay first. Then stone. It turned out her hands had been waiting for stone her whole life.

She started small: portrait medallions of the heroes of the cause, sold to their admirers. Then a bust of a fallen young war hero the whole city mourned. It sold, and sold again in copies — enough money, at last, for the boldest move a sculptor could make.

She booked passage across the ocean, to the ancient capital of her art, where the marble comes out of the mountains and nobody asks your college for permission.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The Rome studio; international fame; the Centennial sensation piece — documented, names withheld for the bridge.",
      text: `In the old city she opened her own studio and worked the marble herself — no hired carvers, so no one could claim the work wasn't hers.

Collectors came. Tourists came. Famous writers came and wrote about the young sculptor everyone was talking about. She carved her mother's people with dignity. She carved freed men and women standing up. She carved queens.

At her country's great hundredth-birthday exhibition, her most ambitious statue — a dying queen, carved at full scale — stopped the crowds cold. Critics argued about it for years. It became one of the most famous American sculptures of its century.

The college that wouldn't let her finish became a footnote in her story. Not the other way around.

The first of her kind to stand in the front rank of her art — that is what the orphan girl from the field became.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Edmonia Lewis.

She was the first sculptor of African-American and Native American heritage to win international fame. Her masterpiece, The Death of Cleopatra, is in the Smithsonian now. Colleges teach her work — including, these days, the one that turned her away. None of that had happened yet when she was lying in bed, beaten for a lie, waiting for a trial.

Your life is not theirs. But a piece of this story may still sit beside you.

She learned the hardest version of the lesson: you can be completely innocent, proven innocent, and still lose the place. What she did next is the part worth keeping — she stopped asking the closed door for justice and built a life where her work answered for her.

Their verdict on you isn't the last word. She got the last word. It's in a museum.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 15, 1850, Moscow, general's daughter; her childhood nursery at Palibino was
//    papered with lithographed pages of Ostrogradsky's calculus lectures (her own memoir); taught
//    herself trigonometry at ~14; Russian universities barred women, and women could not travel
//    abroad without a father's or husband's permission; her father refused study abroad; 1868 (18)
//    contracted a "fictitious marriage" with Vladimir Kovalevsky (a practice in radical circles) to
//    get free; Heidelberg 1869, auditing only by special permission; Berlin 1870 — the university
//    refused women entirely, and Karl Weierstrass, after she solved the problems he set to send her
//    away, taught her privately every week for four years; 1874 (24) doctorate in absentia from
//    Göttingen, summa cum laude, on three papers incl. the Cauchy-Kovalevskaya theorem — the first
//    woman in modern Europe to earn a mathematics doctorate; later first woman professor of
//    mathematics in northern Europe (Stockholm, 1884), Prix Bordin 1888. d. 1891.
//  Interpretive: the marriage-as-a-key framing; "walls, and a door made of paperwork." Grounded in
//    her memoir A Russian Childhood and standard biographies.
//  Avoid saying: don't name Kovalevskaya / Russia / Weierstrass / Berlin / Heidelberg / the theorem
//    before the bridge; the wallpaper detail stays (it's her own famous memoir image) but unnamed;
//    the marriage is a documented arrangement, not a romance — keep it exactly that.
const kovalevskaya: FigureStageRow = {
  figureKey: "kovalevskaya",
  displayName: "Sofia Kovalevskaya",
  birthYear: 1850,
  deathYear: 1891,
  stageId: "1868-1874-fictitious-marriage-to-doctorate",
  stageLabel: "A marriage as a key: barred from university to the first doctorate",
  ageMin: 18,
  ageMax: 24,
  themes: ["social_constraint", "self_invention", "quiet_defiance"],
  antiThemes: [],
  shapeSentences: [
    "Every university in her country was closed to her because she was a woman, and the law would not even let her leave without a father's or husband's signature — so at eighteen she married a near-stranger to manufacture the signature, and left.",
    "The great university she reached refused women at its door, so the greatest mathematician in it taught her alone, every week, for four years.",
    "At twenty-four the woman no lecture hall would seat earned the doctorate — the first of her kind in Europe — with work that still carries her name.",
  ],
  facets: {
    emotionalCore:
      "Burning to use a mind everyone conceded was extraordinary, in a world that had quietly pre-decided the whole shape of her life before she could vote on it.",
    decisionShape:
      "Whether to accept the life assigned to a general's daughter, or to bend the rules that could be bent — a paper marriage, a borrowed signature — and walk through the gap.",
    triggerEvent:
      "Her father refused to let her study abroad, and the law made his signature — or a husband's — the only key out.",
    agencyState:
      "She could not enroll, could not travel, could not sign for herself — but she could learn faster than anyone they had ever seen, and she could find the one legal crack in the wall.",
  },
  biographicalFacts:
    "Sofia Kovalevskaya was born January 15, 1850, in Moscow, the daughter of General Vasily Korvin-Krukovsky. At the family estate at Palibino, her childhood nursery had been papered — by chance, when wallpaper ran short — with lithographed pages of Ostrogradsky's calculus lectures from her father's student days, and she later wrote of puzzling over the strange symbols for hours; she taught herself trigonometry at about fourteen to read a physics book written by a neighbor. Russian universities did not admit women, and by law a woman could not obtain the passport needed to study abroad without the permission of her father or husband. Her father refused. In September 1868, at eighteen, she contracted a \"fictitious marriage\" — an arrangement then known in Russian radical circles — with the young paleontology student Vladimir Kovalevsky, and the couple traveled to Germany. At Heidelberg in 1869 she could only audit lectures by special permission of each professor. In 1870 she moved to Berlin, where the university refused women entirely; she went to Karl Weierstrass, the most celebrated analyst in Europe, who set her a list of difficult problems to put her off — and, when she returned with solutions that startled him, agreed to teach her privately, which he did nearly every week for four years. In 1874 she presented three papers — including the result now taught as the Cauchy-Kovalevskaya theorem on partial differential equations — and the University of Göttingen granted her a doctorate in absentia, summa cum laude, making her the first woman in modern Europe to receive a doctorate in mathematics. After years in which no university would employ her, she became a professor at Stockholm University in 1884 — the first woman professor of mathematics in northern Europe — and won the French Academy's Prix Bordin in 1888. She died of pneumonia in 1891, at forty-one.",
  sources: [
    "Kovalevskaya, Sofia. A Russian Childhood, trans. Beatrice Stillman (New York: Springer, 1978).",
    "Koblitz, Ann Hibner. A Convergence of Lives: Sofia Kovalevskaia — Scientist, Writer, Revolutionary (Boston: Birkhäuser, 1983), Chapters 3-6.",
    "Cooke, Roger. The Mathematics of Sonya Kovalevskaya (New York: Springer, 1984).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The calculus-notes nursery wallpaper (her own memoir), self-taught trigonometry, the general's-daughter life script — documented.",
      text: `There was a girl who grew up in a house where, by pure accident, her nursery walls were papered with pages of an old mathematics textbook — the wallpaper had run short, and someone had used a stack of lecture notes instead.

She spent hours of her childhood staring at those walls. Strange symbols, beautiful and locked. By the time she was fourteen she had taught herself enough to startle her father's educated friends. Everyone agreed the girl had a remarkable mind.

Everyone also agreed on what her life would be, because it had been decided long before she was born. A general's daughter marries well. She runs a household. She is accomplished — a little piano, a little French — and nothing more.

The universities of her country did not admit women. Not one, not partway, not ever.

The walls of her nursery had numbers on them. The walls around her life did not have a door.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The legal travel bar (father's or husband's permission), her father's refusal — documented.",
      text: `There were universities abroad, in other countries, that had begun — cautiously, partially — to let women in.

She might as well have been told about universities on the moon.

Because the law of her country had one more wall behind the first: a woman could not get the papers to leave without a man's permission. Her father's. Or a husband's. Her signature meant nothing on its own; legally, she was a passenger in her own life.

She asked her father. Her father said no. Daughters of his standing did not run off to foreign lecture halls. The subject was closed.

And that was supposed to be that. A remarkable mind, everyone agreed — and a life already fully furnished for it: the estate, the marriage to come, the drawing rooms, the decades.

She was eighteen, and she could feel the whole thing closing over her like water.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The documented fictitious marriage (a known radical-circle arrangement) at 18 and the departure abroad.",
      text: `The law said she needed a husband's signature. The law did not say the marriage had to be real.

In the circles of young idealists she had begun to know, there was a quiet practice for exactly this trap: a marriage of convenience. A sympathetic young man lends his name; the paperwork produces the signature; the woman gets her passport and her life.

She found such a man — a young student of fossils, decent, in on the plan. They married. Her father got a son-in-law of acceptable standing; she got the only key that fit the only door.

She was eighteen years old, married to someone she barely knew, and free.

They boarded the train for the border. On the far side of it were the universities.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Heidelberg audit-only status by per-professor permission; Berlin's total refusal of women — documented.",
      text: `Freedom, it turned out, came in small rationed doses.

At the first university, she could not enroll. She could only sit in on lectures — and only if each professor personally agreed to tolerate a woman in his hall. Some did. Some didn't. She collected permissions the way beggars collect coins, and she outworked everyone in every room they let her enter.

Then she moved to the city with the university she really wanted — the one with the greatest mathematician of the age in it.

That university did not admit women. Not to enroll, not to audit, not to sit quietly in the last row. A total no.

She had crossed a continent, married a stranger, and given up her whole assigned life — to reach a door that was locked as firmly as the ones at home.

So she went around the university entirely. She knocked, instead, at the great man's house.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Weierstrass's screening problems, her startling solutions, and the four years of weekly private lessons — documented.",
      text: `The great man did what busy famous men do to unwanted visitors: he set her a test designed to end the conversation.

A list of problems — hard ones, the kind he gave his most advanced students — with the polite understanding that she would go away and not come back.

She came back. With solutions.

Not adequate solutions. Solutions that made him sit down and read them twice — original, elegant, better in places than what his own students produced. Whoever this young woman was, the mind on the page was not a curiosity. It was the real thing.

The university still would not have her; that wall didn't move. So he moved instead.

Every week, in his study, the most celebrated mathematician in Europe taught the student his university refused to seat. Just the two of them and the work. For four years.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The 1874 in-absentia doctorate summa cum laude on three papers; the later professorship and prize — documented, names withheld.",
      text: `At twenty-four, she presented the work of those years: three papers of original mathematics, one of them a result so fundamental that students still learn it today — with her name attached.

A great university granted her the doctorate, with highest honors, without her ever having been allowed to sit in its lecture halls. She was the first woman in modern Europe to earn a doctorate in mathematics.

The world was not finished being the world; for years afterward, no university would hire the most credentialed woman on the continent. She persisted. In time, one made her a full professor of mathematics — the first woman in that part of the world to hold such a chair — and the prize committees of Europe honored work they could no longer pretend wasn't hers.

The girl who studied her nursery wallpaper had signed her own life after all. It just took a borrowed signature to get there.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Sofia Kovalevskaya.

The first woman in modern Europe to earn a doctorate in mathematics, and the first to hold a full professorship in it in northern Europe. The Cauchy-Kovalevskaya theorem — hers — is still taught in every serious mathematics program on earth. None of that existed yet when she was eighteen, staring at a life other people had fully furnished for her.

Your life is not theirs. But a piece of this story may still sit beside you.

Every legitimate door was locked, so she studied the locks. A paper marriage for a signature. A private study instead of a lecture hall. She never got permission — not once, at any step. She got results instead, and eventually the world had to catch up to them.

If the approved path is walled off, the unapproved ones still count. Hers did.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Feb 1, 1902, Joplin MO; parents separated; father James moved to Mexico, scornful
//    of Black Americans' prospects and, by Langston's own account in The Big Sea, contemptuous of
//    Black people and of his son's poetry; Langston wrote "The Negro Speaks of Rivers" at 18 on the
//    train to Mexico (1920), published in The Crisis 1921; the father would fund only engineering
//    study — compromise: Columbia (1921-22), which he left amid racial hostility and boredom, and
//    the father cut support; jobs, then 1923 (21) crewed the SS Malone to West Africa — off Sandy
//    Hook he threw his books into the sea ("like throwing a million bricks out of my heart," The
//    Big Sea); Paris dishwashing 1924; Washington DC 1925, busboy at the Wardman Park Hotel, slipped
//    three poems beside Vachel Lindsay's plate; papers nationwide reported the "busboy poet"; The
//    Weary Blues published by Knopf, Jan 1926 (he turned 24 that week). d. 1967.
//  Interpretive: "make something of yourself meant become someone else"; the books-overboard as
//    shedding an assigned life. Both grounded in The Big Sea.
//  Avoid saying: don't name Hughes / Columbia / Harlem / Mexico / Paris / Lindsay / poem or book
//    titles before the bridge; the father's self-contempt handled in one careful clause, no
//    diagnosis; no "Harlem Renaissance" label before the bridge.
const hughes: FigureStageRow = {
  figureKey: "hughes",
  displayName: "Langston Hughes",
  birthYear: 1902,
  deathYear: 1967,
  stageId: "1920-1926-fathers-deal-to-first-book",
  stageLabel: "The father's deal: engineering money to the busboy poems",
  ageMin: 19,
  ageMax: 24,
  themes: ["social_constraint", "self_invention", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "His father would pay for his education only if he gave up poetry for engineering, and he took the deal, hated it, and broke it — choosing the poems and the poverty over the funded life someone else had picked.",
    "He worked ships and kitchens across half the world, and one night he threw his schoolbooks into the sea, lightening himself of a life that was never his.",
    "The busboy who left three poems beside a famous man's plate woke up in the newspapers, and his first book followed within months.",
  ],
  facets: {
    emotionalCore:
      "Learning that the person who was supposed to believe in him first held his deepest gift in contempt — and that the price of the money was becoming someone he wasn't.",
    decisionShape:
      "Whether to keep the funded, respectable path his father would pay for, or to walk away broke and bet everything on the writing his father despised.",
    triggerEvent:
      "His father agreed to fund his education on one condition: engineering, abroad — anything but the poetry.",
    agencyState:
      "Cut off and broke once he refused, he still had his hands for ship work and kitchen work, and a notebook nobody could defund.",
  },
  biographicalFacts:
    "Langston Hughes was born February 1, 1902, in Joplin, Missouri. His parents separated soon after his birth; his father, James Hughes, emigrated to Mexico, where he prospered — a man who, by Langston's account in his autobiography The Big Sea, had come to despise the country that had blocked him, the Black Americans he had left behind, and, painfully, much of what his son was. In 1920, at eighteen, Langston rode the train to Mexico hoping to persuade his father to pay for college; crossing the Mississippi at sunset he wrote \"The Negro Speaks of Rivers\" on the back of an envelope. It was published in The Crisis in 1921, when he was nineteen. His father scorned poetry as a way to starve and offered to fund only an engineering education abroad; the compromise was engineering at Columbia University. Hughes enrolled in 1921, endured its racial hostility, spent more time in Harlem than in class, and left in 1922 — at which point his father cut him off. He worked odd jobs, and in 1923, at twenty-one, signed on as a mess boy on the SS Malone bound for West Africa; as the ship passed Sandy Hook he threw his books into the sea, writing later that it felt \"like throwing a million bricks out of my heart.\" He washed dishes in a Paris nightclub in 1924. In 1925, working as a busboy at the Wardman Park Hotel in Washington, D.C., he placed three of his poems beside the plate of Vachel Lindsay, one of the most famous poets in America; Lindsay read them to his audience that night, and newspapers across the country carried the story of the discovered \"busboy poet.\" Alfred A. Knopf published his first collection, The Weary Blues, in January 1926, days before his twenty-fourth birthday. He became the defining poet of the Harlem Renaissance and one of the most beloved American poets of the century. He died May 22, 1967.",
  sources: [
    "Hughes, Langston. The Big Sea: An Autobiography (New York: Knopf, 1940), Parts I-II.",
    "Rampersad, Arnold. The Life of Langston Hughes, Volume I: 1902-1941 (New York: Oxford University Press, 1986), Chapters 2-5.",
    "Academy of American Poets, \"About Langston Hughes.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The train ride to the estranged father at 18; the river poem written en route on an envelope — documented (The Big Sea).",
      text: `There was a young man on a long train ride to meet his father — a father he barely knew.

His parents had split when he was a baby. The father had left the country years ago, bitter at everything it had refused him, and made money in another one. Now the son was eighteen, finished with school, full of words. He was going south to ask the one rich man in his family to help pay for college.

Crossing the great river at sunset, somewhere in the middle of the country, a poem came to him — whole, quiet, certain, about rivers older than pain. He wrote it on the back of an envelope while the light went copper on the water.

He didn't know it yet, but that envelope would outlive every plan his father had for him.

He rode on south, hopeful. Hope was about to get complicated.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The father's documented contempt for his poetry and his people (one careful clause, per The Big Sea); the engineering-only funding condition.",
      text: `His father, it turned out, had contempt to spare.

For the country he'd left. For the people he'd left — his own people, which the son could hardly bear to watch. And for poetry, which in the father's arithmetic was a fancy word for starving.

The deal came down flat and final: he would pay — generously, even — for an education in engineering. Something solid. Something respectable. Somewhere far from everything the son loved.

Poetry? No. Not a course of it, not a dollar toward it.

The son sat in his father's fine house and understood the terms of the offer under the offer: make something of yourself meant become someone else. The money was real. The door was open. All he had to do was walk through it and leave himself outside.

He was eighteen, and the one man on earth supposed to believe in him first was the one man who plainly didn't.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The Columbia compromise, the departure amid racial hostility, the father cutting him off — documented. The magazine acceptance of the river poem falls in this window.",
      text: `He tried the deal halfway.

A compromise college, engineering courses, his father's money in his pocket and his father's plan on his desk. He lasted a year. The place was cold to students who looked like him, and his heart was uptown anyway, in the neighborhood full of music where his people were building something new.

Meanwhile, the poem from the train — the river poem — was published in a national magazine. His name, his words, in print. Nobody had paid him to be an engineer of anything, and yet there it was: proof of a different life, one column wide.

He quit the college. His father cut him off to the penny.

Broke, and lighter than he'd felt in years, he went looking for work — any work — that would carry him toward the world instead of away from himself.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The ship years and kitchen years (mess boy to West Africa at 21, Paris dishwashing at 22); the documented books-overboard moment and his own 'million bricks' line.",
      text: `He signed onto a ship as a mess boy and worked his way down the coast of a continent his ancestors had been stolen from. He washed dishes in a nightclub in the most glamorous city in Europe and ate on what the cooks left. He came home broke and shipped out broke again.

One night, as his freighter cleared the harbor at the start of a voyage, he carried his old schoolbooks up on deck — the whole borrowed life in a box — and threw them into the sea.

He said later it felt like throwing a million bricks out of his heart.

Through all of it, every port and kitchen, he kept the notebook. Poems about work. Poems about his people. Poems that moved the way the music moved. Little magazines took one here, one there. Nobody important was watching.

He was a workingman who wrote, sliding toward twenty-four, with no degree, no backer, and no plan B — because this was already plan B, and it was his.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Wardman Park busboy job; three poems placed beside Vachel Lindsay's plate; Lindsay reading them that night and the national 'busboy poet' coverage — documented.",
      text: `He was bussing tables at a grand hotel when he saw a famous poet at dinner — one of the most celebrated in the country, in town to give a reading that night.

The busboy had no invitation to the reading, and no standing to introduce himself. What he had was three of his own poems, and one long moment while the plates went down.

He laid the three poems beside the famous man's plate, said something quick and shy about admiring his work, and got out of the dining room before he could take it back.

That night, at the reading, the famous poet told the audience he had discovered a poet that day — a young Black man bussing tables in this very hotel — and read all three poems to the crowd.

By morning it was in newspapers across the country: the busboy poet. Reporters came to photograph him carrying trays.

The trays' days were numbered.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "First collection published within months by a major house, days before his 24th birthday; the lifetime of poems that followed — documented, names withheld.",
      text: `Within months, one of the great publishing houses brought out his first book of poems. It appeared a few days before his twenty-fourth birthday.

The book sounded like nothing else — like the blues, like the neighborhood, like people talking on a stoop at dusk and meaning everything they said. He had refused the borrowed voice as firmly as the borrowed life, and readers could hear it.

He never stopped. Books of poems, plays, stories, columns — decade after decade, all of it in the key of his people's actual music and actual lives. He became not just a famous poet but a beloved one: the rare kind whose lines get memorized by heart, by porters and professors alike.

The engineering money would have run out in four years. The poems are still paying out now.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Langston Hughes.

He became the defining poet of the Harlem Renaissance and one of the most beloved American poets of the twentieth century. "The Negro Speaks of Rivers" — the poem he wrote on that envelope at eighteen — is now carved in stone and taught everywhere. None of that had happened yet when he sat in his father's house, listening to the terms.

Your life is not theirs. But a piece of this story may still sit beside you.

The money came with one condition: be someone else. He walked away from it into years of ships and dish pits, carrying nothing but the notebook — and the notebook turned out to be the career, the legacy, the whole point.

Nobody gets to set the terms of your becoming. Not even the one who pays. He's proof.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Aug 30, 1797; Frankenstein published anonymously Jan 1818 (she was 20); Clara
//    died Sept 24, 1818, Venice (dysentery, ~1yr old; Mary 21); William ("Willmouse") died June 7,
//    1819, Rome (malaria, age 3); her journals record crushing despair; Matilda written through
//    the grief; Percy Florence born Nov 1819 (the surviving child); she nearly died of a
//    miscarriage June 1822; Percy Bysshe Shelley drowned July 8, 1822, in a storm off the Italian
//    coast (Mary 24); widowed with a two-year-old, nearly penniless; Sir Timothy Shelley offered
//    support only if she surrendered the boy to be raised by others — she refused; returned to
//    England Aug 1823; lived by her pen (novels, editions of Percy's poems), raised her son alone,
//    and built Percy's posthumous reputation. Frankenstein's authorship became known and the book
//    became one of the most famous novels ever written. d. 1851.
//  Interpretive: "she chose the pen and the child over the rescue with conditions." Grounded.
//  Avoid saying: don't name Shelley / Frankenstein / Percy / Italy / Byron before the bridge; the
//    famous-anonymous-book detail stays but untitled and undescribed (the monster is a bridge
//    reveal); the children's deaths rendered plainly, never clinically; no elopement-scandal
//    backstory (pre-episode).
const shelley_m: FigureStageRow = {
  figureKey: "shelley_m",
  displayName: "Mary Shelley",
  birthYear: 1797,
  deathYear: 1851,
  stageId: "1818-1823-the-losses",
  stageLabel: "One loss after another: the deaths in Italy to the return home",
  ageMin: 21,
  ageMax: 25,
  themes: ["grief", "solitude", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "In the space of four years she buried a daughter, buried a son, and lost her young husband to the sea — far from home, in a country not her own, before she turned twenty-five.",
    "Offered rescue on the condition that she give up her one surviving child, she refused, and chose to live by her pen instead.",
    "She carried the grief home and built a life out of writing, raising her boy alone and making sure the dead were not forgotten.",
  ],
  facets: {
    emotionalCore:
      "Loss arriving again and again before the last loss had healed, until grief stopped being an event and became the weather of her life — and she was barely into her twenties.",
    decisionShape:
      "Whether to accept survival with conditions — give up her son in exchange for support — or to refuse, keep him, and carry the whole weight alone on whatever her writing could earn.",
    triggerEvent:
      "Her small daughter died on a journey, her little son died nine months later, and then the sea took her husband — three deaths in four years, in a foreign country.",
    agencyState:
      "Widowed at twenty-four with a toddler, nearly penniless, far from home — owning almost nothing except a trained pen and the refusal to hand over her child.",
  },
  biographicalFacts:
    "Mary Shelley was born August 30, 1797, the daughter of the philosopher William Godwin and the feminist Mary Wollstonecraft, who died days after her birth. Her novel Frankenstein, begun at eighteen, was published anonymously in January 1818, shortly before she, her husband Percy Bysshe Shelley, and their two small children left for Italy. That September her one-year-old daughter Clara died of dysentery in Venice; nine months later, in June 1819, her three-year-old son William died of malaria in Rome. Her journals from these months record a despair so complete she wrote that she had lost all interest in life; she worked through it, writing the novella Matilda. Her son Percy Florence was born in November 1819. In June 1822 she nearly died of a miscarriage, and on July 8, 1822, Percy Bysshe Shelley drowned when his boat sank in a storm off the Italian coast; Mary was twenty-four. Widowed with a two-year-old and nearly penniless, she was offered support by her father-in-law, Sir Timothy Shelley, on the condition that she surrender the boy to be raised by guardians of his choosing. She refused. She returned to England in August 1823 and lived by her pen — novels, stories, editions — while raising her son alone and assembling and annotating her husband's poetry, work that largely created his posthumous reputation. Frankenstein, its authorship soon known, became one of the most famous novels in the world. She died February 1, 1851.",
  sources: [
    "Shelley, Mary. The Journals of Mary Shelley, 1814-1844, ed. Paula R. Feldman and Diana Scott-Kilvert (Oxford: Clarendon Press, 1987).",
    "Seymour, Miranda. Mary Shelley (New York: Grove Press, 2000), Chapters 9-14.",
    "Sunstein, Emily W. Mary Shelley: Romance and Reality (Boston: Little, Brown, 1989).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The anonymous famous book at twenty, the move abroad with husband and two children — documented. Book kept untitled and undescribed.",
      text: `There was a young woman living far from home, in a warm country that wasn't hers.

She had already, at an absurdly young age, written a book — published without her name on it, the way women's books often were then. It was starting to be talked about. Nobody knew the author was a girl of twenty.

She had a husband she'd chosen against the world's advice — a poet, brilliant and restless — and two small children: a baby girl and a little boy she loved past all sense.

They moved from city to city in the warm country, chasing health and cheap rent and the poet's friends.

It was a strange, bright, precarious life. She thought the precarious part was money.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Clara's death (Sept 1818), William's death nine months later (June 1819), the journal despair, the 1822 miscarriage, Percy's drowning — all documented. Rendered plainly.",
      text: `Then the baby girl got sick on a journey, and died. She was one year old.

Nine months later — before the first grief had even found a shape — the little boy took a fever in the summer heat. She sat by him for days. He died too. He was three.

She wrote in her journal that she no longer cared whether she lived. Two children in the ground in a foreign country, in less than a year.

A new baby came — one more boy — and she held herself together around him, because there was no one else to do it.

Three years passed. Then, one summer, her husband sailed down the coast to meet a friend, and a storm came up, and his boat went down. They found him days later. He was twenty-nine. She was twenty-four.

A widow at twenty-four, in a country not her own, with one small son and almost nothing else left alive.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Sir Timothy's documented conditional offer (support in exchange for surrendering the boy) and her refusal.",
      text: `Rescue was offered. It came with one condition.

Her husband's father was rich, and disapproving, and willing to provide — for the boy. If she handed him over. Give the child to guardians of the old man's choosing, step out of his upbringing, and there would be money.

She had buried two children. She had exactly one left.

She said no.

No to the money, no to the safety, no to the sensible arrangement everyone could see the sense of. She would keep her son, and she would feed them both the only way she knew how — with her pen.

She packed up the pieces of the life abroad and took the boy home.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The return to England (1823); living by writing under the father-in-law's constraints; editing the drowned husband's papers — documented.",
      text: `Home was cold and expensive, and grief doesn't pay rent.

She wrote. Stories for the annuals, articles, reviews, whatever sold. She began new novels. The father-in-law's grudging small allowance came with strings and humiliations; her own work made up the difference, month by month.

And at night she did the other work — the unpaid one. Her husband had died young and scattered: poems unpublished, unfinished, unread. She gathered every page. She copied, arranged, annotated. If the world was ever going to know what he had been, it would be because she built the case herself.

Grief kept its own schedule all through this. Some anniversaries flattened her. She wrote anyway — not because writing healed it, but because the boy needed dinner and the dead needed a witness, and she was the only one available for either job.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The pen-earned independence and the editions that established the poet's reputation — documented; compressed as the 'it held' realization.",
      text: `And it held.

The novels came out and sold. The editions of her husband's poems began, over years, to do the impossible: a poet the public had mostly ignored or sneered at in life became — volume by volume, note by note, argued into place by his widow — one of the most admired poets in the language.

Somewhere in those years the arithmetic quietly turned. She was no longer a shipwreck survivor clinging to a plank. She was a professional writer, keeping a household on her own work, raising a boy who was growing up kind.

Nobody handed her that life. She had refused the version that was handed to her — the one with conditions.

She had built this one out of loss, ink, and refusal, and it stood.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The anonymous book's authorship becoming known; its permanent fame; the son raised to adulthood — documented, kept unnamed.",
      text: `And the book — the one she'd written as a girl, the one published without her name?

The world had never stopped reading it. Its authorship came out, and readers were astonished: the strange, dark, enormous story everyone knew had been written by a teenager. A girl.

It has never gone out of print. It seeded an entire branch of literature. Two centuries on, its central figure is one of the most recognized in all of storytelling, and the questions the book asks — what we owe the things we create, what loneliness does to a soul — are still being argued about in classrooms on every continent.

She kept writing to the end: novels, travel books, the editions. Her son grew up, steady and devoted, and outlived her, holding her hand at the last.

She had lost almost everything by twenty-five. What she made afterward outlived everyone who ever doubted her.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Mary Shelley.

The book was Frankenstein. She wrote it at eighteen, published it at twenty, and it became one of the most famous novels ever written — the birth of science fiction, the monster everyone on earth can picture. She also, almost single-handedly, built the reputation of her husband, the poet Percy Bysshe Shelley. None of that fame had reached her yet in the years when she was burying her children and then her husband, far from home.

Your life is not theirs. But a piece of this story may still sit beside you.

Grief came for her again and again before she was twenty-five — faster than any heart can process it. She didn't transcend it; her journals say plainly that some days she didn't want to be alive. She just kept one small boy fed, one pen moving, one page turning.

You don't have to be done grieving to keep going. She never fully was, and she went anyway.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Elizabeth Cochran, May 5, 1864, Cochran's Mills PA; father died when she was 6,
//    leaving the family in hardship; Jan 1885 the Pittsburgh Dispatch ran "What Girls Are Good For"
//    (girls are for housekeeping and childbearing); she wrote a furious rebuttal signed "Lonely
//    Orphan Girl"; editor George Madden advertised for the author, met her, hired her (pen name
//    "Nellie Bly"); her factory-girl investigative series drew advertiser complaints and she was
//    reassigned to fashion/society/gardening; ~Feb 1886 (21) went to Mexico as self-made foreign
//    correspondent for ~6 months (later Six Months in Mexico); back on the women's pages, she quit
//    in 1887, leaving the famous note "I am off for New York. Look out for me. Bly."; months of
//    closed doors, then talked her way into Pulitzer's World and took the madhouse assignment:
//    feigned insanity, ten days inside the Blackwell's Island asylum, exposé "Ten Days in a
//    Mad-House" (Sept-Oct 1887, age 23) → grand-jury investigation and funding increases; 1889-90
//    raced around the world in 72 days. d. 1922.
//  Interpretive: "the column read like a verdict on her own life"; the note as the hinge. Grounded.
//  Avoid saying: don't name Bly / Cochran / Pittsburgh / New York / Pulitzer / the World / Mexico
//    before the bridge; no "stunt journalism" label; the asylum conditions in one restrained line.
const bly: FigureStageRow = {
  figureKey: "bly",
  displayName: "Nellie Bly",
  birthYear: 1864,
  deathYear: 1922,
  stageId: "1885-1887-orphan-girl-to-madhouse",
  stageLabel: "Lonely Orphan Girl: the angry letter to the madhouse exposé",
  ageMin: 20,
  ageMax: 23,
  themes: ["dismissed", "social_constraint", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "She read a famous column declaring that girls were good for nothing but housework and babies — a verdict on her own cornered life — and answered it with a letter so furious the editor advertised to find her.",
    "Hired, she was shunted to the flower shows and fashion pages the moment her real reporting bothered powerful men, and she refused to stay put.",
    "At twenty-three she left a two-line note on the editor's desk, went to the biggest city in the country, and got herself committed to a madhouse to write the truth about it.",
  ],
  facets: {
    emotionalCore:
      "The fury of being told — in print, by strangers, and by every closed door — that her sex fixed the size of her life, when she could feel the work she was built for going undone.",
    decisionShape:
      "Whether to keep the safe little column they allowed her, or to walk out on the only job she'd ever won and bet everything on a city that hadn't asked for her.",
    triggerEvent:
      "A newspaper column titled 'What Girls Are Good For' answered its own question with housekeeping and childbearing, while she sat jobless in a house full of need.",
    agencyState:
      "No money, no degree, no connections, and a byline they kept pointing at garden parties — but a pen with an edge on it, and the nerve to volunteer for what no one else would do.",
  },
  biographicalFacts:
    "Nellie Bly was born Elizabeth Cochran on May 5, 1864, in Cochran's Mills, Pennsylvania. Her father, a mill owner and judge, died when she was six, leaving the family in genteel poverty; her mother's remarriage ended in divorce, and Elizabeth grew up watching the family's options narrow. In January 1885 the Pittsburgh Dispatch published a column titled \"What Girls Are Good For,\" answering: keeping house and bearing children. Elizabeth, twenty and unemployed, wrote a furious rebuttal signed \"Lonely Orphan Girl.\" The editor, George Madden, was struck enough to run an advertisement asking the author to come forward; when she did, he hired her, giving her the pen name Nellie Bly. Her early investigative series on the lives of factory girls drew complaints from manufacturers, and she was reassigned to the women's pages — fashion, society, gardening. In early 1886, at twenty-one, she went to Mexico for roughly six months as a self-appointed foreign correspondent, publishing dispatches later collected as Six Months in Mexico; on her return she was put back on the women's pages. In 1887 she quit, leaving a note for a colleague: \"I am off for New York. Look out for me. Bly.\" After months of closed doors she talked her way into Joseph Pulitzer's New York World and accepted an assignment no one else would take: she feigned insanity, was committed, and spent ten days inside the Women's Lunatic Asylum on Blackwell's Island. Her exposé, Ten Days in a Mad-House (1887, when she was twenty-three), documented cruelty, spoiled food, and sane women trapped by poverty and language; it prompted a grand-jury investigation and an increase in the asylum's funding. In 1889-90 she circled the globe in seventy-two days, beating Jules Verne's fictional record. She died January 27, 1922.",
  sources: [
    "Kroeger, Brooke. Nellie Bly: Daredevil, Reporter, Feminist (New York: Times Books, 1994), Chapters 1-4.",
    "Bly, Nellie. Ten Days in a Mad-House (New York: Ian L. Munro, 1887).",
    "Library of Congress, \"Behind Asylum Bars: Nellie Bly Reporting from Blackwell's Island.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Father's death at 6, narrowed family circumstances, her joblessness at 20 — documented.",
      text: `There was a young woman of twenty in a smoky mill city, and the world had no place set for her.

Her father had died when she was six. He'd been a judge, a mill owner, a somebody — and then suddenly a widow and a houseful of children were sliding, year by year, from comfortable to cornered. The young woman had watched her mother's choices shrink to nothing. She'd learned exactly what happens to women with no money of their own.

She wanted to work. She was quick, sharp, fearless in an argument. It didn't matter. For a girl in that city there was mill work, kitchen work, or marriage.

She was sitting in that cornered life one January morning when she opened the city's newspaper and found a column with a title like a slammed door:

What Girls Are Good For.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The documented column and its thesis. 'A verdict on her own life' is interpretive framing.",
      text: `The column answered its own question. Girls were good for keeping house. For bearing children. A girl in public life was a monstrosity; a family that let its daughters work was a disgrace. Better they stay home, decorative and quiet, until a husband collected them.

She read it twice, going cold and then hot.

Because here was the thing: the column was a joke, but her life wasn't. The paper was only saying out loud what every door in the city had already told her. No work for you. No wages for you. No name of your own for you. Wait to be chosen.

She was twenty years old, broke, unchosen, and — according to the biggest paper in town — good for nothing she actually burned to do.

Somewhere in the third read, the humiliation turned into something with edges.

She sat down and wrote the angriest letter of her life.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 'Lonely Orphan Girl' rebuttal, the editor's advertisement seeking its author, the hire and pen name — all documented.",
      text: `She signed it Lonely Orphan Girl and sent it to the editor.

It wasn't polished. It was alive — a furious, fact-jabbing argument about what happens to real girls in that city, written by someone who obviously knew.

The editor read it and did something editors almost never do: he put an advertisement in his own paper, asking the anonymous author to come forward.

She walked into the newsroom the next day — a slight young woman in a worn coat, ready to be laughed at.

He offered her a story instead. Then a job.

They gave her a pen name, the way they did for lady writers. Fine. Under it, she started writing about the city's working girls — the factories, the wages, the bosses — from the inside, where no gentleman reporter had bothered to look.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Advertiser complaints → reassignment to the women's pages; the self-made Mexico stint and the return to the same pages — documented.",
      text: `The factory series was too good. That was the problem.

The factory owners complained to the paper. And the paper — needing their advertisements more than her truth — solved it the easy way: the young woman was reassigned. To fashion. To flower shows. To society teas and garden parties.

She tried everything to get off that page. She even packed herself off to a foreign country for half a year and mailed back real dispatches — politics, poverty, life — proving she could do the work anywhere on earth.

They ran the dispatches. Then they put her right back on the garden parties.

She was twenty-two, and she could see the whole rest of it from there: decades of teas, a pat on the head, a small life politely enforced.

One spring day she simply didn't come in. The note she left on a colleague's desk was two sentences long, and the second one was: Look out for me.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Months of closed doors in the big city; talking her way into the country's biggest paper; volunteering for the asylum assignment; the ten days inside — documented; conditions in one restrained line.",
      text: `The biggest city in the country did not want her either. For months she wore out shoe leather while every newsroom door stayed shut — no women, no exceptions.

So she aimed at the biggest paper of all, got past the front desk on pure nerve, and pitched herself to the editors. They had an assignment nobody would touch: the city's madhouse for women, on its island — everyone knew terrible rumors, no reporter could get inside.

She said: commit me.

She practiced staring. She checked into a boardinghouse and acted strangely for a night. Doctors declared her insane, and the city shipped her to the island.

Ten days inside — the cold, the spoiled food, the cruelty, and, worst, the sane women trapped there by poverty or bad luck or speaking the wrong language.

The paper got her out. Then she wrote it. All of it.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The exposé's impact (grand jury, funding), the fame, the 72-day circumnavigation — documented, names withheld.",
      text: `The story detonated. The city convened a grand jury; she guided its inspection of the island herself. Funding for the asylum was increased, and reforms followed — real ones, that outlasted the headlines.

And the woman from the garden pages was suddenly the most talked-about reporter in the country.

She had invented something: reporting that goes inside, undercover, and takes the reader along. She went down in a diving bell. She went inside sweatshops and jails. Then she took on a stunt so big the whole world followed the papers daily: racing around the entire globe faster than the most famous adventure novel said was possible.

She made it with days to spare. Crowds met her train home like a conquering general.

Good for keeping house, the column had said. She never did learn to stay in the room they assigned her.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Nellie Bly.

Ten Days in a Mad-House made her famous and made asylum reform a national cause; her seventy-two-day race around the world beat Jules Verne's fiction and made her a legend. She more or less invented undercover investigative journalism. None of that existed yet the morning she read, in print, that girls like her were good for keeping house and nothing else.

Your life is not theirs. But a piece of this story may still sit beside you.

Every institution she met agreed on her ceiling — the paper that hired her kept demoting her back under it. Her answer, twice, was to walk out of the room where the ceiling was and go find a bigger room.

The people who decide what you're good for are usually wrong, and they are never the last word. She's the proof in seventy-two days flat.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 22, 1791, blacksmith's son, Newington Butts; errand boy then bookbinder's
//    apprentice to George Riebau from ~14; read the books he bound (incl. the encyclopedia's
//    electricity article); 1812 (20) attended Humphry Davy's Royal Institution lectures, took and
//    bound ~300 pages of notes, sent them to Davy asking for scientific work; hired as Chemical
//    Assistant March 1, 1813 (21) — partly bottle-washing; Oct 1813-April 1815 accompanied Davy's
//    Continental tour, forced into valet duties after Davy's valet dropped out (promise of a
//    replacement never kept); Lady Davy (Jane) treated him as a servant — riding outside the
//    coach, eating with servants — and he seriously considered abandoning science and returning
//    home; he stayed for the science (met Ampère, Volta; saw Europe's laboratories); back home he
//    rose at the Royal Institution, first published paper 1816 (24); went on to the motor,
//    generator, field theory; founded the children's Christmas Lectures; declined a knighthood and
//    (twice) the presidency of the Royal Society. d. 1867.
//  Interpretive: "the humiliation reframed as tuition." Grounded in his letters from the tour.
//  Avoid saying: don't name Faraday / Davy / Royal Institution / London before the bridge; no
//    electricity specifics before the bridge (the "spinning a wire" hint in became is deliberate
//    and vague); class cruelty kept concrete but brief.
const faraday: FigureStageRow = {
  figureKey: "faraday",
  displayName: "Michael Faraday",
  birthYear: 1791,
  deathYear: 1867,
  stageId: "1812-1815-bottle-washer-and-valet",
  stageLabel: "The servant's seat: from bound lecture notes to the humiliating tour",
  ageMin: 20,
  ageMax: 24,
  themes: ["social_constraint", "dismissed", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "A blacksmith's son with no schooling taught himself science from the books he bound for a living, and talked his way into the great man's laboratory — as the servant who washed the bottles.",
    "For a year and a half across Europe the great man's wife made him ride outside the coach and eat with the servants, and he nearly gave up science to get his dignity back.",
    "He stayed, treated the humiliation as tuition, and came home to become a greater scientist than the man he had served.",
  ],
  facets: {
    emotionalCore:
      "Being reminded daily, by the seating at every meal, that no amount of mind could outrank his birth — and wanting the work so badly he swallowed it.",
    decisionShape:
      "Whether to go home and reclaim his dignity at the cost of science, or to keep the servant's seat because it was the only seat in the room where science happened.",
    triggerEvent:
      "The great man's valet quit on the eve of a grand scientific tour, and the assistant was pressed into a servant's duties — with a promise of relief that was never kept.",
    agencyState:
      "Bound by class, poverty, and a master's whims, with no credentials and no standing — but inside the room, every day, where the best science in the world was being done.",
  },
  biographicalFacts:
    "Michael Faraday was born September 22, 1791, in Newington Butts, south London, the son of an often-ill blacksmith; the family was poor enough that food was sometimes rationed, and his schooling was rudimentary. At about fourteen he was apprenticed to the bookbinder George Riebau, and for seven years he read the books he bound — including the Encyclopaedia Britannica's article on electricity — and performed simple experiments. In 1812, at twenty, he was given tickets to Humphry Davy's celebrated lectures at the Royal Institution; he took careful notes, expanded and bound them into a roughly 300-page volume, and sent it to Davy with a request for scientific employment. In March 1813, at twenty-one, Davy hired him as Chemical Assistant — work that included washing laboratory glassware. That October, Davy set out on an extended scientific tour of the Continent; his valet withdrew at the last moment, and Davy asked Faraday to fill the role temporarily, promising to hire a replacement abroad. He never did. For eighteen months Faraday served as assistant and unwilling valet while Lady Davy treated him as a servant — he rode outside the coach and ate with the servants — and his letters home record that he was miserable enough to consider returning to England and abandoning science altogether. He stayed for what the tour offered: Europe's laboratories and its greatest scientists, Ampère in Paris and Volta in Milan among them. Back in London from 1815, he rose at the Royal Institution, publishing his first scientific paper in 1816, at twenty-four. He went on to invent the electric motor and the generator, to discover electromagnetic induction and lay the foundations of field theory, and to found the Christmas Lectures for children that continue today; he declined a knighthood and twice declined the presidency of the Royal Society, preferring, he said, to remain plain Michael Faraday. He died August 25, 1867.",
  sources: [
    "Hamilton, James. A Life of Discovery: Michael Faraday, Giant of the Scientific Revolution (New York: Random House, 2004), Chapters 2-4.",
    "Cantor, Geoffrey. Michael Faraday: Sandemanian and Scientist (London: Macmillan, 1991).",
    "The Royal Institution, \"Michael Faraday (1791-1867)\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Blacksmith's son, bookbinder's apprentice reading what he bound, the lecture tickets, the bound notes sent with a job plea, the bottle-washing hire — all documented.",
      text: `There was a young man who learned science from the books he was paid to sew together.

His father was a blacksmith, often too sick to work; there were stretches of his childhood when a loaf of bread had to last him a week. School taught him his letters and not much else. At fourteen he was apprenticed to a bookbinder — and the shop turned out to be a library with wages. He read everything that crossed the bench. One article, about an invisible force just being discovered, set his mind on fire.

At twenty, he was given tickets to see the most famous scientist in the country lecture. He sat in the gallery and took down every word. Then he wrote the notes out fair, bound them into a handsome book — three hundred pages — and mailed them to the great man himself, asking for any work at all in science.

It worked. Sort of. He was hired as the laboratory assistant.

Which meant, much of the time, washing the bottles.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The valet trap at the tour's start (broken promise of a replacement); Lady Davy's documented treatment — outside the coach, meals with servants; his documented thoughts of quitting science.",
      text: `Then came the grand tour. The great man was to travel the Continent for months — every famous laboratory, every famous mind — and the assistant would come along. The chance of a lifetime.

At the last minute, the great man's manservant refused the trip. Would the assistant mind doing a servant's duties, just briefly, until a replacement was hired abroad?

No replacement was ever hired.

So for a year and a half, in every grand city in Europe, he was two people: the scientific assistant in the laboratory, and the servant everywhere else. The great man's wife enforced the second role with relish. He rode outside the coach in the cold. He ate downstairs, with the servants. He fetched and carried and was spoken to like a footman, this young man who had bound his own mind into a book to get here.

His letters home stopped pretending. He wrote that he was close to giving the whole thing up — science included — and walking home to his old bench.

Dignity, or the work. It had come down to that.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His decision to stay, grounded in what the tour gave access to. The 'tuition' framing is interpretive.",
      text: `He stayed.

Not because the humiliation stopped — it didn't — but because he did the arithmetic on it. Riding outside the coach was miserable, and the coach was going to every laboratory in Europe. Eating with the servants stung, and upstairs the great minds of the age were talking, and in the daytime he was in the room with them.

Nobody of his class got into those rooms. That was the whole cruel joke of his country: the room was everything, and his birth said never. Well — here he was, in the room, at the price of a servant's seat.

He decided the seat was tuition. He paid it.

And he watched everything, wrote down everything, and let the lady have her staircase.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The remaining tour months: laboratories and scientists (Ampère, Volta unnamed), the double role throughout — documented.",
      text: `The tour ground on, month after month. The double life didn't soften.

But the days — the days were an education no university on earth could have sold him. He stood in laboratories he'd only read about in the books he used to bind. He met the men whose names were on the discoveries. He watched the greatest experimentalists of the age work with their own hands, and he assisted, and asked, and remembered.

He was becoming — invisibly, downstairs — one of the best-trained scientific minds in Europe. No one had planned that. No one upstairs particularly noticed.

The cold seat on the outside of the coach carried him across the Alps, twice.

When the tour finally ended and he came home, he was the same blacksmith's son with no degree and no standing.

Except he wasn't, and the laboratory soon knew it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The post-tour rise; first published paper at 24; growing responsibility at the institution — documented.",
      text: `Home again, everything shifted.

The institution promoted him. The bottle-washing gave way to real experimental work, and it turned out no one in the building had better hands. Within a year of returning he published his first scientific paper — the bookbinder's apprentice, in the journals now, by name.

His name started to travel. Not because anyone had opened a door for him — the doors of that world stayed class-locked — but because results don't have an accent. When his experiments spoke, the gentlemen had to answer the experiments.

The man he had served remained famous, feted, titled. The former servant just kept working — steadily, patiently, decade after decade.

And somewhere in those decades, the world quietly rearranged itself around a new fact: the greatest experimental scientist alive had once eaten downstairs with the servants.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The motor, the generator, field theory (kept vague pre-bridge), the children's lectures, the declined honors — all documented.",
      text: `What he found in the laboratory changed the world more than any king of his century.

He discovered how to make electricity move things — the trick of spinning motion out of invisible force, and force out of motion — the founding discoveries behind, eventually, every motor and generator on earth. The powered world runs on his experiments.

He never forgot where he'd started. He founded a series of science lectures for children, at the same institution where he'd once washed bottles, and gave them himself for decades — a famous scientist explaining candles to twelve-year-olds like it was the most important audience alive. It still runs, every year, to this day.

They offered to make him a knight. He said no — he preferred to remain plain mister, as born. They asked him, twice, to be president of the grandest scientific society in the world. No again.

He'd seen exactly what titles were worth, from the outside of the coach.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Michael Faraday.

He discovered electromagnetic induction, invented the electric motor and the generator, and laid the foundations of field theory — Einstein kept his portrait on the study wall. He did it with no degree and no mathematics to speak of, a blacksmith's son who learned science from the books he bound. None of that had happened yet on the cold nights he rode outside the coach, wondering if he should quit.

Your life is not theirs. But a piece of this story may still sit beside you.

The people above him never did decide he belonged. He got into the room at a humiliating price, paid it with his eyes open, and let the work — eventually — outrank everyone who had looked down on him.

Being underestimated is a position, not a destiny. Some of the best work in history was done from exactly where you're standing.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. ~1864/65, enslaved at birth near Diamond MO (exact date unknown); as an infant he
//    and his mother were kidnapped by raiders — the baby was recovered, the mother never found;
//    raised (frail, often sick) by Moses and Susan Carver; wandered town to town for schooling from
//    ~11, doing laundry and farm work; 1885 (~20) accepted by mail to Highland College in Kansas —
//    admission withdrawn on arrival when they saw he was Black; 1886-1889 homesteaded a quarter
//    section in Ness County, KS — built a sod house, farmed, painted plants alone on the plains;
//    sold the claim 1889; 1890 (~25) admitted to Simpson College, Iowa (art + piano); art teacher
//    Etta Budd saw his plant paintings and steered him to botany at Iowa State (1891, ~26) — its
//    first Black student, later its first Black faculty member; 1896 went to Tuskegee for 47 years;
//    the peanut/crop-rotation work; advised presidents. d. Jan 5, 1943.
//  Interpretive: "no home to go back to, so he went forward"; the sod-house years as solitude.
//    Grounded.
//  Avoid saying: don't name Carver / Tuskegee / Kansas / Iowa / peanuts before the bridge; the
//    college-door rejection rendered plainly, no invented dialogue; the kidnapping in facts only
//    (pre-episode), not in beats.
const carver: FigureStageRow = {
  figureKey: "carver",
  displayName: "George Washington Carver",
  birthYear: 1864,
  deathYear: 1943,
  stageId: "1885-1891-turned-away-to-the-sod-house",
  stageLabel: "Turned away at the door: the withdrawn admission and the sod-house years",
  ageMin: 20,
  ageMax: 26,
  themes: ["dismissed", "solitude", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He was accepted to college by letter and turned away at the door when they saw his face, and there was no home behind him to retreat to — so he went further out instead, alone, to a claim on the empty plains.",
    "For three years he lived by himself in a house he cut from the sod, farming hard land and painting flowers, with the nearest voice miles away.",
    "He sold the claim, tried again at another school's door, and this time it opened — all the way.",
  ],
  facets: {
    emotionalCore:
      "Being welcomed on paper and refused in person — learning that his letters were acceptable and his face was not — with nowhere behind him to absorb the blow.",
    decisionShape:
      "Whether to stop asking schools to let him in, or to keep himself alive and learning by any means until some door somewhere would open on merit.",
    triggerEvent:
      "The college that had accepted him by mail withdrew the admission on sight, because he was Black.",
    agencyState:
      "No family, no money, no school that would have him — but two skilled hands, a habit of studying everything that grew, and a patience that outlasted institutions.",
  },
  biographicalFacts:
    "George Washington Carver was born enslaved near Diamond, Missouri, around 1864 or 1865; his exact birth date was never recorded. As an infant, he and his mother were kidnapped by raiders; the baby was recovered and returned, but his mother was never found, and he was raised by Moses and Susan Carver, the couple who had owned her. A frail, often sick child, he was hungry for learning, and from about eleven he moved from town to town across Missouri and Kansas seeking schooling, supporting himself with laundry work, cooking, and farm labor. In 1885, at about twenty, he applied by mail to Highland College in Kansas and was accepted; when he arrived, the college discovered he was Black and withdrew the admission. In 1886 he went further west and homesteaded a quarter section in Ness County, Kansas, where he built a sod house, broke and farmed the dry land, collected plants, and painted — living largely alone on the open plains from 1886 to 1889. He sold the claim in 1889 and drifted east to Iowa; in 1890, at about twenty-five, he was admitted to Simpson College, where he studied art and piano. His art teacher, Etta Budd, recognizing both his gift for painting plants and the limits of an art career for a Black man, urged him toward botany at Iowa State Agricultural College. He enrolled in 1891 as its first Black student, earned bachelor's and master's degrees, and became its first Black faculty member. In 1896 Booker T. Washington recruited him to the Tuskegee Institute in Alabama, where he taught and researched for forty-seven years, transforming Southern agriculture with crop rotation and his famous work on the peanut, and advising presidents and foreign governments. He died January 5, 1943.",
  sources: [
    "McMurry, Linda O. George Washington Carver: Scientist and Symbol (New York: Oxford University Press, 1981), Chapters 1-3.",
    "Vella, Christina. George Washington Carver: A Life (Baton Rouge: LSU Press, 2015).",
    "National Park Service, \"George Washington Carver\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The wandering-for-school youth, self-supported by laundry and farm work; the mail acceptance — documented.",
      text: `There was a young man who had spent his whole youth walking toward school.

He'd been born into the last days of slavery and orphaned before he could remember his mother's face. He grew up frail and often sick, raised by an older couple on a farm, and hungry — bottomlessly hungry — to learn. Since eleven he had drifted from town to town wherever a school would take him, paying his way with wash-work and farm labor, sleeping in barns and kitchens.

Plants were his gift. He could make anything grow, cure sick ones, draw and paint them so true you could smell them. Neighbors called him the plant doctor before he was grown.

At about twenty, he did the boldest thing yet: he applied to a real college, by letter.

The letter that came back said yes. He sold what he had and went.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The documented on-arrival withdrawal of admission at the college. No invented dialogue; 'letters acceptable, face not' is interpretive framing.",
      text: `He arrived with his trunk and his acceptance, and presented himself at the college.

And the college looked at him — at his face — and took the acceptance back.

They hadn't known, from the letters, what he was. Now they knew, and the answer changed. There was no appeal, no discussion worth having. The door that had opened by mail closed in person, and he was standing on the steps of it with everything he owned.

Other people, turned away like that, had a home to absorb them. He had none. No family waiting, no room kept for him anywhere on earth. The walking-toward-school life had been aimed entirely at this door.

He was twenty years old, alone in a town with no reason to stay in it, and the message could not have been plainer: his letters were acceptable. He was not.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 1886 move further west and the homestead claim, the sod house built by hand — documented.",
      text: `He did not go back. There was no back.

He went further out — west, to where the land was so empty the government would give a claim to anyone hard enough to hold it. He filed on a quarter section of open plain.

He built his own house out of the ground itself: bricks of cut sod, stacked into walls, a roof against the enormous sky. He broke the dry land and put in crops.

If no school would have him, fine — he would keep himself, feed himself, and study the biggest botany classroom on earth: the plains, alone, in every direction.

It wasn't the plan. It was the plan he could reach.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The 1886-1889 solitary homestead years: hard farming, plant collecting, painting — documented; the loneliness framing is interpretive but grounded.",
      text: `Three years on the claim.

The land fought him — dry summers, killing winters, wind that never once stopped. He hauled water. He coaxed crops out of dirt that didn't want to give them.

And the solitude was its own weather. Days without a voice. The nearest neighbors miles off; the nearest person who looked like him, farther than that.

He filled the silence with the work of his heart: he collected plants and studied them, and he painted — flowers, prairie grasses, whatever bloomed — with homemade brushes and whatever colors he could get, alone in a dirt house at the edge of the map.

He was keeping something alive out there, and it wasn't just the crops. It was the aim. Slowly he saved a little, and when the time came, he sold the claim and turned back east, toward the schools, to try the door again.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Simpson admission (art + piano), the art teacher's redirect to botany, the agricultural-college enrollment as its first Black student — documented.",
      text: `A small college in the next state said yes — and this time the yes held when they saw him.

He enrolled in what he loved: art, and piano. He was older than his classmates and poorer than all of them, running a laundry out of a shack to pay his way. He was also, very quickly, the art teacher's most remarkable student.

It was that teacher who changed his aim. She looked at his paintings — always plants, rendered with a botanist's eye — and told him the truth as she saw it: his gift was real, and the world would starve an artist of his color. But the state's great agricultural college could turn that same gift into a life.

He went. First student of his kind in the school's history.

The door didn't just open. He walked through it so far they eventually put his name on the building.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Degrees, first Black faculty member, the 47 years teaching poor farmers, the crop work, advising presidents — documented, names withheld.",
      text: `He took two degrees and became the college's first faculty member of his race. Then a famous school in the South called him to a bigger job: teaching science to the children of freed people, and rescuing the region's worn-out farmland.

He stayed forty-seven years.

He taught poor farmers how to bring dead soil back to life. He hauled a wagon-classroom into the countryside to reach people who couldn't come to him. From humble crops — most famously one little legume — he drew hundreds of uses, and half the South's agriculture turned on his advice. Presidents consulted him. Foreign governments consulted him. He kept living in two small rooms and turned down fortunes to stay a teacher.

The man once turned away from a college door on sight became, in his lifetime, the most famous scientist his people had ever produced — and one of the most beloved teachers in the country's history.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was George Washington Carver.

The peanut scientist — though that phrase sells him short. He revolutionized Southern farming, taught a generation out of poverty, advised presidents, and became one of the most honored scientists in American history. None of that had happened yet on the day a college looked at his face and took back its yes.

Your life is not theirs. But a piece of this story may still sit beside you.

He was refused at the door with no home behind him — the kind of moment that ends most stories. His answer was three years alone in a dirt house, keeping himself and his aim alive, until he could try another door.

A no at one door — even a cruel one — is one door. He kept knocking, and his name outlived every place that refused him.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Dec 22, 1887, Erode; raised Kumbakonam; consumed by mathematics from boyhood
//    (Carr's Synopsis at ~16); Government College scholarship 1904, lost it by failing non-math
//    subjects; Pachaiyappa's College — failed the FA exam twice; 1906-1912 the wilderness years: no
//    degree, deep poverty, tutoring for pennies, filling notebooks (worked on slate, chalk cheaper
//    than paper); serious illness 1909; showed notebooks to anyone who might help — R. Ramachandra
//    Rao gave him a small monthly allowance for a time; March 1912 (24) clerk at the Madras Port
//    Trust (30 rupees/month) under S. Narayana Iyer, who encouraged the mathematics; two letters to
//    English mathematicians (Baker, Hobson) went unanswered; Jan 16, 1913 (25) wrote G. H. Hardy
//    enclosing ~120 theorems ("I am 23 years of age" — he understated); Hardy judged them "must be
//    true, because, if they were not true, no one would have the imagination to invent them";
//    Cambridge 1914; FRS 1918. d. 1920 (the beats do not dwell on the early death).
//  Interpretive: "genius or crank — with no one within a thousand miles able to check." Grounded.
//  Avoid saying: don't name Ramanujan / India / Madras / Cambridge / Hardy before the bridge; no
//    equations; the religious dimension (Namagiri) left out of beats; the death at 32 mentioned
//    nowhere (bridge keeps to the notebooks' living legacy).
const ramanujan: FigureStageRow = {
  figureKey: "ramanujan",
  displayName: "Srinivasa Ramanujan",
  birthYear: 1887,
  deathYear: 1920,
  stageId: "1908-1913-notebooks-to-the-letter",
  stageLabel: "The notebooks nobody could read: failed exams to the letter to England",
  ageMin: 21,
  ageMax: 25,
  themes: ["worthlessness", "solitude", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He failed out of college twice — brilliant at exactly one thing and unable to make himself care about the rest — and spent his early twenties degreeless, poor, and filling notebooks with mathematics no one around him could read.",
    "He could not be sure himself whether the notebooks were genius or nonsense, because there was no one within a thousand miles who could check.",
    "At twenty-five, a clerk with no credentials, he mailed nine pages of his theorems to the greatest mathematician in England — the third such letter he'd sent, after two went unanswered.",
  ],
  facets: {
    emotionalCore:
      "Carrying work he believed was extraordinary while every official measure of his life said failure — no degree, no job, no one able even to tell him whether he was right.",
    decisionShape:
      "Whether to put away the notebooks and become employable, or to keep pouring everything into work that might be worthless and that no one nearby could judge.",
    triggerEvent:
      "He lost his scholarship and failed his exams twice, because he could not force himself to study anything but the one subject that consumed him.",
    agencyState:
      "No degree, no money, no teacher, no way to verify his own results — but the notebooks kept growing, and postage to England cost less than giving up.",
  },
  biographicalFacts:
    "Srinivasa Ramanujan was born December 22, 1887, in Erode, in southern India, and raised in the temple town of Kumbakonam in a poor Brahmin family. Mathematics consumed him from boyhood; at about sixteen he absorbed G. S. Carr's Synopsis of Pure Mathematics, a bare compendium of thousands of results, and began producing his own. In 1904 he won a scholarship to Government College, Kumbakonam, and promptly lost it by failing every subject except mathematics; at Pachaiyappa's College in Madras he twice failed the Fellow of Arts examination for the same reason. From about 1906 to 1912 — his late teens through his mid-twenties — he lived in poverty without a degree, tutoring students for small sums and filling large notebooks with original theorems, often working chalk-on-slate because paper was expensive, erasing with his elbow. He nearly died of illness in 1909. He showed the notebooks to anyone who might help; most could not read them, but R. Ramachandra Rao, a district collector and amateur mathematician, was persuaded enough to support him with a small monthly allowance for a time. In March 1912, at twenty-four, he became a clerk at the Madras Port Trust on thirty rupees a month, where his supervisor S. Narayana Iyer, himself a mathematician, encouraged the work. Letters presenting his results to two English mathematicians went unanswered. On January 16, 1913, at twenty-five, he wrote to G. H. Hardy of Cambridge, enclosing roughly 120 theorems. Hardy, after an evening studying them with J. E. Littlewood, concluded the results \"must be true, because, if they were not true, no one would have the imagination to invent them.\" Hardy brought him to Cambridge in 1914; in 1918 Ramanujan became one of the youngest Fellows of the Royal Society in its history. His notebooks — including the \"lost notebook\" rediscovered in 1976 — are still yielding new mathematics a century later.",
  sources: [
    "Kanigel, Robert. The Man Who Knew Infinity: A Life of the Genius Ramanujan (New York: Scribner's, 1991), Chapters 2-5.",
    "Hardy, G. H. Ramanujan: Twelve Lectures on Subjects Suggested by His Life and Work (Cambridge University Press, 1940).",
    "Berndt, Bruce C., and Robert A. Rankin. Ramanujan: Letters and Commentary (Providence: AMS, 1995).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The boyhood obsession, the borrowed compendium at ~16, the scholarship won — documented.",
      text: `There was a young man in a temple town who thought about one thing.

His family was poor — his mother sang at the temple for extra money, and the house took in student boarders to make rent. He was quiet, heavyset, odd, and from boyhood he was consumed, entirely, by mathematics.

At sixteen someone lent him an old reference book — thousands of mathematical results listed bare, with no explanations. He didn't just read it. He re-derived it, result by result, filling every margin, and then kept going past the book's edge into territory that was his own.

Numbers spoke to him the way music speaks to prodigies. Everything else — history, English, the sciences — was noise between mathematics.

He won a college scholarship at sixteen. The whole town was proud.

It was about to go wrong in the most predictable way possible.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The lost scholarship, the two FA failures, the degreeless wilderness years and the 1909 illness — documented.",
      text: `He failed everything except mathematics.

Not from laziness — from a kind of helplessness. He physically could not make himself care about the other subjects while the real work burned in him. The scholarship was withdrawn. At a second college he sat the big qualifying exam and failed it. He tried again. Failed again.

And that was the whole ladder in his world. No exam, no degree. No degree, no position — not even schoolteacher. Official society had one word for him now: failure.

There followed years — years — of nothing. Grinding poverty. Tutoring boys for pennies. A serious illness that nearly killed him. And through all of it, the notebooks kept growing: page after page of dense, strange, original mathematics that nobody — literally nobody he could reach — was capable of reading.

That was the loneliest part. Not the poverty. The uncertainty. Were the notebooks the work of a genius, or the elaborate delusion of a crank?

He believed he knew. But belief isn't proof, and there was no one within a thousand miles who could check.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The slate-and-chalk economy, the notebooks-first discipline, showing the work to anyone plausible — documented.",
      text: `He kept working. Whatever else the years took, they did not get the notebooks.

Paper cost money, so he worked his results out on a slate, chalk clicking for hours, erasing with his elbow, and only the finished theorems earned ink. Three notebooks, growing denser by the year.

And he refused to let the work stay private. He carried the notebooks to every educated man who might conceivably understand — officials, professors, anyone with mathematics in their past. Most flipped pages politely and saw hieroglyphics.

But a few sensed something. One important man, an amateur of mathematics, listened, was staggered, and quietly paid him a small allowance for a while so he could work.

Charity, notebooks, and stubbornness. It wasn't a living. It was a holding pattern — waiting for one reader who could actually judge.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The Port Trust clerkship under a sympathetic supervisor; the two unanswered letters to English mathematicians — documented.",
      text: `At twenty-four he finally got a real job — a clerk's desk at the port, tallying accounts for a modest wage.

It was rescue, of a small kind. And luck hid inside it: his supervisor turned out to love mathematics, saw what the new clerk was scribbling, and quietly made room for it. Finish the ledgers, then work.

But the central problem hadn't moved. The only people on earth who could truly judge the notebooks lived on the far side of the world, in the great universities of a country that ruled his.

So he wrote to them. Cold letters, from an unknown clerk with no degree, enclosing samples of his theorems.

The first eminent mathematician didn't reply. The second didn't reply.

A degreeless clerk claiming extraordinary results — every famous mathematician's mail had a stack of those, from cranks. He knew exactly what pile his letters were landing in.

He wrote a third letter anyway.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Jan 1913 letter to Hardy (~120 theorems), Hardy's documented evening of scrutiny and his 'no one would have the imagination to invent them' verdict, the invitation — documented.",
      text: `The third letter went to the most celebrated pure mathematician in England.

Nine pages of theorems — about a hundred and twenty of them, stated bare, without proofs, in strange notation. A covering note that said, in effect: I am a clerk. I have no university education. I believe you will find value in these.

The great man read it at breakfast and set it aside as probable fraud. But the pages nagged at him all day. That night he and his brilliant colleague sat down and worked through the claims, hour by hour.

Some results they recognized — rediscovered from nothing by this clerk. Some they could prove only with effort. And some defeated them entirely, yet had to be true — because, the great man said, no one on earth would have the imagination to invent them as lies.

The reply that sailed back changed everything. The greatest mathematical partnership of the age wanted the clerk. By name.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Cambridge, the honors (FRS among the youngest), the century of mathematics mined from the notebooks — documented; the early death deliberately not dwelt on.",
      text: `He crossed the ocean to the great university, and the work poured out — papers with the famous mathematician, results that startled the field, five years of discoveries that would have honored five careers.

The institutions that ran on exams and degrees had to invent exceptions for him. The country's grandest scientific society elected him one of its youngest fellows ever — the clerk who had failed every examination except the one that mattered, the one he'd set himself.

And the notebooks. The notebooks became a field of study in themselves. A century later, working mathematicians are still mining them — still finding, in the pages a poor young man filled alone with no one to check him, theorems the rest of mathematics needed another hundred years to want.

He had been right about himself. That's the plainest way to say it. In the years when every measure said failure, the notebooks said otherwise — and the notebooks were correct.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Srinivasa Ramanujan.

He is one of the greatest mathematicians who ever lived — the self-taught clerk whose letter to G. H. Hardy at Cambridge became the most famous cold letter in the history of science. His notebooks are still producing new mathematics today, a hundred years on. None of that had happened yet in the years he was failing exams and filling slates, unsure himself if any of it was worth anything.

Your life is not theirs. But a piece of this story may still sit beside you.

Every official measure of his life said worthless: failed, degreeless, unemployable. He had no way to prove the measures wrong — no one around him could even read the evidence. So he kept making the evidence, and kept mailing it, until it found the one reader who could.

The measures around you can all be wrong at once. They were about him — every single one.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. May 21, 1799, Lyme Regis, poor cabinetmaker's family (Dissenters, doubly
//    outsider); father died 1810 leaving debts — the children sold fossil "curiosities" to
//    survive; with her brother she excavated the famous ichthyosaur at ~12; by her twenties she
//    was the most skilled fossil hunter on the coast (dangerous cliff work); Dec 1823 (24) found
//    the first complete Plesiosaurus; Georges Cuvier — the world's leading anatomist — suspected
//    it was a fake/composite; the Geological Society of London held a special 1824 meeting where
//    Conybeare presented HER find (using her sketch) — she was not invited and could not be a
//    member (no women; honorary membership came only near her death); Cuvier conceded the specimen
//    was genuine; gentlemen geologists routinely published her finds without credit; she taught
//    herself anatomy and French (to read Cuvier), dissected modern animals to compare; opened
//    Anning's Fossil Depot 1826 (27); found Britain's first pterosaur 1828; scientists and
//    collectors traveled from across Europe to consult her. d. 1847.
//  Interpretive: "the science was built on her finds while the doors stayed shut"; vindication
//    framing of the Cuvier episode. Grounded.
//  Avoid saying: don't name Anning / Lyme Regis / Cuvier / plesiosaur / the Geological Society by
//    name before the bridge; NO "she sells seashells" (the tongue-twister link is apocryphal);
//    don't overstate — she was paid and had scientific friends; the sting is credit and standing,
//    not total obscurity.
const anning: FigureStageRow = {
  figureKey: "anning",
  displayName: "Mary Anning",
  birthYear: 1799,
  deathYear: 1847,
  stageId: "1823-1828-the-doubted-sea-dragon",
  stageLabel: "The doubted find: the plesiosaur, the closed society, the credit taken",
  ageMin: 22,
  ageMax: 28,
  themes: ["social_constraint", "dismissed", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "She dug ancient monsters out of collapsing cliffs to feed her family, and when she found a creature so strange the world's greatest expert called it a fake, the learned society met about her discovery without inviting her.",
    "The gentlemen published her finds under their own names and their society barred women, while she haggled over shillings and taught herself the science from borrowed books.",
    "She was proven right, kept digging, and the men who ran the new science quietly learned to travel to her door.",
  ],
  facets: {
    emotionalCore:
      "Watching a science get built out of what her hands pulled from the cliffs, while the rooms where it was discussed stayed locked to her sex and her class.",
    decisionShape:
      "Whether to swallow the credit-taking and keep supplying the gentlemen, or to insist on her own expertise — teaching herself the anatomy and the languages — until they had to deal with her as a mind and not a shovel.",
    triggerEvent:
      "The world's leading anatomist declared her strangest find a probable fake, and the learned society weighed her discovery at a meeting she was not allowed to attend.",
    agencyState:
      "Poor, unschooled, unadmittable to any scientific body — but the best eye and hands in the field lived in her, and the cliffs kept giving her proof.",
  },
  biographicalFacts:
    "Mary Anning was born May 21, 1799, in Lyme Regis on England's south coast, into a poor cabinetmaker's family who were also religious Dissenters — outsiders twice over. Her father took the children fossil-hunting on the dangerous coastal cliffs to sell \"curiosities\" to tourists; when he died in 1810 leaving debts, the children's fossil money helped keep the family fed. At about twelve, Mary and her brother Joseph excavated the skull and skeleton of the creature later named Ichthyosaurus. By her twenties she was the most skilled fossil hunter on the coast, working landslide-prone cliffs in winter when fresh falls exposed new bone. In December 1823, at twenty-four, she discovered the first complete skeleton of Plesiosaurus — a marine reptile so strange that Georges Cuvier of Paris, the world's most celebrated anatomist, suspected the specimen was a fake or a composite of two animals. The Geological Society of London took up the find at a special meeting in February 1824, where William Conybeare presented it using her sketch; Anning was not invited, was never credited in the presentation, and could not have joined the society in any case — it did not admit women. Cuvier, on fuller evidence, conceded the animal was genuine, and the affair established her reputation among working geologists even as the formal credit went elsewhere; throughout her career, gentlemen of science published descriptions of her finds with little or no mention of her. She taught herself geology and comparative anatomy, learned enough French to read Cuvier, and dissected modern fish and squid to compare with her fossils. In 1826, at twenty-seven, she opened her own shop, Anning's Fossil Depot, which collectors and savants from across Europe made a point of visiting; in 1828 she found Britain's first pterosaur. Shortly before her death the Geological Society raised money for her care and later honored her — the institutions arriving, as ever, late. She died of breast cancer on March 9, 1847, at forty-seven.",
  sources: [
    "Emling, Shelley. The Fossil Hunter: Dinosaurs, Evolution, and the Woman Whose Discoveries Changed the World (New York: Palgrave Macmillan, 2009).",
    "Torrens, Hugh. \"Mary Anning (1799-1847) of Lyme; 'The Greatest Fossilist the World Ever Knew'.\" British Journal for the History of Science 28, no. 3 (1995).",
    "Natural History Museum, London, \"Mary Anning: the unsung hero of fossil discovery.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The poor coastal childhood, father's death and debts, fossil money feeding the family, the famous find at ~12, the dangerous cliff work — documented.",
      text: `There was a young woman who dug monsters out of cliffs for a living.

She'd grown up poor in a little seaside town, in a family the town looked sideways at twice — for their poverty and for their chapel. Her father, a cabinetmaker, had taught the children his side trade: combing the crumbling cliffs for strange stone bones and shells to sell to tourists. When he died, leaving debts, the bones became the difference between eating and not.

She had the eye. Better than anyone on that coast — better, though nobody would have said it yet, than anyone alive. At twelve she had helped dig out a creature that made learned men in the capital argue with each other.

The cliffs were killers — they slid without warning, especially in winter, which was exactly when fresh falls exposed new bone, which was exactly when she went out.

She was in her twenties now. The finds were getting stranger.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The 1823 plesiosaur; Cuvier's fake/composite suspicion; the society's special meeting she wasn't invited to; the credit going to the presenting gentleman — all documented.",
      text: `One winter she uncovered the strangest thing yet: a complete skeleton of a sea creature with a neck like nothing on earth. A neck so long the leading expert of the age — the great anatomist across the water, the man whose word was law — declared it probably a fake. Either an error, or a fraud: two skeletons stitched together by a clever seller of curiosities.

A fraud. Her.

Everything her family ate came from her reputation for honest bone. If the great man's verdict stood, she wasn't just wrong — she was a cheat, and finished.

The learned society in the capital called a special meeting about the creature. Her creature. A gentleman scientist presented it, using her own sketch.

She was not invited. She could not have been: the society did not admit women — not to membership, not to the room.

They debated her find, her honesty, her life's work — and she read about it afterward, like the public.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She stood by the specimen; Cuvier examined fuller evidence and conceded it was genuine — documented.",
      text: `She stood by the bones.

She had lifted every one of them out of the cliff with her own hands. There was no seam, no stitch, no second animal. The creature was simply true — truer than the expert's imagination had yet stretched.

She said so, plainly, to the gentlemen she supplied. Let the great man look closer.

He looked closer. More evidence went across the water — better drawings, fuller detail.

And the most powerful scientific voice in the world took it back. The creature was genuine. The impossible neck was real. The poor young woman from the seaside town had been right, and the great man had been wrong, and every learned gentleman in that closed room now knew it.

Her name still didn't appear in the official account. But in the letters the men of science wrote to each other, it started appearing constantly.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The ongoing credit-taking; her self-taught anatomy, French, and dissections; the constant money worry — all documented.",
      text: `Vindication, it turned out, paid nothing and changed less.

The pattern held for years. She found; gentlemen published. Her monsters made careers and filled museum halls under other people's names, while she bargained over shillings on the beach and worried about rent like always.

She refused to stay a shovel. At her kitchen table, by lamplight, she taught herself the science of her own finds — anatomy from borrowed books, even the foreign language the great expert wrote in, so she could read the man who'd doubted her in his own words. She cut open modern fish and squid to compare their bones with her stone ones, which is simply what a scientist does — and she had made herself one, alone, without a single door opening to help.

The gentlemen knew. Their letters admit it: the young woman understood the creatures as well as anyone in the kingdom.

The rooms stayed locked anyway. She kept digging.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The 1826 shop and the savants traveling to consult her; the 1828 pterosaur — documented.",
      text: `So the world started coming to her instead.

At twenty-seven she opened her own shop in the seaside town — a proper one, with her name over the door and a sea-monster skeleton in the window. And the shop quietly reversed the geography of the whole science: collectors, professors, and famous men from across the continent now made pilgrimages to a fossil shop run by a cabinetmaker's daughter, to buy from her and — just as much — to ask her.

Because there was no substitute for her. She knew the cliffs, the creatures, the anatomy, better than the members of any society.

The year after the shop opened, she pulled a new impossibility out of the cliffs — the first flying reptile ever found in her country. Another sensation. Another round of learned papers.

The rooms in the capital never did open to her. Her doorway had become the room.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Her finds' foundational role in the new science; the late, small institutional honors — documented; 'the greatest fossilist' phrasing is from a contemporary source.",
      text: `The creatures she found rewrote the story of the earth.

Her sea dragons and flying reptiles forced the learned world to face a staggering idea — whole tribes of animals that had lived and vanished long before people. The new science built on that idea, the one that would soon shake the century, stood on specimens her hands had freed from the rock.

The gentlemen's institutions came around slowly, and small. Near the end of her life, the society that had never admitted her raised money for her care and honored her — late, the way institutions arrive.

But the people who actually did the science had known for decades. One who knew her called her, flatly, the greatest fossilist the world ever knew.

Not the greatest woman fossilist. The greatest — full stop — working from a shop by the sea, in the rooms they couldn't lock.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Mary Anning.

She found the first complete plesiosaur, Britain's first pterosaur, and the great ichthyosaurs — discoveries that helped found the science of paleontology and paved the road to Darwin. The Geological Society that wouldn't let her in the room now celebrates her; the Natural History Museum displays her finds by name. None of that acknowledgment existed in the winter when the world's greatest expert was calling her a probable fraud.

Your life is not theirs. But a piece of this story may still sit beside you.

She did the work and watched the credit walk away in gentlemen's coats, over and over, for years. She answered by getting so undeniably good that the field had to route itself through her door — titles or no titles, room or no room.

Credit is slow and crooked, but competence compounds. Keep doing the real thing. The record has a long memory — it found her.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 12, 1913, Alabama sharecropper's son, raised Cleveland; Berlin Aug 1936
//    (age 22): four gold medals; refused the exhausting European exhibition tour that followed and
//    AAU chief Avery Brundage had him suspended from amateur competition — his track career ended
//    within weeks of his triumph; promised endorsements evaporated; 1936-1940: raced against
//    horses at exhibitions ("I had four gold medals, but you can't eat four gold medals" — his
//    words), gas-station attendant, playground janitor, jazz-band tour 1937, a dry-cleaning chain
//    that failed and left him in debt (bankruptcy ~1939); no White House invitation from FDR;
//    later rebuilt as a speaker and goodwill ambassador; Presidential Medal of Freedom 1976.
//    d. 1980.
//  Interpretive: "the fastest man on earth with nowhere to run" framing. Grounded.
//  Avoid saying: don't name Owens / Berlin / Hitler / the Olympics explicitly before the bridge
//    ("the greatest games on earth" phrasing keeps it soft — the four-medals detail is kept but
//    unattributed); the horse-racing rendered with his own dignity-forward framing, never as
//    minstrelsy; no dollar figures.
const owens: FigureStageRow = {
  figureKey: "owens",
  displayName: "Jesse Owens",
  birthYear: 1913,
  deathYear: 1980,
  stageId: "1936-1940-after-the-gold",
  stageLabel: "You can't eat four gold medals: the suspension and the lean years",
  ageMin: 23,
  ageMax: 27,
  themes: ["dispossession", "worthlessness", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "Weeks after the greatest triumph an athlete can have, he said no to the men who ran his sport, and they banned him for life — the fastest man on earth, forbidden to race, at twenty-three.",
    "The promised offers evaporated, and he pumped gas, swept playgrounds, and raced against horses at fairs to feed his family, while strangers told him it was beneath him.",
    "He rebuilt himself from nothing into something no one had offered him — and decades later his country finally gave him its highest civilian honor.",
  ],
  facets: {
    emotionalCore:
      "Being the best in the world at the one thing he was built for, and having it taken away by other men's pens — left holding medals that couldn't buy groceries.",
    decisionShape:
      "Whether to be ashamed of the small work survival demanded of a famous man, or to do it with his head up and build something new out of the wreckage of the plan.",
    triggerEvent:
      "He refused an exhausting exhibition tour after his triumph, and the men who ran amateur sport suspended him permanently — ending his career within weeks of its peak.",
    agencyState:
      "Banned from his sport, abandoned by the promised sponsors, famous and broke at once — but still owning his name, his legs, and his refusal to disappear.",
  },
  biographicalFacts:
    "Jesse Owens was born September 12, 1913, in Oakville, Alabama, the son of a sharecropper, and raised in Cleveland, Ohio. At the Berlin Olympic Games in August 1936, at twenty-two, he won four gold medals — the 100 meters, 200 meters, long jump, and 4x100 relay — the most celebrated athletic performance of his era, achieved in front of Hitler's regime. Immediately afterward, exhausted, he declined to continue a grueling exhibition tour of Europe arranged by athletics officials; Avery Brundage's Amateur Athletic Union responded by suspending him from amateur competition permanently, ending his track career within weeks of his triumph. The commercial offers that had been dangled evaporated within months. President Roosevelt sent no invitation and no telegram. Over the following years Owens raced against horses and motorcycles at fairs and exhibitions — \"People say it was degrading for an Olympic champion to run against a horse, but what was I supposed to do? I had four gold medals, but you can't eat four gold medals,\" he said — worked as a gas-station attendant and playground janitor, toured with a jazz band in 1937, and opened a dry-cleaning chain that failed and left him in debt; he went bankrupt by decade's end. In the 1950s and after, he rebuilt his life as a public speaker and goodwill ambassador, becoming one of the most sought-after inspirational speakers in America. He received the Presidential Medal of Freedom in 1976 and died March 31, 1980.",
  sources: [
    "Baker, William J. Jesse Owens: An American Life (New York: Free Press, 1986), Chapters 7-10.",
    "Schaap, Jeremy. Triumph: The Untold Story of Jesse Owens and Hitler's Olympics (Boston: Houghton Mifflin, 2007).",
    "Olympics.com, \"From horse-racer to speech writer: Jesse Owens' life after the Olympic Games.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The 1936 triumph (kept soft: 'the greatest games on earth'), the sharecropper-to-champion arc — documented.",
      text: `There was a young man who, for one week, was the most famous athlete on the planet.

He was a sharecropper's son who had grown up poor in a big northern city, and he could run faster than any human being alive. That summer, at the greatest games on earth — held, as it happened, in the capital of a hateful regime that preached his inferiority — he won four gold medals in front of the world.

Four. No one had ever done it.

He sailed home at twenty-two to parades and headlines, with the whole country chanting his name and businessmen promising him the moon.

He had done the impossible. Now, surely, came the reward.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The refused exhibition tour, the permanent AAU suspension, the evaporating offers, the absent White House invitation — all documented.",
      text: `First came a bill.

The men who ran amateur sport had arranged a long exhibition tour of Europe — more races, more crowds, money for the officials, nothing for the runners. He was exhausted and homesick, and his family needed him earning. He said no.

The officials answered with a ruling: suspended from amateur competition. Permanently.

Just like that, the fastest man on earth was forbidden to race. Not injured. Not beaten. Banned — by men in offices, weeks after he'd given his country the proudest sporting week it ever had.

Then the promised moon evaporated. The endorsements never signed. The offers dried up within months. The president of his own country never even sent a telegram.

He was twenty-three, world-famous, and broke, with a wife and child and medals that shone and bought nothing.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The exhibition races against horses, with his own documented framing ('you can't eat four gold medals'); dignity-forward per his own accounts.",
      text: `So he worked. Whatever there was.

The most famous offer left standing was a strange one: racing at fairs and exhibitions — against horses. People clucked that it was beneath an Olympic champion.

He had an answer for them, and he said it plainly for the rest of his life: he had four gold medals, and you can't eat four gold medals.

So he ran against the horses, and took the pay, and kept his head up doing it. Between exhibitions he pumped gas. He swept a playground. He led a band on tour for a season.

None of it was the plan. All of it was food on his family's table, earned in daylight.

Shame, he decided, belonged to the men who had banned him — not to the man doing honest work.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The failed dry-cleaning chain, the debt and bankruptcy, the long slide through the decade — documented.",
      text: `He tried to build something of his own — a chain of cleaning shops with his famous name on the sign.

It failed. The partners mismanaged it, the debts landed on him, and by the end of the decade the most celebrated athlete of his generation was bankrupt.

Those were long years. The world that had chanted his name moved on to new names. He was still a young man — the legs still worked, the fastest legs alive — and there was nowhere on earth he was allowed to use them for their purpose.

He kept working the small jobs and the exhibitions. He kept his name clean even when it wasn't worth much on a storefront.

And slowly he noticed the one asset the officials couldn't ban: when he stood up in a room and told his story, nobody breathed until he finished.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The rebuild as a public speaker and goodwill ambassador — documented; compressed.",
      text: `The talking became the new running.

He started getting asked — schools, churches, companies, youth clubs. He would stand up, plain and warm, and tell them about the sharecropper's cabin, about the week he beat the world in the hateful regime's capital, about the horses and the gas pumps after. About getting up anyway.

He was good at it. Better than good — he had the gift of making a room believe that dignity is a decision you can make in any circumstances, because he had made it in most of them.

The bookings multiplied year over year. The man the officials had silenced became one of the most sought-after speakers in the country — paid, at last, and honored, at last, for exactly what he was.

Nobody gave him that second career. There was no committee for it. He built it out of the wreckage, by hand.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The ambassador decades and the 1976 Presidential Medal of Freedom — documented, kept anonymous.",
      text: `For the rest of his life he was his country's ambassador of the possible — traveling the world for it, speaking to its children, carrying its flag to the same great games that had once been the site of his triumph and his ruin.

And late in his life, in the White House that had never sent the telegram, a president hung his country's highest civilian honor around his neck.

It took forty years. The officials who banned him were long gone, their names remembered mainly for what they did to him.

His name, meanwhile, had become shorthand — everywhere on earth — for a very specific idea: that excellence can outrun hate, and that a man can be stripped of everything but who he is, and build again from exactly that.

Four medals you can't eat. It turned out they were never the treasure anyway. The man was.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Jesse Owens.

His four gold medals at the 1936 Berlin Olympics, in front of Hitler, remain the most famous rebuke in sports history. What most people never learn is what came after: banned from his sport within weeks, abandoned by the sponsors, racing horses at fairs to feed his family. The Presidential Medal of Freedom came forty years later. None of that redemption was visible yet when he was pumping gas as the fastest man alive.

Your life is not theirs. But a piece of this story may still sit beside you.

He did everything right, better than anyone on earth had ever done it — and the reward was taken away by men with pens, almost overnight. What he kept was the part no ruling could touch: how he carried himself while he rebuilt.

What's been taken from you is not the whole of you. He's the proof, in four medals and forty years.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. June 13, 1865; met Maud Gonne in London, Jan 1889 (23) — she left after nine
//    days and he was, by his own account, transformed ("the troubling of my life began"); first
//    marriage proposal 1891 (26), refused; at least four proposals refused between 1891 and 1901;
//    her documented reply that he made beautiful poetry out of his unhappiness and marriage would
//    be "a dull affair"; ~50 poems written to or about her; "When You Are Old" (1891), "He wishes
//    for the Cloths of Heaven" (1899, "tread softly because you tread on my dreams"); The Rose
//    (1893); he later married (1917), had children, won the Nobel Prize in Literature 1923.
//    d. 1939.
//  Interpretive: the arc's discipline — the love was real and unreturned, and the LIFE grew large
//    anyway; the poems as what he built, not as a strategy that "won" anything. Grounded.
//  Avoid saying: don't name Yeats / Maud Gonne / Ireland / poem titles before the bridge; do NOT
//    romanticize persistence-after-no as courtship advice — the beats render the no as final and
//    the work as where the feeling went; the later marriage kept to one line (and NOT the Iseult
//    episode); no politics.
const yeats: FigureStageRow = {
  figureKey: "yeats",
  displayName: "W. B. Yeats",
  birthYear: 1865,
  deathYear: 1939,
  stageId: "1889-1893-the-no-and-the-poems",
  stageLabel: "She said no: the unreturned love and where he put it",
  ageMin: 23,
  ageMax: 28,
  themes: ["heartbreak", "solitude", "finding_voice"],
  antiThemes: [],
  shapeSentences: [
    "At twenty-three he fell wholly in love, and the answer — asked outright at twenty-six, and again, and again — was no, every time, for the rest of their lives.",
    "He carried a love with nowhere to land, and instead of letting it curdle, he poured it into work — poem after poem to a person who would never be his.",
    "The no never changed, and his life grew large anyway: the poems written to her became some of the most beloved in the language.",
  ],
  facets: {
    emotionalCore:
      "Loving someone completely who does not love you back — the ache of an answer that never changes, and the question of what to do with a feeling that size.",
    decisionShape:
      "Whether to let unreturned love turn to bitterness or begging, or to accept the no and give the feeling somewhere to go — into the work, for years.",
    triggerEvent:
      "He met her in his early twenties and was changed in nine days; when he finally asked her to marry him, she refused — the first no of many.",
    agencyState:
      "He could not make her love him — no one can make that — but the words were his, and the feeling was real, and he could build with it instead of drowning in it.",
  },
  biographicalFacts:
    "William Butler Yeats was born June 13, 1865, near Dublin. In January 1889, at twenty-three, he met Maud Gonne in London — a moment he later described with the sentence \"the troubling of my life began.\" She stayed nine days and left him transformed. In 1891, at twenty-six, he proposed marriage; she refused. She refused again — at least four proposals between 1891 and 1901 — telling him on one occasion that he would not be happy with her: \"You make beautiful poetry out of what you call your unhappiness and you are happy in that. Marriage would be such a dull affair.\" The love remained, by every account including his own, the central emotional fact of his young manhood, and it went into the work: at least fifty of his poems were written to or about her, including \"When You Are Old\" (1891) and \"He wishes for the Cloths of Heaven\" (1899), with its closing lines \"I have spread my dreams under your feet; / Tread softly because you tread on my dreams.\" His collection The Rose appeared in 1893, when he was twenty-eight. The no never became a yes. Yeats married Georgie Hyde-Lees in 1917 and had two children; in 1923 he was awarded the Nobel Prize in Literature, and he is widely regarded as the greatest poet of his age in English. He died January 28, 1939.",
  sources: [
    "Foster, R. F. W. B. Yeats: A Life, Volume I: The Apprentice Mage, 1865-1914 (Oxford: Oxford University Press, 1997), Chapters 4-6.",
    "Yeats, W. B. Memoirs, ed. Denis Donoghue (London: Macmillan, 1972).",
    "Yeats, W. B. The Rose (1893) and The Wind Among the Reeds (1899).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The Jan 1889 meeting, the nine days, his own 'troubling of my life began' — documented.",
      text: `There was a young man of twenty-three, a poet just getting started, all nerves and notebooks.

One winter day, a young woman came to visit his family's house on some business of causes and politics. She was tall, fierce, beautiful in a way that rearranged rooms, and she talked about the world like it was hers to fix.

She stayed in his city nine days. Nine.

He wrote later, looking back as an old man, that on that day the troubling of his life began.

He was not a casual person. He did not fall casually. Something in him simply decided, all at once and without asking him, that this was the person — the face, the voice, the whole weather of her — and it never fully un-decided for the rest of his life.

She left after nine days. He started writing.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The 1891 proposal and refusal; the pattern of refusals; her documented 'beautiful poetry out of your unhappiness' reply — documented.",
      text: `For two years he loved her the way you love someone from the edge of their life — letters, visits when she passed through, friendship that was everything to him and pleasant to her.

At twenty-six he finally asked her, outright. Marry me.

She said no.

Kindly, but no. And when he asked again — because over the years he did ask again, more than once — the answer had a terrible steadiness to it. No, and no, and no.

Once she even explained, with a smile that must have cut worse than anger: he made beautiful poetry out of what he called his unhappiness, and he was happy in that. Marriage, she said, would be such a dull affair.

There it was. The person he loved most in the world had looked directly at the center of him and declined it.

He was young, unknown, and hollowed out. The feeling had nowhere to land — and it was not going away.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The turn of the feeling into the work; the poems of 1891-93 — documented. The 'somewhere to go' framing is interpretive.",
      text: `A feeling that size, refused, can rot a person. It becomes bitterness, or begging, or a locked room you live in.

He found a fourth door.

He could not make her love him — nobody can make that, and the trying only shrinks a man. What he could do was give the feeling somewhere to go.

So he put it in the work. Not as complaint — as craft. He took the ache and made it into lines: about her face, about time, about loving someone whose eyes are on the horizon and not on you.

One poem imagined her grown old by a fire, reading his book, remembering the one man who had loved the pilgrim soul in her.

He was twenty-six when he wrote that. It has outlived them both.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The years of continued unreturned love and continued work; ~50 poems over the years — documented; compressed.",
      text: `The years did not tidy it up.

She stayed in his life — friend, muse, comrade in causes — always near, never his. Each time he had half healed, a letter or a visit would open it again. And the answer, whenever he tested it, stayed no.

He didn't handle it perfectly. Real people don't. There were years he circled her like a moth, years he swore off, years he tried loving elsewhere and found the old weather rolling back in.

But the discipline held where it counted: the feeling kept going into the pages instead of into ruin. Poem after poem — dozens over the years, some of the finest love poetry in the language, all of it addressed to a woman who was never going to say yes.

He built a cathedral on a foundation of no.

And meanwhile — almost without his noticing — the poems were making his name.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The 1893 collection and his emerging stature; the 'cloths of heaven' poem (1899) referenced without title — documented.",
      text: `By twenty-eight he had published the book that announced him — and the literary world began to understand that something major had arrived.

The poems to her kept coming as the years passed, and they kept getting truer. The most famous of them is eight lines long. In it, a poor man wishes he could spread the embroidered cloths of heaven under the feet of the one he loves — but being poor, he has only his dreams.

I have spread my dreams under your feet, it ends. Tread softly, because you tread on my dreams.

People who have never heard his name can finish that sentence.

That is what he did with the no. Not revenge, not forgetting — transformation. The love was never returned, and he refused to let that make it worthless. He made it into something strangers would carry in their pockets for a hundred years.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The later marriage and family (one line, per provenance), the Nobel, the stature — documented, names withheld.",
      text: `And his life — the life she predicted would be dull — grew enormous.

He became his country's great poet, then one of the world's. He built theaters, movements, a national literature almost by hand. In time he married — a real marriage, children, a household — and the work deepened decade over decade; his greatest poems came in his fifties and sixties, which almost never happens to poets.

The world's highest literary honor came to him in his late fifties.

And the woman? They remained in each other's lives, complicatedly, to the end. The no never changed. He never pretended it hadn't mattered — the poems to her kept coming even when his hair was white.

But here is the thing his story proves: an unreturned love did not get to decide the size of his life. He decided that.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was W. B. Yeats.

He won the Nobel Prize in Literature and is commonly called the greatest poet of his age. "When You Are Old" and "He wishes for the Cloths of Heaven" — the poems read at weddings by people who never learn they were written to a woman named Maud Gonne, who said no to him for forty years — came out of exactly the heartbreak we just walked through. None of the glory existed yet when he was twenty-six, freshly refused, wondering what to do with a feeling that size.

Your life is not theirs. But a piece of this story may still sit beside you.

The person he wanted most never wanted him back, and no amount of brilliance changed it. What he controlled was what the love became instead — and he chose to build with it rather than be buried by it.

A no can end a hope without ending you. What you do with the feeling is still yours to decide.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 26, 1892, Atlanta TX, tenth of thirteen children of sharecroppers (her
//    father was part Cherokee and left the family); cotton fields as a child, one term of college
//    money; Chicago ~1915 (23), manicurist at the White Sox Barber Shop; brothers back from WWI
//    teased her that French women could fly planes and she couldn't; every American flight school
//    refused her (Black AND a woman); Chicago Defender publisher Robert Abbott urged France;
//    Berlitz night classes in French; sailed Nov 20, 1920 (28); a French school rejected her as a
//    woman; the Caudron Brothers' School at Le Crotoy accepted her; license from the Fédération
//    Aéronautique Internationale June 15, 1921 (29) — the first Black woman and first Native
//    American woman licensed to fly, before American women's aviation had opened at all; barnstormed
//    as "Queen Bess," refused to perform for segregated gates. d. 1926 (air accident — not in beats).
//  Interpretive: "she changed countries rather than change her mind." Grounded.
//  Avoid saying: don't name Coleman / Chicago / France / the Defender before the bridge (the
//    "language of a country across the ocean" phrasing keeps it soft); her death is NOT in the
//    beats or bridge; no "Queen Bess" before the bridge.
const coleman: FigureStageRow = {
  figureKey: "coleman",
  displayName: "Bessie Coleman",
  birthYear: 1892,
  deathYear: 1926,
  stageId: "1918-1921-no-school-would-take-her",
  stageLabel: "No school would take her: the manicure table to the French license",
  ageMin: 24,
  ageMax: 29,
  themes: ["dismissed", "quiet_defiance", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "She wanted one thing — to fly — and every flight school in her country refused her twice over, for her sex and for her skin.",
    "So she studied a foreign language at night after the manicure table, saved her wages, and crossed an ocean to a country whose schools would look at her hands instead of her color.",
    "At twenty-nine she came home with an international pilot's license — the first woman of her people ever to hold one — earned in a language she'd taught herself for the purpose.",
  ],
  facets: {
    emotionalCore:
      "Burning for a thing the whole apparatus of her country had quietly agreed she could never have — and refusing to let the refusals become her opinion of herself.",
    decisionShape:
      "Whether to accept that the doors at home were locked, or to learn a new language, save a manicurist's wages, and go find a door on another continent.",
    triggerEvent:
      "Every American flight school she approached turned her away — no women, and certainly no Black women.",
    agencyState:
      "No school, no sponsor at first, no precedent — but steady hands, steady wages, evening hours that were her own, and an ocean that could be crossed.",
  },
  biographicalFacts:
    "Bessie Coleman was born January 26, 1892, in Atlanta, Texas, the tenth of thirteen children of sharecroppers; her father, who was part Cherokee, left the family when she was a girl, and she picked cotton and took in laundry through childhood. She managed one term of college before the money ran out. Around 1915, at twenty-three, she joined the Great Migration to Chicago, where she worked as a manicurist at the White Sox Barber Shop. Her brothers came home from the First World War with stories of France; one teased that French women could fly airplanes, and she could not. She resolved to fly. Every American flight school she approached refused her — aviation schools admitted neither women nor Black students — and no American aviator would teach her. Robert S. Abbott, publisher of the Chicago Defender, urged her to train in France, where attitudes toward women in aviation were less closed. She took night classes in French at a Berlitz school while working, saved her wages, attracted modest backing from Abbott and the banker Jesse Binga, and sailed for France on November 20, 1920, at twenty-eight. One French school rejected her because she was a woman; the Caudron Brothers' School of Aviation at Le Crotoy accepted her, and she completed the ten-month course in seven months, learning in a language she had studied expressly for the purpose. On June 15, 1921, at twenty-nine, she received her license from the Fédération Aéronautique Internationale — the first Black woman and the first woman of Native American descent ever licensed to fly, and the first Black person to hold an international aviation license. She returned to America a sensation, barnstormed to huge crowds as \"Queen Bess,\" lectured to Black audiences about aviation, and refused to perform at events with segregated entrances. She died in an air accident on April 30, 1926, while preparing for a show.",
  sources: [
    "Rich, Doris L. Queen Bess: Daredevil Aviator (Washington: Smithsonian Institution Press, 1993), Chapters 1-3.",
    "Smithsonian National Air and Space Museum, \"Bessie Coleman\" biographical materials.",
    "Borden, Louise, and Mary Kay Kroeger. Fly High! The Story of Bessie Coleman (New York: Margaret K. McElderry Books, 2001).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The cotton-field childhood, the migration north, the manicure table, the brothers' teasing about flying — documented.",
      text: `There was a young woman doing nails in a barbershop in a big northern city.

She had grown up picking cotton in the deep South, the tenth of thirteen children, and she had gotten herself north on her own steam — one of the great tide of people moving toward something better. The barbershop was full of talk: sports, politics, and lately, the war just ended overseas.

Her brothers had fought in that war, in a country across the ocean. They came home with stories. And one of them liked to tease her with a particular one: over there, he said, women fly airplanes. French women fly. You? You'll be doing nails forever.

He meant it as a joke.

Something in her stood up and never sat back down. That. That was the thing. She was going to fly.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The blanket refusals by American flight schools and instructors (both her sex and her race) — documented.",
      text: `Finding a flight school turned out to be easy. There were plenty.

Getting into one was another matter. She wrote, she asked, she presented herself. And the answer came back the same from every direction, sometimes politely, sometimes not:

No women.

And beneath that, the second no, the one that didn't always bother being polite: certainly no Black women. Not in any school, not in any cockpit, not in this country. She could not even hire a private instructor — no aviator would take her money.

It wasn't one closed door. It was the discovery that there were no doors — that the entire apparatus of her country had quietly agreed, before she was born, that a woman like her did not fly.

She was in her mid-twenties, doing nails ten hours a day, in love with a thing she had never once touched.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The advice to train abroad, the Berlitz night classes, the wage-saving — documented.",
      text: `A powerful friend — a newspaperman who championed her people — gave her the sentence that reorganized everything: the schools here will never take you. The schools over there might.

Over there. The country her brothers had fought in. Where women flew.

There was one small problem: the schools over there taught flying in their own language, of which she spoke not a word.

So the manicurist enrolled in night classes. After ten hours at the table, she studied a foreign language, evening after evening, month after month — verbs and vocabulary between shifts, aimed at airfields she had never seen.

She saved every wage she could hold onto. She took a better-paying job managing a chili parlor to save faster.

If her own country wouldn't teach her, fine. She would change countries. She was not going to change her mind.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The ocean crossing at 28; the first French school's rejection (as a woman); the acceptance at the second; the hard course in a learned language — documented.",
      text: `At twenty-eight she boarded a ship alone and crossed the ocean.

The first school she applied to over there turned her down too — not for her skin this time, but for her sex. Even the freer country had its locks.

The second school said yes.

Then came the hard part: months of training, in winter, in a language she'd learned at night school. Walking miles to the airfield every day. Flimsy machines of wood and cloth. During her training she watched a fellow student die in a crash — and went up anyway, the next day and every day after.

She finished the ten-month course in seven.

Nobody was cheering. Nobody back home even knew where she was, except a few. It was just her, the cold airfield, the borrowed language, and the one thing she had crossed an ocean to take.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The June 15, 1921 FAI license and the firsts it represented — documented.",
      text: `On a June day, the international federation that governed the world's aviation issued her its license.

Hers. By name.

The first woman of her people — of either of her peoples — ever licensed to fly. Not the first allowed: the first, full stop, because she had gone and done it while the doors at home were still locked. She held an international license before most of the men who had refused her held anything of the kind.

She sailed home, and the newspapers were waiting at the dock. The nails-and-chili-parlor years were over. The young woman no American school would admit stepped off the ship as the most credentialed thing there is:

a pilot, with the papers to prove it, earned in a second language, on another continent, entirely against the grain of the world.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The barnstorming fame, the lectures recruiting her people into aviation, the refusal to perform for segregated gates — documented; her death deliberately excluded.",
      text: `She became a sensation of the air.

Huge crowds came out to watch her barnstorm — loops, figure eights, walking on wings of the fragile machines of that era. Newspapers crowned her with a royal nickname. Children of her people looked up, literally, at proof.

And she used the fame like a tool. She lectured in churches, schools and theaters, recruiting young Black men and women into aviation, dreaming aloud of founding a flight school of her own so nobody would ever have to cross an ocean the way she had.

And she set terms. When show promoters wanted her name over segregated gates, she refused to fly — everyone through the same gate, or no show. She won those standoffs, again and again.

Every barrier they'd built for her, she made a runway. It's what she was best at — after flying.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Bessie Coleman.

The first Black woman — and the first woman of Native American descent — ever licensed to fly, years before American aviation would have allowed it. "Queen Bess," the barnstormer who refused to perform for segregated crowds. The airport road at Chicago O'Hare bears her name today. None of that existed yet in the years when every school in her country was telling her no.

Your life is not theirs. But a piece of this story may still sit beside you.

The system around her wasn't merely discouraging — it was unanimous. Her answer wasn't to argue with it. It was to learn French at night after ten-hour shifts and go around the entire country.

When every door near you is locked, the locks are describing the doors — not you. Somewhere the door exists. She crossed an ocean to prove it.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Hedwig Kiesler, Nov 9, 1914, Vienna; fled a controlling marriage to an arms
//    dealer, reinvented in Hollywood as "the most beautiful woman in the world"; self-taught
//    inventor (a drafting table in her house; inventing was her evening hobby); 1940-41, with
//    composer George Antheil, devised a frequency-hopping "Secret Communication System" to make
//    radio-guided torpedoes unjammable (player-piano-roll synchronization concept); patent filed
//    1941 under Hedy Kiesler Markey, granted Aug 11, 1942 (27); offered it to the U.S. Navy free —
//    rejected/shelved ("put a player piano in a torpedo?" is the remembered register), and she was
//    told her celebrity would serve the war better — she sold war bonds (famously including a
//    kisses-for-bonds drive); the patent expired unused by her; spread-spectrum concepts surfaced
//    in Navy systems from the early 1960s and underlie modern wireless (Wi-Fi, Bluetooth, GPS
//    lineage — stated as ancestry, not sole invention); recognition came late: EFF Pioneer Award
//    1997 ("It's about time," she said), National Inventors Hall of Fame posthumously 2014.
//    d. 2000.
//  Interpretive: "they could not see the mind past the face." Grounded.
//  Avoid saying: don't name Lamarr / Hollywood / the Navy / Antheil before the bridge; do NOT
//    claim she "invented Wi-Fi" (ancestry framing only); the beauty rendered as the thing that
//    blinded people to the mind, never lingered on.
const lamarr: FigureStageRow = {
  figureKey: "lamarr",
  displayName: "Hedy Lamarr",
  birthYear: 1914,
  deathYear: 2000,
  stageId: "1940-1942-the-shelved-invention",
  stageLabel: "The mind behind the face: the invention the Navy shelved",
  ageMin: 25,
  ageMax: 28,
  themes: ["dismissed", "creative_dismissal", "social_constraint"],
  antiThemes: [],
  shapeSentences: [
    "She was one of the most famous faces alive, and when she offered her country a genuinely brilliant invention in wartime, the men in charge could not see the mind past the face.",
    "The invention was shelved and she was told, in effect, to go be pretty for the war effort instead — so the patent she gave away expired unused.",
    "She lived long enough to watch her idea become the backbone of the wireless world, and to hear the honors arrive half a century late.",
  ],
  facets: {
    emotionalCore:
      "Offering the best thing her mind had ever made and having it waved away by people who had already decided what she was — decorative — before she opened her mouth.",
    decisionShape:
      "Whether to keep insisting on the invention against an institution that wouldn't hear it, or to swallow the dismissal, serve the way they permitted, and let the idea wait for the world to catch up.",
    triggerEvent:
      "She and her collaborator offered their frequency-hopping system to the wartime Navy for free, and it was rejected and shelved — with the suggestion that her fame was worth more than her mind.",
    agencyState:
      "She had fame, money, and a working patent — everything except the one thing that mattered to the gatekeepers: their willingness to take a movie star's mind seriously.",
  },
  biographicalFacts:
    "Hedy Lamarr was born Hedwig Eva Maria Kiesler on November 9, 1914, in Vienna. She escaped a stifling marriage to an Austrian arms dealer — dinner-table talk of weapons systems gave her an incidental education in munitions problems — and reinvented herself in Hollywood, where studio publicity crowned her \"the most beautiful woman in the world.\" Inventing was her private life: she kept a drafting table at home and worked on ideas in the evenings, from improved traffic lights to a bouillon-cube soft drink. In 1940-41, with the avant-garde composer George Antheil, she developed a \"Secret Communication System\": a radio guidance signal for torpedoes that hopped rapidly among frequencies in a pattern synchronized between transmitter and receiver — inspired partly by player-piano rolls — making the signal effectively impossible to jam. The patent, filed under her legal name Hedy Kiesler Markey, was granted on August 11, 1942, when she was twenty-seven, and the pair offered it to the U.S. Navy without payment. The Navy dismissed and shelved it — the remembered register of the rejection is \"What do you want to do, put a player piano in a torpedo?\" — and Lamarr was told her celebrity would serve the war better in other ways; she threw herself into war-bond drives, in one famously selling kisses to raise millions. The patent expired before she earned a cent from it. Frequency-hopping and related spread-spectrum techniques surfaced in Navy systems beginning in the early 1960s and became foundational to modern wireless communication — the lineage behind Wi-Fi, Bluetooth, and GPS. Recognition arrived a half-century late: the Electronic Frontier Foundation's Pioneer Award in 1997 (\"It's about time,\" she said) and posthumous induction into the National Inventors Hall of Fame in 2014. She died January 19, 2000.",
  sources: [
    "Rhodes, Richard. Hedy's Folly: The Life and Breakthrough Inventions of Hedy Lamarr (New York: Doubleday, 2011).",
    "U.S. Patent 2,292,387, \"Secret Communication System\" (Markey and Antheil, 1942).",
    "National Inventors Hall of Fame, \"Hedy Lamarr\" inductee materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The double life: world-famous face by day, drafting table by night; the arms-dealer first marriage as incidental munitions education — documented.",
      text: `There was a woman with two lives.

In the public one, she was among the most famous faces on earth — a film star whose studio billed her, straight-faced, as the most beautiful woman in the world. Strangers assumed the face was the whole story. Strangers always did.

In the private one, she kept a drafting table in her house, and after the day's filming she sat at it and invented things. It was how her mind rested: problems, mechanisms, improvements. She'd been that way since girlhood.

She had also, in an earlier chapter, been married to a powerful arms dealer back in the old country — a suffocating marriage she'd fled. But she had sat through years of his dinner tables, listening to military men discuss weapons and their weaknesses.

Then the world went to war — against that old country, the one she'd escaped.

And the two lives converged on one idea.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The invention with the composer collaborator, the free offer to the wartime Navy, the dismissal/shelving and the be-pretty-instead redirect — documented; register per Rhodes.",
      text: `The idea was about torpedoes.

Radio-guided torpedoes could be jammed — the enemy just found the frequency and drowned it. But what if the guidance signal never sat still? What if it hopped, dozens of times a second, across frequencies, in a pattern only the sender and receiver shared? You can't jam a signal you can't find.

With a composer friend who understood synchronization — player pianos, of all things, kept two rolls in perfect step — she worked it into a real design. They patented it, and they offered it to the wartime government of her adopted country. Free. A gift.

The men in charge looked at the invention, and then they looked at the inventor.

A movie star. The face from the posters, explaining frequencies to admirals. The verdict had the tone of a joke told at her expense — what next, a player piano inside a torpedo? — and the substance of a filing cabinet closing.

Shelved. And she was given to understand, plainly, where a woman like her could actually help the war: her fame. Her face. Sell bonds.

The best thing her mind had ever built, waved away without a real reading.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The war-bond drives (incl. the kisses drive) done full-throttle — documented. The 'did the permitted job excellently' framing is interpretive.",
      text: `She did the job they permitted her — and she did it at full throttle.

If the face was the only tool they'd accept, she'd use the face like a crowbar. She crisscrossed the country selling war bonds, working crowds, at one stop famously selling kisses at a fortune apiece — raising millions for the same war effort that had just filed her mind under decorative.

There was steel in that, and irony too, and she knew both.

The patent sat in its drawer. She didn't beg the admirals to reconsider. Some walls you don't argue with — you outlive them.

At her drafting table, on the quiet nights, she kept inventing. That part of her had never needed anyone's permission.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The patent expiring unused and uncompensated; the long decades of the mind going unseen — documented; compressed.",
      text: `The war ended. The drawer stayed shut.

Her patent quietly expired — seventeen years, not one cent, not one deployment she ever heard about. The films went on, and then, as the studio system aged her out, they thinned. The world had exactly one file for her, and the label never changed: the face.

That was the long grind of it — not one dramatic rejection but decades of a mind going unseen. Interviewers asked about her looks, husbands, gowns. Nobody asked what she thought about. Nobody asked what she'd built.

She knew what she had made. That knowledge doesn't pay royalties and it doesn't get quoted in the papers, but it also doesn't go away.

And far from her, out of sight, in the laboratories of the same institution that had shelved her — her idea had begun, very quietly, to wake up.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The idea's surfacing in systems from the early 1960s and its spread through wireless technology — documented; rendered as the world catching up.",
      text: `The world caught up to her about twenty years late.

Military systems began using signals that hopped frequencies — the very trick she and the composer had patented and given away. Engineers rediscovered and extended the approach, and it turned out to be foundational: the key to sharing crowded airwaves without chaos.

Decade by decade, the idea spread out of weapons and into everything. By the end of her life, some version of spread-out, hop-around signaling sat inside the wireless technologies knitting the entire planet together.

Her fingerprint, in a billion pockets.

And at last, someone checked the paperwork. Historians and engineers found the 1942 patent and blinked at the names on it: an avant-garde composer — and the most beautiful woman in the world.

The story got out. The story was too good not to get out.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The 1997 EFF Pioneer Award and her documented 'It's about time'; the posthumous Hall of Fame induction — documented, names withheld.",
      text: `The honors arrived when she was in her eighties.

A foundation devoted to the electronic frontier gave her its pioneer award — the recognition of the technical world, the one that had never taken her calls. Her recorded response was three words long: It's about time.

After her death, her country's hall of fame for inventors inducted her. Documentaries were made. Engineering textbooks added her name. Schoolchildren now learn her as an inventor first — the thing nobody would let her be while it could have mattered to her.

The face that had blinded everyone became a footnote to the mind.

It took fifty years, which is a long time to be right without credit. She had spent those years the only way that works: knowing what she'd built, whether or not anyone asked.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Hedy Lamarr.

Hollywood's "most beautiful woman in the world" — and the co-inventor, with composer George Antheil, of the frequency-hopping system whose descendants underpin Wi-Fi, Bluetooth, and GPS. The Navy shelved it and told her to sell war bonds instead; the Inventors Hall of Fame inducted her seventy years later. None of the recognition existed while she sat with her drafting table, filed under decorative.

Your life is not theirs. But a piece of this story may still sit beside you.

The people with the power to say yes had decided what she was before she said a word, and no brilliance on the page could get past it. She couldn't force them to see her. She kept building anyway, and let the decades argue her case.

Being seen wrongly doesn't make you what they see. The work knows what it is. So do you.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 7, 1891, Notasulga AL, raised in all-Black Eatonville FL (her father a
//    mayor there); mother died 1904 (Zora 13) — deathbed charge to "jump at de sun"; father
//    remarried quickly, bitter conflict with stepmother, shuffled among relatives; a decade of
//    domestic work and drifting ("lost decade" 1904-1917), incl. a wardrobe-maid stint with a
//    traveling theater troupe; 1917 (26), Baltimore: Maryland offered free public schooling to
//    Black youth aged 6-20, so she declared herself born in 1901 — sixteen — and enrolled at
//    Morgan Academy; graduated 1918; Howard University (co-founded the student paper, first story
//    published in Stylus 1921, age 30); Barnard 1925 (34, its sole Black student, anthropology
//    under Boas); Their Eyes Were Watching God 1937. She kept the ten-year deduction her whole
//    life. d. 1960 (the late poverty/obscure burial and Alice Walker's 1973 grave-marking are
//    bridge material, used gently).
//  Interpretive: "she refused the arithmetic that said too late." Grounded.
//  Avoid saying: don't name Hurston / Eatonville / Baltimore / Howard / Barnard / book titles
//    before the bridge; the age-shaving rendered as audacity, not fraud-shame; the bleak ending
//    handled in one honest, gentle bridge line (rediscovery is the point).
const hurston: FigureStageRow = {
  figureKey: "hurston",
  displayName: "Zora Neale Hurston",
  birthYear: 1891,
  deathYear: 1960,
  stageId: "1917-1921-sixteen-again",
  stageLabel: "Sixteen again: the decade lost, the age refused, the start reclaimed",
  ageMin: 26,
  ageMax: 30,
  themes: ["self_invention", "late_start", "dispossession"],
  antiThemes: [],
  shapeSentences: [
    "Her mother died when she was thirteen and her education died with her — a decade of maids' work and drifting later, she was twenty-six with no diploma and every door closed to grown women without one.",
    "So she told the school system she was sixteen, shaved ten years off her life with a straight face, and sat down in a high-school classroom to reclaim her start.",
    "The woman who refused to be too late became one of the great American writers — on a timeline she invented for herself.",
  ],
  facets: {
    emotionalCore:
      "The vertigo of being a decade behind — watching the life you were meant for recede while you scrub other people's floors — and the audacity it takes to simply refuse the arithmetic.",
    decisionShape:
      "Whether to accept that a twenty-six-year-old maid had missed her window for an education, or to lie about one number and take the window anyway.",
    triggerEvent:
      "She learned that free public schooling was open to anyone under twenty — and she was twenty-six.",
    agencyState:
      "No money, no diploma, no family to lean on — but a first-rate mind, a dead mother's charge to jump at the sun, and a birth year nobody could actually check.",
  },
  biographicalFacts:
    "Zora Neale Hurston was born January 7, 1891, in Notasulga, Alabama, and raised in Eatonville, Florida, the first incorporated all-Black town in America, where her father served as mayor; she remembered her childhood there as a kingdom. Her mother, who told her children to \"jump at de sun,\" died in 1904, when Zora was thirteen; her father remarried within months, and Zora's relationship with her stepmother collapsed into open conflict. She was passed among relatives, in and out of school, and spent more than a decade — roughly 1904 to 1917 — in domestic service and drifting jobs, including a stint as wardrobe maid to a traveling Gilbert and Sullivan theater troupe. In 1917, at twenty-six, she was in Baltimore, where Maryland law provided free public schooling to Black youth aged six to twenty. She declared her birth year to be 1901 — making herself sixteen — and enrolled at Morgan Academy, the high-school division of Morgan College, graduating in 1918. She went on to Howard University, where she co-founded the student newspaper and published her first story in its literary magazine, The Stylus, in 1921, at thirty; in 1925 she entered Barnard College as its sole Black student, studying anthropology under Franz Boas. She kept the ten-year deduction for the rest of her life. She became a central figure of the Harlem Renaissance and, with Their Eyes Were Watching God (1937), the author of one of the most beloved American novels. She died poor and out of print in 1960 and was buried in an unmarked grave; in 1973 the writer Alice Walker found and marked the grave, igniting the revival that restored her to the American canon.",
  sources: [
    "Boyd, Valerie. Wrapped in Rainbows: The Life of Zora Neale Hurston (New York: Scribner, 2003), Chapters 3-6.",
    "Hurston, Zora Neale. Dust Tracks on a Road (Philadelphia: J. B. Lippincott, 1942).",
    "Hemenway, Robert E. Zora Neale Hurston: A Literary Biography (Urbana: University of Illinois Press, 1977).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The Eatonville childhood-kingdom, the mother's death at 13 and 'jump at de sun,' the stepmother conflict and the shuffling — documented.",
      text: `There was a girl who grew up in a town her own people ran — the mayor, the storekeepers, everyone. Her father was the mayor. She grew up loud, brilliant, and sure the world was hers, because in that town, it was.

Her mother believed in her past all reason. Jump at the sun, she told her children. You might not land on it, but you'll get off the ground.

When the girl was thirteen, her mother died.

Her father remarried within months. The new wife and the fierce daughter went together like a match and kerosene, and the girl lost the fight: she was shipped off, passed from relative to relative, in and out of school and then just out.

The kingdom was over. At an age when her classmates were finishing school, she was scrubbing other people's floors.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The lost decade of domestic work and drifting (incl. the theater-troupe wardrobe job) — documented. The arithmetic-of-lateness framing is interpretive.",
      text: `The floors lasted a decade.

Maid work, cook work, waiting work — whatever a young Black woman with no diploma could get in the early years of that century, which was drudgery and nothing else. For a while she traveled as a wardrobe maid with a theater troupe, mending costumes for performers who got to be somebody every night while she pressed their clothes.

The worst part wasn't the work. It was the arithmetic.

Twenty-two. Twenty-four. Twenty-six. Every year the number climbed, and every year the life she was meant for — books, school, the world of the mind she'd been born hungry for — receded a little further behind her. Education was for the young, and she was aging out of young with nothing to show.

A woman of twenty-six with no schooling did not start over. Everyone knew that.

The sun her mother told her to jump at was setting on schedule, every single day.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 1917 Baltimore move; the free-schooling age rule; the ten-year deduction and enrollment — documented. Rendered as audacity.",
      text: `Then she learned a fact, in the city where she'd washed up: the state offered free public schooling to any young person under twenty.

She was twenty-six. Unless...

Who, exactly, was going to check? She'd been born in a little Southern town where records were thin. No birth certificate was going to rise up and contradict a confident woman.

So she did the audacious thing, the thing that makes her who she is. She walked in and gave her birth year — minus ten. Sixteen, she said. A straight face and a new arithmetic.

And she sat down in a high-school classroom, a grown woman among teenagers, hungry enough to not care one bit how it looked.

She never gave the ten years back. For the rest of her life, she was a decade younger than the calendar claimed — because the calendar had stolen the decade first, and she was simply taking it back.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Morgan Academy while working, then Howard while working (manicurist etc.) — documented; compressed.",
      text: `Starting over at the bottom of a schoolhouse is humbling, and paying for a life while you do it is grinding.

She worked while she studied — cleaning, waiting tables, doing nails — and studied like someone eating after a famine. The classroom that was supposed to be past her turned out to fit her exactly: she was quicker than the teenagers, quicker than most of the teachers, and everyone in the building knew it fast.

One year to finish high school. Then on to the great university for her people, in the capital, still broke, still working — and now writing.

Because that was surfacing at last: the thing under the hunger all along. Stories. Her town, her people, the talk on the porches of her childhood kingdom — she began setting it down, and the campus literary world sat up.

Her first published story appeared in the university's magazine. She was thirty, by the calendar. By her own accounting, just getting started.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Howard-to-Barnard leap (sole Black student, Boas) and the arrival in the literary capital — documented; kept anonymous.",
      text: `The stories carried her north, to the center of everything.

A national magazine contest brought her to the big city's literary scene, and she arrived the way she arrived everywhere — like a parade of one. Within a year, the most famous women's college in the country admitted her, its sole Black student, and one of the founders of modern anthropology took her on personally.

Think about the distance. A decade scrubbing floors, sixteen-again at twenty-six — and now she sat in seminar rooms at the top of American letters and science, studying the very thing she'd lived: the culture, the talk, the genius of Black Southern towns like the one that raised her.

Everyone else in those rooms had taken the standard route. She had invented hers, including the timeline.

And her real work — the books — was just ahead.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The Harlem Renaissance stature, the folklore expeditions, the 1937 masterpiece — documented, titles withheld.",
      text: `She became a one-woman literary movement.

She drove the back roads of the South collecting the folklore nobody else thought was worth writing down — the tales, the songs, the sermons — and turned it into books that preserved a world. She wrote novels in the actual voice of her people, porch-talk raised to literature, when the fashion said dress it up or leave it out.

Her masterpiece — a novel about a Black woman claiming her own life, written in the language of home — appeared in her forties. It was misunderstood by half its first critics.

It is now one of the most beloved and taught American novels, full stop.

The woman who was too late for high school wrote a permanent classic — on the timeline she made up, out of the decade she took back.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Zora Neale Hurston.

She wrote Their Eyes Were Watching God, became the queen of the Harlem Renaissance, and preserved Black Southern folklore that would otherwise be gone. She fell into obscurity at the end — and then Alice Walker went looking for her unmarked grave in 1973, marked it "Genius of the South," and led the revival that put her permanently in the American canon. All of it began the day a twenty-six-year-old maid told a school clerk she was sixteen.

Your life is not theirs. But a piece of this story may still sit beside you.

The calendar said she'd missed it — a decade gone, every door aged shut. She treated the calendar as negotiable and the hunger as the real fact. It's the boldest move in this whole library: she just refused the arithmetic.

Behind is a number, not a verdict. She crossed out hers and wrote a better one.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 21, 1838, Dunbar, Scotland; harsh religious father; Wisconsin farm from
//    11; self-taught inventor (early-rising machine etc., exhibited 1860); by 1866 a rising
//    industrial machinist/efficiency man at an Indianapolis carriage-parts works, on a management
//    track; early March 1867 (28) a tool slipped and pierced his right eye at the workbench; the
//    left eye failed in sympathy; ~6 weeks in a darkened room, uncertain he would ever see;
//    friends read to him (incl. of Yosemite); sight returned; he resolved to "store my mind with
//    the Lord's beauty" and quit industry; Sept 1867 (29) began the ~1,000-mile walk from the Ohio
//    River to the Gulf of Mexico with a plant press and little money; malaria at the Gulf turned
//    him from South America to California; reached Yosemite 1868 (29-30). Later: the wilderness
//    essays, the Sierra Club (1892), the national-parks campaigns with Roosevelt. d. 1914.
//  Interpretive: "the darkness clarified what the daylight had been postponing." Grounded in his
//    own account ("God has to nearly kill us sometimes, to teach us lessons").
//  Avoid saying: don't name Muir / Yosemite / Indianapolis / the Sierra Club before the bridge;
//    don't claim the exact tool (sources vary awl/file — "a tool slipped"); the religion kept
//    light (one line of his own register at most).
const muir: FigureStageRow = {
  figureKey: "muir",
  displayName: "John Muir",
  birthYear: 1838,
  deathYear: 1914,
  stageId: "1867-1868-the-darkened-room",
  stageLabel: "The darkened room: the eye, the six weeks, and the thousand-mile walk",
  ageMin: 28,
  ageMax: 30,
  themes: ["illness", "solitude", "self_invention"],
  // Eval-surfaced confusion (2026-07-02 challenger run): a years-of-unrewarded-work user
  // ("poured years into my work with nothing to show") was matched to Muir. His episode has no
  // futile-labor core — he was SUCCEEDING on a path he discovered he didn't want — so
  // worthlessness/creative_dismissal signals vote against him in the theme lane (penalty only,
  // never exclusion).
  antiThemes: ["worthlessness", "creative_dismissal"],
  shapeSentences: [
    "A tool slipped at his workbench and pierced his eye, and within hours he was blind in both — a man built on his hands and his sight, sitting in a darkened room not knowing if either would come back.",
    "For six weeks in the dark he took inventory of his one life, and found that the successful path he'd been walking was not the one he wanted back.",
    "When his sight returned he quit the factory, shouldered a plant press, and walked a thousand miles toward the wild — into the life he actually meant.",
  ],
  facets: {
    emotionalCore:
      "Lying in the dark bargaining with fate — realizing that what he grieved losing wasn't the career everyone praised, but the wild world he'd kept postponing.",
    decisionShape:
      "Whether to return, sight restored, to the promising industrial path — or to treat the accident as the last warning and spend his eyes on what he actually loved.",
    triggerEvent:
      "A slipped tool pierced his right eye at the workbench, and his left eye went dark in sympathy — six weeks in a blackened room, with no promise of recovery.",
    agencyState:
      "Blind and helpless for six weeks, everything out of his control except the one decision that mattered: what he would do with his eyes if he ever got them back.",
  },
  biographicalFacts:
    "John Muir was born April 21, 1838, in Dunbar, Scotland, and raised from age eleven on a Wisconsin frontier farm under a harshly religious father. A gifted self-taught mechanic — his whittled inventions, including an \"early-rising machine\" that tipped the sleeper out of bed, won notice at the 1860 state fair — he seemed destined for industry, and by 1866 he was a rising machinist and efficiency expert at a carriage-parts factory in Indianapolis, on track for a partnership. In early March 1867, at twenty-eight, a tool he was using slipped and pierced his right eye at the workbench; the aqueous humor drained, and within hours his left eye went blind in sympathetic reaction. He spent roughly six weeks in a darkened room, uncertain he would ever see again, while friends read to him — including accounts of the Yosemite Valley. As his sight gradually returned, he resolved, in his own later words, to be true to himself and \"store my mind with the Lord's beauty\": he quit industry for good. In September 1867, at twenty-nine, he set out on a roughly thousand-mile walk from the Ohio River at Louisville to the Gulf of Mexico, carrying little more than a plant press, a change of underclothes, a New Testament, and a volume of Burns, keeping a journal addressed \"John Muir, Earth-planet, Universe.\" A bout of malaria on the Gulf coast turned his plans from South America to California, and he reached the Yosemite Valley in 1868. He became America's most influential voice for wilderness — the essays, the co-founding of the Sierra Club in 1892, the campaigns and the famous camping trip with Theodore Roosevelt that shaped the national-park system. He died December 24, 1914.",
  sources: [
    "Muir, John. A Thousand-Mile Walk to the Gulf (Boston: Houghton Mifflin, 1916).",
    "Worster, Donald. A Passion for Nature: The Life of John Muir (New York: Oxford University Press, 2008), Chapters 4-5.",
    "Sierra Club, \"John Muir: A Brief Biography.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The mechanical gift, the factory rise and management track, the postponed pull toward the wild — documented.",
      text: `There was a young man who was good with machines — so good it was becoming his whole life.

He'd grown up hard on a frontier farm, worked from dark to dark by an iron-strict father, and taught himself everything: geometry from borrowed books, invention from pure knack. The machines he whittled out of wood as a farm boy had made local newspapers.

Now, at twenty-eight, he was rising fast at a big factory in a big city — the efficiency man, the one who could make any process leaner. The owners talked about a partnership. A comfortable, successful, indoor life was assembling itself around him.

There was just one other thing in him: a pull toward the wild world. Plants, mountains, wilderness. He kept a plan in a drawer — someday, a great walking journey through wild country.

Someday. The factory came first. There was always time for the wild later.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The March 1867 injury (tool unspecified per sources' variance), the sympathetic blindness of the second eye, the six weeks in the dark with no promised recovery — documented.",
      text: `One evening in early spring, working late at the bench, a tool slipped in his hand and flew up into his right eye.

He felt the sight pour out of it — he described it that way, like something spilling. He stood at the window as the seeing faded and said aloud, to no one: my right eye is gone.

Worse came within hours. The left eye, in shock at its twin's wound, went dark too. Both. He was blind.

The doctors ordered him into a darkened room and could promise nothing. Maybe sight would return — partly, wholly, or never. There was nothing to do but lie in the black and wait.

He was twenty-eight, a man built entirely on his hands and his eyes, and he lay week after week in the dark doing the only arithmetic available:

if the light never comes back, what did I do with it while I had it?

The answer sickened him worse than the wound. He had spent it on gears — and kept the wild world, the one thing he loved most, folded in a drawer marked someday.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The friends reading to him (incl. of the famous valley), and the documented in-the-dark resolution to quit industry for the wild if sight returned.",
      text: `Friends came and read to him in the dark. Travel accounts, nature, the news. One of the things they read described a valley out west — a place of granite walls and waterfalls that people wrote about like scripture.

He lay there, eyes bandaged, walking that valley in his mind.

And somewhere in those weeks, the decision quietly finished itself. If the light came back — if — he was done spending it on machinery. No more someday. He would go to the wild world directly, immediately, and store his mind so full of its beauty that no darkness could ever empty it again.

He said later that fate sometimes has to nearly kill us to teach us. He'd heard the lesson. Now he waited, in the black, to find out if he'd get the chance to obey it.

Light began to leak back — first the right eye's blur, then the left steadying. Week by week, the world returned.

He did not return to the workbench.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The Sept 1867 start and the ~1,000-mile walk's hardships (little money, swamps, sleeping rough, the graveyard nights) — documented.",
      text: `That September he strapped on a small pack — a plant press, a change of clothes, two books — and started walking south. His plan was one sentence: the wildest, leafiest route he could find, a thousand miles, to the sea.

It was no stroll. He had almost no money. He slept in the open, in barns, once for several nights in a graveyard because it was the safest spot in a ragged region. He forded swamps, dodged fevers, went hungry, and was eyed by strangers in a countryside still raw from war.

And he was happy — happiness of a kind the factory had never once paid him.

Every day he botanized like a man let out of prison, filling the press, filling the journal. On its flyleaf he'd written his address, and the address was the statement of the whole new life: his name — then Earth-planet, Universe.

A thousand miles, on foot, on faith that the accident had told the truth.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The malaria at the Gulf redirecting him from South America to California; the 1868 arrival in the great valley — documented.",
      text: `At the sea, a hard fever caught him — the swamp country's parting gift — and it bent the plan in the best possible direction.

South America, the original dream, was too much for a body wrung out by malaria. But there was another wild place, the one from the darkened room — the valley of granite and waterfalls, out on the far coast. He shipped west while he recovered.

He stepped off the boat and asked the way out of town — the quickest way to anywhere wild. That summer he walked into the great valley itself.

And the man who had nearly lost the light stood under walls of stone half a mile high, in meadows on fire with flowers, and understood that every step since the darkened room had been correct.

He wrote that he had never before seen creation so clearly. His eyes — the ones he almost lost — had been saved for exactly this.

He stayed. Not just in the valley. In the life.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The essays, the club (1892), the presidential camping trip and the parks legacy — documented, names withheld.",
      text: `The wild became his work, and his work changed the map of his country.

He lived in the valley and learned it like a scholar — then began to write about wilderness in a voice nobody had heard before: scientific, ecstatic, funny, unanswerable. His essays taught a nation of factory-builders that wild places were not raw material but treasure — and that they were vanishing.

He founded a club to defend the mountains, and led it for the rest of his life. He took a president camping under the big trees for three nights, and out of those campfires came protections that reshaped the continent: parks, forests, monuments — wild land saved by the millions of acres, for everyone, forever.

Nearly all of it traces back through one man's changed life — and the changed life traces back to six weeks in a darkened room, where he finally heard what his own heart had been saying all along.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was John Muir.

Father of the national parks, founder of the Sierra Club, the writer whose books made wilderness a thing America protects. Yosemite was the valley his friends read to him about while he lay blind. None of it existed yet — not one essay, not one acre saved — when he was lying in that darkened room at twenty-eight, bargaining for his sight.

Your life is not theirs. But a piece of this story may still sit beside you.

It took losing the light completely for him to see what he'd been doing with it — spending it on a life that was impressive and wasn't his. The darkness didn't give him anything new. It just made him stop postponing what was already true.

If something has knocked your life dark for a while, it may also be showing you what you actually miss. He listened, and it remade everything.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Nov 14, 1891, Alliston Ontario farm; WWI surgeon (Military Cross); July 1920
//    (28) opened a practice in London, Ontario — 28 days before the first patient; first month's
//    earnings ~$4; taught part-time at Western to survive; the night of Oct 30-31, 1920, preparing
//    a pancreas lecture, woke ~2am and wrote the famous idea note ("Diabetus: Ligate pancreatic
//    ducts of dog..." — misspelled); took it to Prof. J. J. R. Macleod in Toronto, who was openly
//    skeptical of the unknown surgeon but eventually granted lab space, ten dogs, and a student
//    assistant (Charles Best) for summer 1921; the experiments worked; Jan 1922 insulin saved the
//    first patient (Leonard Thompson, 14); 1923 Nobel Prize (Banting, 31, then the youngest
//    Medicine laureate) — he split his prize money with Best. d. 1941.
//  Interpretive: "the empty waiting room gave him the idea time" framing. Grounded.
//  Avoid saying: don't name Banting / insulin / diabetes / Toronto before the bridge (the "sugar
//    sickness that killed every child who got it" phrasing keeps it soft); keep the misspelled-note
//    detail (unnamed disease); no dollar figures in beats ("almost nothing").
const banting: FigureStageRow = {
  figureKey: "banting",
  displayName: "Frederick Banting",
  birthYear: 1891,
  deathYear: 1941,
  stageId: "1920-1922-empty-waiting-room",
  stageLabel: "One patient a month: the failed practice and the 2am note",
  ageMin: 28,
  ageMax: 30,
  themes: ["worthlessness", "dismissed", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He came home from the war a decorated surgeon and opened a practice, and nobody came — twenty-eight days before his first patient, a month's earnings that wouldn't buy groceries.",
    "In the middle of one sleepless night the failed doctor wrote down an idea, and the famous professor he took it to made it clear an unknown from nowhere had no business proposing it.",
    "He pushed anyway, got one borrowed summer in someone else's lab, and pulled off one of the great rescues in the history of medicine.",
  ],
  facets: {
    emotionalCore:
      "The daily shame of an empty waiting room — a trained, decorated man sitting in his own failure with the whole town able to see the door nobody entered.",
    decisionShape:
      "Whether to fold the failed practice into a quiet, safer life, or to bet everything on one midnight idea that the experts found presumptuous.",
    triggerEvent:
      "Preparing a lecture on a subject he barely knew, he woke at two in the morning with an idea and wrote it down before it could escape.",
    agencyState:
      "Broke, unknown, and professionally invisible — but the idea was written down, the science was testable, and persistence cost nothing but pride.",
  },
  biographicalFacts:
    "Frederick Banting was born November 14, 1891, on a farm near Alliston, Ontario. He served as a battalion medical officer in the First World War and was awarded the Military Cross for tending wounded men while wounded himself. In July 1920, at twenty-eight, he opened a surgical practice in London, Ontario; twenty-eight days passed before his first patient arrived, and his first month's earnings amounted to about four dollars. He took part-time work demonstrating at the University of Western Ontario to survive. On the night of October 30-31, 1920, preparing a lecture on the pancreas — reading recent journal articles on the subject — he woke around two in the morning and wrote a twenty-five-word idea note, famously misspelling the disease: ligate the pancreatic ducts of dogs so the digestive tissue degenerates, then isolate the internal secretion that controls sugar. Diabetes was then a death sentence; diagnosed children survived on starvation diets, rarely for long. Banting took the idea to J. J. R. Macleod, professor of physiology at the University of Toronto and an authority on carbohydrate metabolism. Macleod was openly skeptical — Banting was an unknown surgeon with no research training who had read little of the literature — but after repeated approaches granted him laboratory space for the summer of 1921, ten dogs, and a student assistant, Charles Best. The experiments succeeded; with the biochemist James Collip the extract was purified, and in January 1922 it revived fourteen-year-old Leonard Thompson, the first patient — the sugar-wasted children in the diabetic wards began, within weeks, to wake and live. Banting and Macleod received the 1923 Nobel Prize in Medicine — Banting, at thirty-one, the youngest laureate in the prize's history to that point; furious that Best was passed over, he gave Best half his prize money. The patent for insulin was sold to the University of Toronto for one dollar. Banting died in a plane crash on war service, February 21, 1941.",
  sources: [
    "Bliss, Michael. The Discovery of Insulin (Toronto: McClelland & Stewart, 1982), Chapters 2-5.",
    "Bliss, Michael. Banting: A Biography (Toronto: McClelland & Stewart, 1984).",
    "University of Toronto Libraries, \"The Discovery and Early Development of Insulin\" digital collection.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The war-hero credentials, the new practice, the 28 patient-less days and near-zero first month — documented.",
      text: `There was a young doctor sitting in an office nobody visited.

He had done everything right. Farm boy, medical school, then the war — where he'd been decorated for staying with wounded men under fire while wounded himself. He came home a trained surgeon with a medal, borrowed money, and hung his name on a door in a new city.

And nobody came.

Day after day he sat in the little consulting room among his instruments, listening for the bell. Twenty-eight days passed before his first patient. His first month's earnings wouldn't have covered a decent pair of boots.

The neighbors could see the door nobody entered. He picked up part-time work at the local university, demonstrating for medical classes, to eat.

A decorated surgeon, nearly thirty, being paid almost nothing to fill an hour of other men's lectures. That was the whole life, and it was getting worse by the month.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The failing practice's grind; the lecture-prep reading on a subject he barely knew; the child-killing disease context — documented.",
      text: `The autumn was the low point. The practice was a confirmed failure — not slow, failed. He was behind on the loan for his own furniture. The engagement he'd come home to was strained toward breaking.

And the part-time lecturing rubbed salt in it: he was assigned topics he barely knew, cramming journals the night before like a student, to teach students.

One of those assigned topics was the pancreas — and the terrible disease tied to it. The sugar sickness. Every child who got it died; the best medicine could offer was slow starvation instead of fast death. Wards full of wasting children, and doctors could only watch.

He sat up late with the journal articles, a failed doctor reading about an unsolvable disease for a lecture nobody would remember.

He went to bed defeated. And at two in the morning, his mind — still working the problem in the dark — woke him.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The documented 2am note (25 words, the disease misspelled) and the decision to pursue it.",
      text: `He got up and wrote twenty-five words in his notebook.

An idea. A way — maybe — to isolate the one thing in the pancreas that everyone had failed to isolate; the substance that, if you could get it pure, might stop the sugar sickness cold. He even misspelled the disease as he scribbled it. He wasn't an expert. That was the whole point of the objection everyone would make.

But lying there in the dark, he knew two things. The idea was testable. And he had — this was the strange gift of failure — absolutely nothing else. No thriving practice to protect. No reputation to risk. An empty waiting room and a written-down idea.

He decided before morning: he would take it to the one man in the country with the laboratory and the authority to test it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Macleod's documented skepticism of the untrained unknown; the repeated approaches; the grudging grant of one summer, ten dogs, one student — documented.",
      text: `The great professor was not impressed.

Here was an unknown small-town surgeon — no research training, thin knowledge of the literature — proposing to solve, in a summer, a problem that had defeated the best physiologists in the world for thirty years. The professor knew every failed attempt. He explained, with the patience of a man swatting a fly, why this would likely be another.

The young doctor came back. And came back again. He had no standing, no polish, and no alternative — and somewhere under the farm-boy manner, a stubbornness the professor finally found easier to accommodate than to keep refusing.

Fine. One summer, while the professor traveled. Borrowed lab space. Ten dogs. One student assistant, chosen by coin toss between two volunteers.

It was scraps from the table. He sold his instruments and some furniture to live on, and took the scraps.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The summer 1921 experiments and the first successful extract; the January 1922 first patient and the awakening wards — documented.",
      text: `The summer was brutal — heat, failed surgeries, dogs lost, techniques invented on the fly by two young men learning research by doing it.

And then, late in the summer, it worked. A dog dying of the sugar sickness, injected with their extract, got up. Blood sugar falling on the charts. Again. Repeatable.

The failed doctor stood in the borrowed lab looking at the numbers every expert said he'd never see.

Months of refinement followed — a real chemist joined to purify the extract — and that winter came the moment medicine still tells stories about. A hospital ward, a fourteen-year-old boy down to skin and bone, days from the end. The injection.

The boy woke up. Strength came back. Then the ward's other children. Within weeks, children who had been dying by inches were sitting up asking for food.

It was, people said then and say still, like watching resurrection.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The Nobel at 31 (youngest in Medicine then), splitting his money with his assistant, the one-dollar patent — documented, names withheld.",
      text: `Within two years of the empty waiting room, he had the highest honor in world science — the youngest man ever to receive it in medicine, at that point.

He stayed exactly who he was. Furious that his young assistant had been left off the prize, he publicly split his own prize money with him, half and half. And the discovery itself — worth any fortune anyone cared to name — was sold to the university for one dollar, so that no company could ever own it and no sick child be priced out of it.

The treatment went out into the world and never stopped. Millions of people — tens of millions, over the century — have lived whole lives because of one bad autumn, one failed practice, and one idea written down at two in the morning by a man the experts saw no reason to take seriously.

His waiting room, it turned out, had never been empty. It had the whole future in it.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Frederick Banting.

He discovered insulin — with Charles Best, in one borrowed summer — and turned diabetes from a childhood death sentence into a livable condition. The Nobel came at thirty-one; the patent was sold for a dollar so the medicine would belong to everyone. None of that existed yet during the twenty-eight days he sat by the door, waiting for a single patient.

Your life is not theirs. But a piece of this story may still sit beside you.

By every visible measure he was failing — the empty room, the debts, the experts' shrugs. But the failure had left him with open hours and nothing to protect, and into that emptiness came the idea of his life. He just had to be stubborn enough to stay in the room with it.

A season of failure can be the clearing where the real thing finally lands. Keep the notebook handy.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 21, 1816, Haworth parsonage; at 20 sent poems to poet laureate Robert
//    Southey, whose March 1837 reply included "Literature cannot be the business of a woman's
//    life: & it ought not to be" (backstory to this stage); years of governess/teaching work she
//    hated; 1846 (30): the sisters' pseudonymous Poems by Currer, Ellis and Acton Bell sold TWO
//    copies; her first novel The Professor was rejected by publisher after publisher through
//    1846-47; she wrote Jane Eyre partly in Manchester lodgings while nursing her father through
//    cataract surgery (Aug 1846); in Aug 1847 Smith, Elder — rejecting The Professor yet again —
//    added an encouraging note asking for a longer work; she sent Jane Eyre; published Oct 16,
//    1847 (31), eight weeks later; immediate sensation. (Branwell's decline was in the house
//    throughout — one soft line max; the Heger episode excluded.) d. 1855.
//  Interpretive: "she kept writing into a unanimous no." Grounded.
//  Avoid saying: don't name Brontë / Jane Eyre / Currer Bell / Haworth / Southey before the
//    bridge; the two-copies detail stays (unnamed book); no sister-author reveal before bridge
//    (say "her sisters wrote too" only if needed — beats keep sisters as "her sisters").
const bronte_c: FigureStageRow = {
  figureKey: "bronte_c",
  displayName: "Charlotte Brontë",
  birthYear: 1816,
  deathYear: 1855,
  stageId: "1846-1847-two-copies",
  stageLabel: "Two copies sold: the flopped poems and the novel every publisher refused",
  ageMin: 28,
  ageMax: 31,
  themes: ["creative_dismissal", "social_constraint", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "The poet laureate had told her at twenty that literature could never be a woman's business, and at thirty the evidence agreed: the book of poems she and her sisters scraped to publish sold exactly two copies.",
    "Her first novel was refused by publisher after publisher for a year while she nursed her father and kept house in a parsonage full of trouble.",
    "She was thirty-one, thrice-rejected and invisible, when one rejection arrived with a sentence of encouragement — and she answered it with the novel that made her immortal.",
  ],
  facets: {
    emotionalCore:
      "The compounding weight of a unanimous no — the great man's verdict, the two sold copies, the returned manuscript — pressing on a woman who privately believed she could write better than what got published.",
    decisionShape:
      "Whether to accept the world's repeated verdict on her writing and settle into governessing, or to finish the next book with the last one still homeless.",
    triggerEvent:
      "The poems she and her sisters paid to publish sold two copies, and her first novel began collecting rejections from every publisher in the capital.",
    agencyState:
      "Poor, plain by her own fierce account, buried in a moorland parsonage nursing a blind father — but the pen moved every day, and postage for one more submission could always be found.",
  },
  biographicalFacts:
    "Charlotte Brontë was born April 21, 1816, and raised in the parsonage at Haworth on the Yorkshire moors, the eldest surviving daughter of the curate Patrick Brontë. At twenty she sent samples of her poetry to Robert Southey, the poet laureate, whose reply of March 1837 contained the era's verdict in one sentence: \"Literature cannot be the business of a woman's life: & it ought not to be.\" She spent her twenties in work she hated — teaching and governessing in other people's houses. In 1846, at thirty, she and her sisters Emily and Anne paid from their small legacies to publish Poems by Currer, Ellis and Acton Bell, under androgynous pseudonyms to dodge the prejudice against women writers. The book sold two copies. Undeterred, each sister wrote a novel; Charlotte's, The Professor, was rejected by publisher after publisher through 1846 and 1847, the parcel re-wrapped and re-sent so many times the brown paper carried the crossed-out addresses of previous refusals. She began Jane Eyre in August 1846 in Manchester lodgings, writing while nursing her father through cataract surgery; at home, her brother Branwell was disintegrating into alcohol and opium. In August 1847 the firm of Smith, Elder returned The Professor with yet another no — but appended a note saying a longer, more vivid novel would receive careful attention. Jane Eyre was in their hands within weeks and published on October 16, 1847, eight weeks after acceptance, when she was thirty-one. It was an immediate sensation — the pseudonymous \"Currer Bell\" became the most talked-about author in England — and it has never been out of print. She died March 31, 1855.",
  sources: [
    "Gaskell, Elizabeth. The Life of Charlotte Brontë (London: Smith, Elder, 1857).",
    "Barker, Juliet. The Brontës (London: Weidenfeld & Nicolson, 1994), Chapters 15-17.",
    "Southey to Charlotte Brontë, March 12, 1837 (Brontë Parsonage Museum collections).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The parsonage life, the governess years she hated, the laureate's verdict at 20 (kept unnamed), the lifelong writing habit — documented.",
      text: `There was a woman of thirty in a cold stone house at the edge of the moors.

She was a clergyman's daughter — small, near-sighted, poor, and burning with a talent she had almost no permission to use. She'd spent her twenties as a governess and teacher in other people's houses, work she did dutifully and hated with her whole soul.

She had been writing since childhood — tiny books, whole invented worlds, and now poems and stories in every stolen hour. Once, at twenty, she'd gathered her courage and sent her poems to the most eminent poet in the land, asking honestly: is this any good? Should I try to live by it?

His reply was kind in tone and a door slammed in substance. Literature, he wrote, cannot be the business of a woman's life — and it ought not to be.

She kept the letter. She kept writing, too. Quietly, at the dining-room table, after everyone slept.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The 1846 poems (paid from their own small money, androgynous pseudonyms) selling two copies; the first novel's rejection round beginning; the troubled household — documented.",
      text: `At thirty she made her real bid.

She and her two sisters — writers too, all of them, in secret — paid out of their own small savings to publish a joint book of poems. They used made-up names, half men's names, because everyone knew what reviewers did to women.

The book sold two copies.

Two. In a whole year, in the whole country. They'd have done better burying the money in the yard.

She absorbed that and doubled the bet: a novel. She wrote it, polished it, and sent it to a publisher in the capital. It came back. She re-wrapped the same brown paper — the old crossed-out addresses still on it — and sent it to the next. It came back. And the next.

All this in a house filling with trouble: her father going blind, her brother drinking himself to pieces upstairs.

Thirty years old. The great poet's letter, the two copies, the boomeranging manuscript — the world's verdict on her writing was unanimous, and it was no.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Beginning the second novel in Manchester lodgings while nursing her father post-surgery, with the first still unsold — documented.",
      text: `Here is what she did while the first novel was still being refused: she started the second.

Not after the first found a home. Not after some encouragement arrived to justify it. In the middle of the rejections — in cheap lodgings in a strange city, of all places, where she'd taken her father for an eye operation and sat nursing him in a darkened room for weeks.

In that darkened room, between a blind father's needs, she began the new book. A governess story, this time — the life she knew from the inside. A small, plain, poor heroine with a soul of fire, who demands to be seen as exactly equal to anyone.

She wrote it in a kind of fever, station by station, all through the year of noes.

If the world was going to keep saying no, it was at least going to have to keep saying it to new work.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The continuing rejection round for The Professor through 1846-47 (the much-crossed-out wrapper detail is documented); the household strain — documented.",
      text: `The first novel kept coming home.

Publisher after publisher, most of a year and more. She economized on the humiliation by reusing the wrapping paper, so each new publisher received a parcel visibly scarred with the crossed-out addresses of everyone who had already said no — which tells you something about her money, and more about her spine.

At home the strain deepened. Her brother — the family's supposed genius, once — was far gone now, and the house lived around his ruin. Her sisters' novels were finding publishers, slowly and on poor terms; hers alone kept bouncing.

She later put words to what those years asked of her, in the mouth of her heroine: I care for myself. The more solitary, the more friendless, the more unsustained I am, the more I will respect myself.

She finished the second novel with the first still homeless. Two complete books now. Zero acceptances.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Aug 1847 rejection-with-a-note from the eventual publisher; Jane Eyre sent within weeks, published eight weeks after acceptance — documented.",
      text: `Then came the rejection that changed everything — because it was two sentences longer than the others.

A publishing house in the capital returned the first novel with the usual no. But someone there had actually read it, and added a note: this book was too short and too quiet for them — but the writing had qualities. A longer, more vivid novel by the same hand would receive careful attention.

Careful attention. After years of form-letter noes, someone had left a door open one inch.

She put the second novel — the governess with the soul of fire — into the mail within weeks.

This time the publisher's reader started it on a Sunday morning and could not put it down; legend says he cancelled his engagements and read straight through to the end. The firm accepted it almost immediately and rushed it out in eight weeks flat.

The unanimous no had needed exactly one yes to end.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The immediate sensation, the pseudonym's fame and the eventual reveal, the book's permanence — documented, names withheld.",
      text: `The book detonated across the reading public.

Within weeks her made-up name was the most talked-about author in the country. Reviewers raved and clutched pearls in equal measure — the little governess novel had a directness, a fury, an intimacy nobody had encountered before. The great and famous speculated wildly about who the author could be.

The author was a parson's daughter doing the ironing on the moors.

When she finally revealed herself, literary society could hardly believe it. The tiny, shy, provincial spinster — the woman the age had built no path for — had written the book of the decade.

It has never been out of print. Not for one day, across nearly two centuries. The poems sold two copies; the novel has sold uncounted millions, and its plain, fierce, unsustained heroine still teaches readers — especially the overlooked ones — to respect themselves.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Charlotte Brontë.

The book was Jane Eyre. The poet laureate who told her literature could never be a woman's business is remembered today mostly for having said that to her. None of the fame existed yet in the year her poems sold two copies and her first novel came home from every publisher in London.

Your life is not theirs. But a piece of this story may still sit beside you.

The verdict on her work was unanimous for years — eminent, repeated, reasonable-sounding, and wrong. What saved her wasn't a thicker skin. It was that she kept producing the next thing while the last thing was still being refused, so that when one door opened an inch, she had the masterpiece ready to put through it.

The noes you've collected are a stack of opinions, not a prophecy. Keep the next thing moving. She did, and it's immortal.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 25, 1906, St. Petersburg; at 29 the USSR's most celebrated young composer;
//    Stalin attended his hit opera Jan 26, 1936; Pravda's unsigned "Muddle Instead of Music"
//    followed Jan 28 — condemning the opera and warning the games "may end very badly"; the opera
//    was banned, colleagues denounced him in public meetings, friends crossed streets; he
//    completed his Fourth Symphony anyway (April 1936) but was pressured into withdrawing it
//    before premiere under threat of "administrative measures"; the Terror closed in — his patron
//    Marshal Tukhachevsky was arrested and shot 1937, relatives and colleagues vanished; the
//    kept-packed suitcase / waiting by the elevator at night so his family wouldn't see an arrest
//    is widely reported by his circle and biographers; Fifth Symphony premiered Nov 21, 1937 (31)
//    to a ~30-40 minute ovation with open weeping; the subtitle "a Soviet artist's creative reply
//    to just criticism" (a journalist's phrase he let stand) restored him officially; the music
//    itself carries the grief its surface obedience concealed. d. 1975.
//  Interpretive: the double-speak reading of the Fifth (grief inside obedience) is the standard
//    scholarly reading but contested in degree — the beats state it as what audiences heard, which
//    is documented (the weeping), not as decoded intent.
//  Avoid saying: don't name Shostakovich / Stalin / Pravda / the USSR explicitly before the
//    bridge ("the newspaper that spoke for the state," "the leader" keep it soft); no symphony
//    numbers before the bridge; the Terror rendered plainly but without atrocity detail.
const shostakovich: FigureStageRow = {
  figureKey: "shostakovich",
  displayName: "Dmitri Shostakovich",
  birthYear: 1906,
  deathYear: 1975,
  stageId: "1936-1937-muddle-to-the-fifth",
  stageLabel: "The denunciation: the state's newspaper to the Fifth's ovation",
  ageMin: 29,
  ageMax: 31,
  themes: ["public_failure", "social_constraint", "quiet_defiance"],
  antiThemes: [],
  shapeSentences: [
    "At twenty-nine he was his country's most celebrated young composer, and then the state's newspaper denounced his masterpiece in a single unsigned article — and overnight his fame became a danger to everyone who knew him.",
    "In a country where disgrace could mean disappearance, he withdrew his boldest work, kept a packed suitcase by the door, and composed his answer in the only language the censors couldn't fully read.",
    "The new symphony premiered to half an hour of weeping ovation — obedient on its surface, grieving underneath — and it saved his life without surrendering his voice.",
  ],
  facets: {
    emotionalCore:
      "Living inside public disgrace with no appeal — watching friends cross the street to avoid him — while the fear was not of embarrassment but of the knock on the door.",
    decisionShape:
      "Whether to fall silent, flee into hackwork, or find a way to write music that satisfied the state's demands on its surface while keeping the truth alive underneath.",
    triggerEvent:
      "The leader attended his opera, and two days later the state's newspaper condemned it — with a sentence warning that his games could end very badly.",
    agencyState:
      "He could not answer, could not leave, could not even premiere what he'd written — but the notes themselves could still carry more than the censors could parse.",
  },
  biographicalFacts:
    "Dmitri Shostakovich was born September 25, 1906, in St. Petersburg. By his late twenties he was the Soviet Union's most celebrated young composer; his opera Lady Macbeth of the Mtsensk District had run for two years to acclaim at home and abroad. On January 26, 1936, Stalin attended a performance. Two days later Pravda published an unsigned editorial, \"Muddle Instead of Music,\" condemning the opera as coarse, formalist noise, and warning that such games \"may end very badly.\" The opera was banned; colleagues denounced him at organized meetings; friends avoided him. He completed his defiant Fourth Symphony in April 1936, but under pressure — the threat of \"administrative measures\" — withdrew it before its December premiere; it would not be heard for twenty-five years. The Great Terror closed around him: his patron Marshal Tukhachevsky was arrested and shot in 1937, and relatives, colleagues, and friends were imprisoned or executed. Accounts from his circle describe him sleeping with a packed suitcase by the door, at times waiting by the elevator at night so that his arrest, if it came, would not wake his family. His Fifth Symphony premiered in Leningrad on November 21, 1937, when he was thirty-one: the audience wept openly during the slow movement, and the ovation lasted by most accounts over half an hour. Billed with the formula \"a Soviet artist's creative reply to just criticism\" — a journalist's phrase he allowed to stand — the work officially rehabilitated him, while listeners then and since have heard in it the grief and terror of the years it came from. He remained in the Soviet Union, was denounced again in 1948, and died August 9, 1975.",
  sources: [
    "Fay, Laurel E. Shostakovich: A Life (New York: Oxford University Press, 2000), Chapters 5-6.",
    "\"Muddle Instead of Music.\" Pravda, January 28, 1936.",
    "Volkov, Solomon, ed. Testimony: The Memoirs of Dmitri Shostakovich (New York: Harper & Row, 1979) — used with the standard caveats about its contested provenance.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "His stature at 29, the hit opera's two-year run, the leader's attendance — documented.",
      text: `There was a young composer at the top of his world.

He was twenty-nine, and in his vast country he was the young genius — the one the newspapers praised, the one whose opera had been running to packed houses for two years, at home and abroad. Photographs, prizes, the future of the nation's music: him.

It was a country where art mattered enormously — and where everything that mattered was watched. Music, like everything else, was expected to serve the state and please its leader. So far, his had.

One January evening, the leader himself came to see the famous opera. Sat in the government box, behind a curtain.

The composer was there. He watched the box more than the stage. Partway through, the leader left.

Two days later, the newspaper that spoke for the state published its opinion of him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The unsigned editorial and its 'may end very badly' warning; the ban, the organized denunciations, the social death; the era's stakes — documented.",
      text: `The article was short, unsigned, and everyone in the country understood exactly what it was.

His celebrated opera was muddle, it said. Coarse noise. Deliberate ugliness. A game — and here came the sentence that mattered — a game that may end very badly.

May end very badly. In his country, in that decade, everyone knew what those words meant. People were beginning to vanish — a knock at the door, and gone.

The opera was banned within weeks. Colleagues who had toasted him stood up at organized meetings and denounced him, one by one, because refusing to was dangerous. Friends stopped calling. Some crossed the street.

He was twenty-nine, and he had become, in forty-eight hours, a man it was hazardous to know.

And the fear wasn't professional. His patrons and friends started being arrested. By his family's account he kept a suitcase packed by the door — and some nights he waited by the elevator, so that if they came for him, his wife and child wouldn't see it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Completing the Fourth anyway; the forced withdrawal under threat — documented.",
      text: `He kept composing. That was the first answer: terrified, disgraced, he sat down every day and worked.

The symphony he finished that spring was enormous, wild, modern — everything the article had condemned, drawn to full scale. For a while he intended to premiere it. Rehearsals began.

Then came the visit: it was suggested — in the way that country made suggestions — that he withdraw the work. Voluntarily, of course. Or measures would be taken.

He withdrew it. He put the best thing he had ever made in a drawer, not knowing if it would ever be heard. It would wait twenty-five years.

Cowardice? He had a wife, a baby daughter, a mother. Every artist he knew was learning the same arithmetic, and the ones who refused it were disappearing.

He chose to live — and to find another way to tell the truth.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The Terror year: the patron's execution, the vanishing circle, composing the Fifth inside it — documented; the double-language framing per provenance note.",
      text: `The terrible year deepened. His greatest protector — a marshal of the nation, a man of enormous power — was arrested and shot. People one handshake away from him vanished monthly. Every knock could be the knock.

Inside that fear, he wrote the new symphony. And he set himself a problem no composer had ever faced in quite this form:

The state demanded music that was simple, heroic, optimistic — proof of his correction. Anything else could kill him. But he was a man drowning in grief and dread, and music that lied completely would be a kind of death too.

So he wrote a work that could hold both. Clear, powerful, traditional on its surface — the obedient answer. And inside it, especially in its long slow movement, all the sorrow of that year: the vanished friends, the packed suitcase, the whole weeping country that officially had nothing to weep about.

Music can do that. Words are checkable. Notes know how to keep a secret in plain sight.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Nov 21, 1937 premiere: the open weeping in the slow movement, the ~half-hour ovation, the official rehabilitation formula — documented.",
      text: `The premiere came on a November night, in the great hall of his home city, with his career and conceivably his life on the program.

The symphony began. The audience — an audience full of people with their own packed suitcases, their own vanished friends — listened.

In the slow movement, people began to weep. Openly, in their seats, in public, in a country where public grief about the times was itself dangerous. The music had said the unsayable for them, and every person in the hall understood it at once — and understood that it could never be proven.

When it ended, the ovation would not stop. A quarter hour. A half hour, by most accounts. People stood and would not leave.

Officially, the evening was recorded as the artist's successful correction — his creative reply to just criticism. The phrase wasn't even his; he let it stand. Let them have the words.

The hall had heard what the music actually said.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The restored standing, the later denunciation survived, the fifteen symphonies and the quartets, the posthumous stature — documented.",
      text: `The symphony restored him — officially a corrected man, actually an uncorrected one who had learned to carry truth through checkpoints.

He lived that double life for four more decades. The state denounced him again years later; he survived that too, the same way. He wrote fifteen symphonies, and — in the privacy of chamber music, where the state listened less — a cycle of string quartets that amount to a secret diary of his century.

He never fled, though he had chances. He stayed, endured the medals and the muzzle both, and outlived the tyrant by twenty-two years.

Today the leader's cultural pronouncements are historical curiosities. The composer's works are performed somewhere on earth essentially every night — and audiences still hear in that Fifth Symphony exactly what the first audience heard: how it feels when fear runs the world and a human being answers anyway.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Dmitri Shostakovich.

The article was "Muddle Instead of Music," in Pravda, after Stalin walked out of his opera; the answer was the Fifth Symphony, premiered at the height of the Terror to half an hour of weeping ovation. He is now regarded as one of the greatest composers of the twentieth century. None of that safety existed on the nights he waited by the elevator with a packed suitcase, so his family wouldn't see the arrest.

Your life is not theirs. But a piece of this story may still sit beside you.

He fell from the top of his world in forty-eight hours, by decree, with no appeal. He couldn't fight it openly and he refused to disappear into it — so he found the narrow way through: keep working, survive the surface demands, and smuggle the truth inside the work.

Even when you can't say what's true out loud, you don't have to become the lie. He never did, for forty years, in the hardest room on earth.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 23, 1926, Hamlet NC; father died when he was 12 (a season of family deaths);
//    heroin and alcohol through his 20s sideman years; hired into Miles Davis's quintet 1955 — the
//    big break — but the addiction deepened: nodding off on stage, pawning horns; April 1957 (30)
//    Davis fired him; weeks later, at his mother's house in Philadelphia, he quit heroin and
//    alcohol cold — days of locked-room withdrawal with family bringing water; his own liner notes
//    to A Love Supreme (1965): "in the year of 1957, I experienced, by the grace of God, a
//    spiritual awakening which was to lead me to a richer, fuller, more productive life"; June-Dec
//    1957 the Thelonious Monk residency (his university); Blue Train Sept 1957; rejoined Davis Dec
//    1957; Kind of Blue 1959, Giant Steps 1959-60, A Love Supreme 1964. d. 1967.
//  Interpretive: "the firing as the mercy that forced the choice." Grounded in his own account.
//  Avoid saying: don't name Coltrane / Miles / Monk / album titles before the bridge; addiction in
//    the older-friend register — no glamor, no clinical language, no moralizing; the withdrawal
//    rendered brief and physical, not graphic; God kept to his own quoted framing (bridge only).
const coltrane: FigureStageRow = {
  figureKey: "coltrane",
  displayName: "John Coltrane",
  birthYear: 1926,
  deathYear: 1967,
  stageId: "1957-fired-and-clean",
  stageLabel: "Fired and clean: losing the big break and quitting cold at his mother's house",
  ageMin: 30,
  ageMax: 31,
  themes: ["addiction", "shame", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "He finally got the seat every musician of his generation wanted, and the habit he couldn't shake took it from him — fired, at thirty, by the bandleader who had believed in him.",
    "He went home to his mother's house, closed a door, and quit everything at once — and came out the other side changed in a way he spent the rest of his life trying to express.",
    "Within months the fired sideman was remaking his instrument's language, and within a few years he was one of the most important musicians alive.",
  ],
  facets: {
    emotionalCore:
      "The shame of failing, in public, at the exact opportunity he'd worked a decade for — and knowing that everyone who mattered knew exactly why.",
    decisionShape:
      "Whether to keep managing the habit alongside the career until one of them killed the other, or to stop completely, at once, with nothing but a locked door and family outside it.",
    triggerEvent:
      "The bandleader who had given him his great chance fired him over the addiction — the bottom arriving as a pink slip from the best job in his art form.",
    agencyState:
      "The habit had taken his job, his money, and his reliability — but the horn was still his, his mother's house still had a room for him, and quitting was a decision no one could make for him.",
  },
  biographicalFacts:
    "John Coltrane was born September 23, 1926, in Hamlet, North Carolina, and raised in High Point. When he was twelve, a season of deaths — his father, grandparents, an uncle — hollowed the family, and he grew up quiet and inward, practicing obsessively. Through his twenties he was a working saxophone sideman with a worsening heroin and alcohol habit, part of the epidemic that ran through the jazz world of that era. In 1955 Miles Davis hired him for his new quintet — the most coveted sideman chair in modern jazz and Coltrane's great break — but the addiction deepened alongside the acclaim: he nodded off on stage, showed up late or high, pawned his horns. In April 1957, at thirty, Davis fired him. Within weeks, Coltrane went to his mother's house in Philadelphia and quit heroin and alcohol at once, cold — days of withdrawal in a closed room, drinking only water, with his wife Naima and his family keeping watch. He described what happened there in his own liner notes to A Love Supreme years later: \"During the year 1957, I experienced, by the grace of God, a spiritual awakening which was to lead me to a richer, fuller, more productive life.\" That summer and fall he served a legendary residency with Thelonious Monk at the Five Spot — he called working with Monk an education of the highest order — recorded his breakthrough album Blue Train in September 1957, and rejoined Davis in December. The next years produced Kind of Blue with Davis (1959), his own Giant Steps (1960), and in December 1964 A Love Supreme, his devotional masterpiece — recorded clean, as he remained for the rest of his life. He died of liver cancer July 17, 1967, at forty.",
  sources: [
    "Porter, Lewis. John Coltrane: His Life and Music (Ann Arbor: University of Michigan Press, 1998), Chapters 8-10.",
    "Coltrane, John. Liner notes to A Love Supreme (Impulse!, 1965).",
    "Ratliff, Ben. Coltrane: The Story of a Sound (New York: Farrar, Straus and Giroux, 2007).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The decade of sideman work, the obsessive practicing, the 1955 hire into the era's top band, the habit running alongside — documented.",
      text: `There was a horn player who had worked ten years for one seat.

He was a quiet man, serious as a church, who practiced more than anyone anybody knew — hours past the end of rehearsal, falling asleep with the horn on his chest. He'd come up the hard way: dance bands, bar bands, other people's sessions, a decade of apprenticeship.

And he carried the other thing, too — the habit. The drug that was eating through the musicians of his generation like a fire through dry timber. He'd picked it up young, the way half his world had, and it had its hooks all the way in.

Then the call came. The most famous young bandleader in the music wanted him. The seat next to the star — the chair every horn player alive wanted.

He took it. The gigs were historic. His playing began turning heads coast to coast.

And the habit came right along with him, up onto the biggest stage in the art form.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The on-stage nodding, the pawned horns, the April 1957 firing — documented; rendered without glamor.",
      text: `The habit didn't care that he'd made it.

He nodded off on stage — on stage — in front of audiences who'd paid to see the great band. He missed calls. He showed up late, or worse. He pawned his own horns when the need got loud enough. The money went where that money goes.

The bandleader was no saint and no stranger to the drug; he'd fought his own war with it. Which meant he knew exactly what he was watching, and exactly where it ended.

One night in the spring, it came to a head. Words, and more than words. And then the sentence:

You're done. Fired.

Thirty years old. Ten years of work to reach that chair, and he'd played himself out of it in two — not for lack of genius, which everyone conceded, but because the habit was running his life and everyone in the music knew it.

The shame of that was total. There was nowhere in his world the story hadn't traveled.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The documented cold-turkey decision at his mother's Philadelphia house; the locked-room withdrawal with family keeping watch — brief and physical per provenance.",
      text: `He went home to his mother's house.

And there, a few weeks after the firing, he made the decision no one could make for him. Not to cut down. Not to manage it better. To stop — everything, the drug and the drink both, at once, completely.

He went into a room and closed the door. He asked his family for water and nothing else.

The days that followed were as bad as those days are. The body fights. He stayed in the room. His wife and his mother kept watch outside the door, bringing the water.

He came out changed. Not just clean — changed. Something had happened to him in there that he spent the rest of his life trying to describe, and mostly he described it through the horn.

He said later that in that year he was led to a richer, fuller, more productive life. It started in a small room in his mother's house, with water.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The clean rebuild: the summer-fall residency with the older master pianist as his 'education'; the practice regimen — documented.",
      text: `Clean was one thing. Rebuilding was another.

The music world had watched him fall; now it watched to see if he'd stay up. He answered with work. That summer he joined the band of an older master — a strange, brilliant pianist the public was only starting to understand — for a long nightly residency in a small club.

He called that bandstand his university. Every night the older man's music demanded things no other music demanded, and every night the newly clean horn player stretched to meet it. Musicians started crowding the club just to hear him grow week by week.

All the hours the habit used to take, the horn got now. He practiced with a hunger that scared people — scales, theory, sheets of new sound nobody had names for yet.

By fall he was leading his own record dates. By winter, the bandleader who had fired him wanted him back.

He went back — clean, and twice the player he'd been.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The return to the famous band and the run of landmark records in the following two years — documented, titles withheld.",
      text: `What followed, over the next few years, is one of the great runs in the history of American music.

With the famous band, he helped make an album so beautiful and so calm that it became — and remains — the best-selling record its whole art form has ever produced.

Under his own name, he recorded a set of compositions so harmonically daring that musicians still study them like exam papers, and a sound so personal you can name him in two notes.

The fired sideman was gone. In his place stood a leader — of bands, and soon of the music itself. Critics ran out of adjectives. Younger players began imitating him the way his generation had imitated the masters.

And underneath all of it, unmissable to anyone who listened, was the thing from the small room: a seriousness, a gratitude, a sense that every note was being offered to something.

He never touched the drug again.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The devotional masterpiece (recorded clean, 7 years on) and his stature; the liner-note framing reserved for the bridge — documented.",
      text: `Seven years after the locked room, he recorded his masterpiece — a four-part offering of thanks for the rescue of his life. He wrote the dedication himself, plainly, telling the story: the year of his awakening, the grace he credited, the gratitude.

The record became one of the most revered in all of American music — people who own five jazz albums own it, and people who own five thousand still put it first.

He became, before his early death, one of the most important musicians of his century: a sound imitated on every continent, a body of work that musicians treat as scripture, and — rarer than any of that — an example. The story every struggling player in the music knew by heart: the one who fell all the way, stopped, and rose into greatness clean.

The habit took two years of his greatness. The small room gave back the rest.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was John Coltrane.

The bandleader who fired him was Miles Davis; the album of thanks was A Love Supreme. In its liner notes he wrote it himself: "During the year 1957, I experienced, by the grace of God, a spiritual awakening which was to lead me to a richer, fuller, more productive life." None of that existed yet in the spring when he was thirty, fired, and out of road.

Your life is not theirs. But a piece of this story may still sit beside you.

The thing he couldn't control cost him the chance he'd spent ten years earning, in front of everyone. The turn didn't come from willpower alone — it came when the bottom arrived and he chose the small room over the long slide, one terrible week at a time.

Rock bottom isn't the end of the story. Sometimes it's the floor you finally push off from. His push became A Love Supreme.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 15, 1890, Torquay; April 1926 (35) her adored mother Clara died; Aug 1926
//    Archie Christie asked for a divorce (in love with Nancy Neele); Dec 3, 1926 (36), after a
//    quarrel, she kissed her sleeping daughter, drove off, and vanished for 11 days — the car
//    abandoned above a chalk quarry, a national manhunt, found Dec 14 at a Harrogate hotel
//    registered under the surname of her husband's mistress; she never publicly explained it and
//    her doctors called it amnesia (the beats state the facts and her silence, and adopt NO
//    theory); divorce finalized 1928 (38); autumn 1928 she took the Orient Express alone to
//    Baghdad — her first fully solo adventure; 1930 (39) met archaeologist Max Mallowan on a dig
//    (married 1930, a happy marriage to her death); her greatest books and world fame followed.
//    d. 1976.
//  Interpretive: "the year that erased her, and the train where she began authoring herself
//    again." Grounded.
//  Avoid saying: don't name Christie / Poirot / the Orient Express / Harrogate before the bridge;
//    the disappearance rendered ONLY as documented fact + her lifelong silence — no amnesia-vs-
//    fugue-vs-revenge theorizing, no crisis speculation, nothing self-harm-adjacent; the mistress's
//    surname detail stays factual and unexplained.
const christie: FigureStageRow = {
  figureKey: "christie",
  displayName: "Agatha Christie",
  birthYear: 1890,
  deathYear: 1976,
  stageId: "1926-1928-the-year-that-broke",
  stageLabel: "The year that broke: her mother's death, the betrayal, and the train out",
  ageMin: 35,
  ageMax: 38,
  themes: ["heartbreak", "grief", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "In one year she lost her mother and then her marriage — the husband she adored asking for a divorce because he loved someone else — and for eleven strange days that winter she disappeared even from herself.",
    "She put her life back together in public, under headlines, while grieving two people at once — one dead, one simply gone to another woman.",
    "Two years later she boarded a famous train alone, bound for the far side of the world, and began authoring the rest of her life on her own terms.",
  ],
  facets: {
    emotionalCore:
      "Grief and betrayal arriving in the same year — the mother who anchored her and the husband she trusted, both gone — until her own mind, overloaded, briefly shut the lights off.",
    decisionShape:
      "Whether to rebuild a small careful life in the wreckage everyone was watching, or to get on a train alone toward places she'd never been and find out who she was without him.",
    triggerEvent:
      "Months after her mother's death, her husband told her he loved another woman and wanted a divorce.",
    agencyState:
      "Publicly humiliated, privately shattered, a single mother now — but solvent by her own pen, free by law, and holding a ticket no one had chosen for her.",
  },
  biographicalFacts:
    "Agatha Christie was born September 15, 1890, in Torquay, England. By her mid-thirties she was a successful mystery novelist, married to Colonel Archibald Christie, with a young daughter, Rosalind. In April 1926 her mother, Clara — the closest attachment of her life — died; Agatha spent the following months sorting her childhood home in deep grief. That August, Archie told her he was in love with Nancy Neele and wanted a divorce. On the night of December 3, 1926, after a quarrel, Agatha kissed her sleeping daughter, drove away, and vanished; her car was found abandoned above a chalk quarry at Newlands Corner. The disappearance became a national sensation — a thousand police, aircraft, and volunteer searchers — until, eleven days later, she was found at a hotel in Harrogate, registered under the surname of her husband's mistress. Her doctors attributed it to amnesia; she never publicly explained those days, in interviews or in her autobiography, and the truth of them is unrecoverable. The divorce was finalized in 1928, when she was thirty-eight. That autumn she did something no one expected: she boarded the Orient Express alone — her first fully solo journey — bound ultimately for Baghdad and the archaeological digs of Mesopotamia, which fascinated her. On a later visit to the dig at Ur she met the archaeologist Max Mallowan, fourteen years her junior; they married in 1930 and remained married, happily by both accounts, until her death. The decades that followed produced her most celebrated work — including Murder on the Orient Express, born of those journeys — and made her the best-selling novelist in history. She died January 12, 1976.",
  sources: [
    "Christie, Agatha. An Autobiography (London: Collins, 1977), Parts VI-VII.",
    "Morgan, Janet. Agatha Christie: A Biography (London: Collins, 1984), Chapters 7-9.",
    "The National Archives (UK), Surrey Constabulary records on the 1926 disappearance.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The settled mid-thirties life: the career, the marriage, the daughter, the adored mother — documented.",
      text: `There was a woman in her mid-thirties who seemed, from the outside, to have built the complete life.

A house in the countryside. A dashing husband she'd fallen for at a dance half a lifetime ago. A small daughter. And a career of her own, unusual for a wife in those days — she wrote clever mystery novels, and they were starting to sell rather well.

At the center of her world, as it had been since childhood, was her mother — her confidante, her first believer, the person who had always understood her strange imagination and guarded it.

She was a shy woman, happier at her typewriter than at parties, and she trusted her small circle completely: her mother, her husband, her child.

Within a single year, that circle was going to be torn through twice.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The mother's death (April 1926), the months of grief-sorting the family home largely alone, the husband's August announcement — documented.",
      text: `In the spring, her mother died.

The grief flattened her. She spent that summer alone in her dead mother's house, sorting a lifetime of belongings, weeping over trunks of letters, while her husband — who disliked illness, sadness, and anything that interfered with his golf — mostly stayed away.

She thought that was the worst of it: doing her grieving alone.

Then, in late summer, her husband came to the house and told her the actual worst. He had fallen in love with someone else — a younger woman, a mutual acquaintance. He wanted a divorce.

Her mother dead in the spring. Her marriage dead by summer, at the hands of the person she trusted most in the living world.

She begged; he was immovable. The two losses ground against each other through the autumn — grief for her mother, grief for a man who wasn't dead but was gone, plus the special humiliation of being left.

And that winter, under a load no one was helping her carry, something in her gave way.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The documented disappearance rendered strictly factually (the drive, the abandoned car, the 11 days, the hotel, the mistress's surname, the manhunt) with her lifelong silence stated — NO theory adopted.",
      text: `Here is what is known — and all that is known.

One December night, after a quarrel with her husband, she went upstairs and kissed her sleeping daughter. Then she got in her car and drove away into the dark.

The car was found the next morning, abandoned above a chalk quarry. She was not in it.

For eleven days, the whole country looked for her. A thousand police. Volunteers walking the downs in lines. It was the biggest story in the nation.

On the eleventh day she was found — calm, well, at a spa hotel far to the north, registered under a false name. The surname she had chosen was the surname of her husband's mistress.

Her doctors called it amnesia. She lived another fifty years and never once explained those days — not to the press, not in her autobiography. Whatever happened inside her that December, she kept it.

What the record shows is simply this: a woman buried her mother, lost her marriage, and briefly lost herself. And then came back.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The public aftermath (press hostility over the search's cost, the humiliation), the divorce proceedings, single motherhood, continuing to write — documented.",
      text: `Coming back was the hard part.

The newspapers, cheated of a tragedy, turned mean — was it a stunt? A publicity game? She, the shyest of public women, was now nationally famous for the worst week of her life, and obliged to keep living in front of everyone.

The divorce ground forward anyway. He married the other woman almost immediately. She was thirty-eight: a single mother, publicly humiliated, privately hollowed — grieving her mother still, underneath all of it.

She did the unglamorous things survival is made of. She cared for her daughter. She managed the money. And she kept writing — because it was hers, because it paid, and because a person can type through a great deal.

Slowly a question surfaced through the wreckage, one she'd never been allowed to ask in a life that had gone straight from her mother's house to her husband's:

what did she want?`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The autumn 1928 solo Orient Express journey to the Mesopotamian digs — her first fully solo adventure — documented.",
      text: `The answer arrived as a train ticket.

Friends at a dinner party talked of the far side of the world — the great express train that ran across a continent, and beyond it, ancient cities being dug out of the desert. Something in her sat up. She had planned a sensible winter in the islands nearby. She cancelled it.

Instead, that autumn — divorce papers barely dry — she boarded the famous express alone. No husband, no companion, no chaperone. A woman traveling by herself across Europe and into the East, at a time when that raised eyebrows.

She loved every mile of it. The sleeping cars, the strange stations, the desert, the dig at the ancient city where archaeologists were lifting whole vanished worlds out of the sand.

Somewhere on those rails, the woman who had been erased — by grief, by betrayal, by eleven blank days — started writing herself again, in her own hand.

The train would end up in the title of one of the most famous books on earth. Hers.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The second marriage met through the digs, the great-decades career, the best-selling-novelist-in-history stature — documented, names withheld.",
      text: `The East gave her back more than herself.

On a later visit to the digs she met a quiet, kind archaeologist, years younger, who liked her exactly as she was. She married him, warily and then wholeheartedly, and it held — happily — for the rest of her life. She spent seasons on his desert excavations, cataloguing finds by day and writing by night.

And the books. The books became a phenomenon without precedent. The decades after the terrible year produced her masterpieces — many set on the trains and digs of her second life — and by the end she was, by the plain arithmetic of copies sold, the best-selling novelist in the history of the world. Billions of books. Only scripture and one playwright ahead of her.

The woman whose life collapsed at thirty-six built, on the far side of it, the largest readership any storyteller has ever had.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Agatha Christie.

The best-selling novelist in history — two billion books, Poirot and Marple, and Murder on the Orient Express, written about the very train she boarded alone after the divorce. The eleven days she vanished in 1926 remain one of the century's famous mysteries; she took the answer with her. None of the triumph existed yet in the year she lost her mother and her husband within months of each other.

Your life is not theirs. But a piece of this story may still sit beside you.

The two people holding up her world went in one year — one to death, one to someone else — and the weight briefly took even her memory of herself. What brought her back wasn't a rescue. It was a ticket she bought alone, toward a life nobody had planned for her.

Heartbreak this size doesn't just end a chapter; it hands you the pen. She wrote two billion books' worth of what came next.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. May 12, 1820; led the Scutari nursing mission 1854-56 (the national heroine,
//    "the Lady with the Lamp"); contracted "Crimean fever" (likely brucellosis) May 1855; returned
//    Aug 1856 (36) famous and depleted; from 1857 (37) intermittently bedridden — decades of
//    chronic illness and exhaustion; refused the heroine's retirement: from her rooms she wrote
//    the ~830-page report on army health, drove the 1857 Royal Commission, wrote Notes on Nursing
//    (1859), founded the Nightingale Training School (1860, age 40) — largely without leaving her
//    rooms; invented/popularized the polar-area diagram to make mortality data undeniable; wrote
//    on the order of 13,000+ letters (some counts far higher) driving reform for four decades;
//    never returned to ward nursing. d. 1910.
//  Interpretive: CARE — this is the burnout anchor. The honest frame: the work she loved wrecked
//    her body; she could never go back to the front lines; and she discovered her greatest impact
//    in a slower, paced, seated form. The beats must NOT glorify pushing through — the "became" is
//    "she mattered differently," not "she worked harder."
//  Avoid saying: don't name Nightingale / Crimea / Scutari / "the Lady with the Lamp" before the
//    bridge; don't romanticize the 20-hour ward days (they're what broke her); no medical
//    diagnosis debates; the couch/bed decades rendered as adaptation, not tragedy.
const nightingale: FigureStageRow = {
  figureKey: "nightingale",
  displayName: "Florence Nightingale",
  birthYear: 1820,
  deathYear: 1910,
  stageId: "1856-1860-spent",
  stageLabel: "Spent: the heroine comes home empty and learns to work lying down",
  ageMin: 36,
  ageMax: 40,
  themes: ["burnout", "illness", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "She came home from the war the most famous woman in the country and completely spent — the years of twenty-hour days had taken her health, and it was never coming back.",
    "The work she was built for was now the work that would kill her, and she had to discover what a person is worth when the engine that defined her won't run anymore.",
    "From a couch, at a letter-writing pace her body could survive, she changed medicine more than she ever had on her feet.",
  ],
  facets: {
    emotionalCore:
      "The engine that had defined her whole self refusing to run — waking every day still exhausted, the old capacity simply gone, while the world kept asking for the tireless heroine she could no longer be.",
    decisionShape:
      "Whether to keep performing the tireless heroine until it killed her, or to accept the body's new terms and redesign the work — slower, seated, by letter — around what was actually left.",
    triggerEvent:
      "She returned from the war famous and hollowed out, and within a year her body simply stopped — bedridden, at thirty-seven, with no recovery coming.",
    agencyState:
      "Too depleted to stand through a hospital round, but in command of an unmatched mind, a national reputation, a pen, and the choice of what shape her remaining strength would take.",
  },
  biographicalFacts:
    "Florence Nightingale was born May 12, 1820, into a wealthy English family, and against ferocious family opposition made herself a nurse — the calling she described as her life's purpose. From 1854 to 1856, during the Crimean War, she led the nursing mission at the Scutari barrack hospital, working legendary hours amid catastrophic conditions; the newspapers made her the most famous woman in Britain, the \"Lady with the Lamp.\" The cost was physical: in May 1855 she contracted \"Crimean fever\" — most likely brucellosis — and never fully recovered. She returned home in August 1856, at thirty-six, depleted, and from 1857, at thirty-seven, was intermittently bedridden with chronic exhaustion, pain, and depression; the tireless twenty-hour capacity that had defined her was gone for good, and she never returned to ward nursing. She refused, however, to retire into invalidism as an ornament of the nation. Working from her rooms — often from a couch or bed, receiving one visitor at a time, rationing her strength — she produced an approximately 830-page analysis of army health that drove the Royal Commission of 1857; developed and popularized the polar-area diagram, an early masterpiece of statistical graphics, to make preventable-death figures undeniable to politicians; wrote Notes on Nursing (1859), the founding text of modern nursing; and in 1860, at forty, founded the Nightingale Training School at St Thomas' Hospital, the first professional nursing school in the world — largely without leaving her rooms. Over the following decades she wrote thousands upon thousands of letters — the count runs past thirteen thousand surviving — steering hospital design, sanitation reform, and public health across the Empire from her couch. She was the first woman admitted to the Order of Merit (1907) and died August 13, 1910, at ninety.",
  sources: [
    "Bostridge, Mark. Florence Nightingale: The Woman and Her Legend (London: Viking, 2008), Chapters 15-18.",
    "Nightingale, Florence. Notes on Matters Affecting the Health, Efficiency and Hospital Administration of the British Army (1858).",
    "Nightingale, Florence. Notes on Nursing: What It Is, and What It Is Not (London: Harrison, 1859).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The wartime mission and its legendary hours, the fame, the fever contracted at the front — documented. The hours rendered as cost, not glory, per provenance.",
      text: `There was a woman who had given a war everything she had.

She had fought her wealthy family for years for the right to work at all — nursing was beneath a lady, they said — and when the great war came, she led a team of nurses to the army's vast, filthy hospital abroad. What she found there was catastrophe: more soldiers dying of the hospital itself — the dirt, the crowding, the rot — than of their wounds.

She worked like a woman possessed. Twenty-hour days, months on end. Reorganizing everything, feeding, scrubbing, sitting with the dying, walking the wards at night with her lamp while thousands of men watched for her shadow.

The newspapers back home made her a legend. The most famous woman in the country. A saint.

Somewhere in those years, a fever from the war camps got into her body and never fully left. She ignored it. There was no time.

There is always no time — right up until the body decides otherwise.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The return home depleted (1856), the collapse into intermittent bedriddenness from 1857 with no recovery — documented. The 'engine gone' framing per provenance.",
      text: `She came home to a hero's welcome and could barely receive it.

Something was deeply wrong. The exhaustion didn't lift with rest — weeks of rest, months. Her heart raced climbing stairs. Pain moved in. The magnificent engine that had run twenty-hour days for two years simply would not start anymore.

Within a year of coming home she was spending most of her days lying down. She was thirty-seven.

And the doctors had nothing. No cure, no timeline — this was, they gradually stopped pretending otherwise, how she lived now.

Understand what that meant to this particular woman. Work was not what she did; it was what she was — she'd defied her whole world for it. Now the country wanted its tireless heroine, the cause of her life stood at its most winnable moment, and she could not reliably stand through a meeting.

She was the most famous woman in the nation, lying in a quiet room, spent — asking the darkest question a worker can ask: what am I, if I can't do it anymore?`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The refusal of ornamental invalidism; the redesign of work around the depleted body (rooms, rationed visitors, the pen) — documented.",
      text: `The answer she found was not the heroic one. It was better.

She stopped trying to be the woman with the lamp. That woman ran on a body that no longer existed, and performing her until it killed her would help no one — the soldiers still dying in filthy barracks needed her mind, not her martyrdom.

So she redesigned the work around what was actually left.

She took rooms and rarely left them. Visitors came one at a time, by appointment, briefly — the ministers and generals came to her couch. She worked lying down when sitting was too much. She rationed her strength like the scarce supply it was, spending it only where nothing else would do.

Her weapon changed too: no more wards. The pen. Data. Reports. Letters.

It looked, from outside, like retirement. It was about to become the most effective phase of her life.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The 830-page report and the Royal Commission driven from her rooms; the invention of the mortality diagrams; the grief and limits of those years — documented.",
      text: `From the couch, she went to war with the war office.

She assembled the evidence of what had actually killed the army — not enemy fire but preventable filth — into a report of over eight hundred pages, built while lying down, in sessions as long as her body allowed and no longer.

And knowing that ministers don't read eight hundred pages, she did something quietly revolutionary: she drew the deaths. She invented a new kind of chart — wedges of a circle, month by month, the preventable deaths dwarfing the battle deaths in one unanswerable picture. Politicians who could dodge a report could not dodge that image.

It worked. A royal commission. Reforms, real ones, that would save more soldiers than any general of her era.

None of it felt like the old fire. Some days she could do an hour's work; some days none, and grief for her old self ambushed her regularly.

She did it anyway — at the pace the body set. It turned out the pace mattered less than the aim.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Notes on Nursing (1859) and the founding of the training school (1860, age 40) — largely from her rooms — documented.",
      text: `Then, at forty, still working from her rooms, she built the two things that outlived everything.

First, a small book — plain, sharp, practical — on what nursing actually is: air, light, quiet, cleanliness, observation. Written for ordinary women caring for the sick anywhere. It became the founding text of an entire profession, and it has never stopped being read.

Second, with a fund the grateful nation had raised in her name, she founded a school — the first in the world to train nurses as educated professionals. She chose its hospital, shaped its rules, reviewed its every detail by letter and interview, and watched its first class begin.

She could not walk its wards. She never really would.

It didn't matter. The school's graduates went out across the world and founded schools of their own, carrying her standards into every country on earth — thousands of hands doing what her two could no longer do.

That is what she was, without the engine. It turned out: still her. Differently shaped, and bigger.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The decades of letter-driven reform, the Order of Merit, the profession itself as legacy — documented; adaptation framing per provenance.",
      text: `She lived — and worked, at her rationed pace — for another fifty years.

From the couch, by letter, she steered hospital design on three continents. Sanitation in distant colonies. The training of nurses everywhere. Prime ministers consulted her; a war office learned to fear her postscripts. Thousands of letters, decade after decade, each one written within the day's actual allowance of strength.

She never got the old body back. She never returned to the wards, never again worked a night with a lamp. The version of her the legend loved ended at thirty-six.

The version that mattered more lived to ninety — and near the end, her country gave her its highest order of merit, the first woman ever admitted to it.

Modern nursing, hospital hygiene, medical statistics: the couch-bound decades built them all.

She did her greatest work at one-tenth power. It was still ten times enough.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Florence Nightingale.

The Lady with the Lamp — founder of modern nursing, inventor of the mortality diagrams that founded medical statistics, the first woman awarded the Order of Merit. What the legend leaves out is that she did nearly all of it after her health collapsed at thirty-six — from a couch, at a fraction of her old capacity, for fifty years. The lamp years broke her. The couch years changed the world.

Your life is not theirs. But a piece of this story may still sit beside you.

The engine she'd built her whole identity on burned out and never came back — and she had to learn, in grief, that she was not the engine. She was the aim. The aim survived at any speed.

You are not your old capacity. Worth survives the crash. Hers did — at one-tenth power, for fifty years, magnificently.`,
    },
  ],
};

export const FIGURE_STAGES: FigureStageRow[] = [douglass, butler, lee, rogers, child, lewis, jones, rudolph, angelou, rachmaninoff, oconnor, marshall, allende, wilson, wang, chandler, graham, mcclintock, rustin, sanders, berlin_i, charles_r, sullivan_a, fitzgerald_e, poitier, simone, andersen, tallchief, lindgren, lewis_e, kovalevskaya, hughes, shelley_m, bly, faraday, carver, ramanujan, anning, owens, yeats, coleman, lamarr, hurston, muir, banting, bronte_c, shostakovich, coltrane, christie, nightingale];
