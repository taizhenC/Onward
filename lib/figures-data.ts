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
      "He was alive and free and not yet anyone, and he could not tell whether that was a beginning or the end of him.",
    decisionShape:
      "Whether to wait for safety before claiming a life, or to take the small risks of an obscure life so that a larger life could become possible later.",
    triggerEvent:
      "He had escaped from a place that owned him and arrived in a place that did not yet know him.",
    agencyState:
      "He was free, but free into nothing — no name he could say aloud, no trade he was allowed to work, no community, no certainty that the people he loved would still come.",
  },
  biographicalFacts:
    "Frederick Bailey escaped from slavery in Baltimore on September 3, 1838, by impersonating a free Black sailor with borrowed Seamen's Protection papers. He had never known his own birth date, and his mother, Harriet Bailey, had died when he was about seven. He arrived in New York City the next morning and stayed in the boarding house of David Ruggles, a free Black abolitionist whose Vigilance Committee aided fugitives. In his own account of those first days he was afraid to speak to anyone in the city, having been warned that there were men there who would betray a fugitive for money. Anna Murray, a free Black woman with whom he had been involved in Baltimore, joined him on September 11. They were married in Ruggles' parlor on September 15 by the Rev. James W. C. Pennington. Within the week they took a steamer to Newport, Rhode Island, then a stagecoach to New Bedford, Massachusetts, where Nathan Johnson — a Black businessman who received them — gave Frederick the surname Douglass, drawn from a character in Walter Scott's The Lady of the Lake. Frederick had been trained as a caulker, but the white caulkers refused to work alongside him, so he took unskilled day labor: sawing wood, shoveling coal, digging cellars, and loading and unloading vessels on the New Bedford wharves. He subscribed to William Lloyd Garrison's Liberator in 1839. Anna gave birth to Rosetta in June 1839 and Lewis Henry in October 1840; both children were born free. Frederick spoke as a lay preacher at the AME Zion church on Second Street. In August 1841 he attended an antislavery convention on Nantucket Island; William C. Coffin, who had heard him speak at the Black church, urged him to address the convention. He spoke extemporaneously for about fifteen minutes. William Lloyd Garrison rose immediately after and asked the assembly: \"Have we been listening to a thing, a piece of property, or a man?\" The crowd answered: \"A man! A man\" The Massachusetts Anti-Slavery Society engaged him as a paid lecturer the same evening. He was twenty-three years old.",
  sources: [
    "Douglass, Frederick. Narrative of the Life of Frederick Douglass, an American Slave (Boston: Anti-Slavery Office, 1845).",
    "Douglass, Frederick. My Bondage and My Freedom (New York: Miller, Orton & Mulligan, 1855), Chapters XX–XXIII.",
    "Douglass, Frederick. Life and Times of Frederick Douglass (Hartford: Park Publishing Co., 1881).",
    "McFeely, William S. Frederick Douglass (New York: W. W. Norton, 1991), Chapters 4–5.",
    "Blassingame, John W., ed. The Frederick Douglass Papers, Series One: Speeches, Debates, and Interviews (New Haven: Yale University Press, 1979–), Vol. 1.",
    "Nantucket Atheneum, \"The Abolitionist Movement\" (https://nantucketatheneum.org/the-abolitionist-movement/), account of the August 1841 antislavery convention, Garrison's question and the crowd's reply.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized rewrite. Documented: he got out of the place that held him, reached a city he had never seen the next morning, stayed in a stranger's house, knew no one and had no work waiting, and lost his mother when he was about seven. The count of four days is compression: he reached the city the day after he left and waited there about a week. Withheld for anonymity: how he got out and what he carried to do it, the widely retold borrowed-identity detail, and the familiar published line about not knowing his own age. The dispossession is carried by plainer documented facts.",
      text: `There was a young man. Four days ago he had gotten out of a place where nothing in his life had been his to decide.

He had not picked his name. He had not picked the work he did. He had not picked where he slept. None of it had ever been up to him.

Now he was in a city he had never seen, in a room that did not belong to him. He was four days from the only world he had ever known.

He did not know a single person here. He had no work waiting for him. His mother had died when he was small.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: men hunted escaped people in northern cities, he was warned to trust no one and was afraid to speak to anyone, and he had written to the woman he loved before he left. The light on the floor and the images of him waiting for her are dramatized texture.",
      text: `He stayed inside. When he did go out, he was afraid to talk to anyone.

He had heard that men came looking for people like him in this city. He had heard they sometimes got what they came for. He didn't know who would help him and who would turn him in.

He had written to the woman he loved before he left. He didn't know if the letter had reached her. He didn't know if she could even come. She still lived in the place he had run from. Anyone could stop her on the road.

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
        "Documented: she made the journey and joined him, they married, they went on to a town neither of them knew, the last name he used there was given to him rather than chosen by him, his training in a trade, being shut out of that trade, and the day labor he took instead. Withheld for anonymity: how soon after her arrival the wedding was and whose house it was in, the boat, the trade itself, and any reason for the new name. The name change stays in the beat as something done to him, not as a way to cover his tracks.",
      text: `She came.

She had made the trip too. No one had stopped her. They were married soon after.

Then they left the city and went to a town neither of them had ever seen. The name he used there was not the one he was born with, and he had not chosen it either.

He had been trained in a trade. In the new town they would not let him work it. So he took whatever else there was. Sawing wood. Shoveling coal. Loading boats.

He had a wife. He had a town he did not know.

He had nothing else.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: the three-year stretch of small jobs, reading the reform press, speaking at the small church where he was a lay preacher, and two children born in those years who were born free. Withheld for anonymity: the name of the paper and of the church, and the phrase born free, which is kept as the plain fact that his children did not start where he started.",
      text: `Three years went by like that.

He worked the small jobs. He saved what he could. He read every paper he could get his hands on. He went to a small church where men like him met. Sometimes he stood up at the back of the room and said a few sentences about what had happened to him in the old place.

The people in that room knew exactly what he was talking about. They had lived it too.

The rest of the town had no idea. They had never asked.

He had two children in those years. Neither of them was born into what he had been born into.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the summer meeting far from home, the man from the small church who urged him to stand up, that he had nothing prepared, his first telling of his own life to a room of strangers who had not lived it, and the paid post offered that same evening. The beat carries no quotation. Withheld for anonymity: what the meeting was called and what it was for, the make-up of the room, the length of the speech, the well-known man who rose after him, the question he put to the crowd and the crowd's answer, the name of the man who had held him, and the travel the paid work involved.",
      text: `One summer he traveled a long way from home to a big meeting. The room was full of strangers. Almost none of them had lived what he had lived.

A man who had heard him at the small church asked him to stand up and say what had happened to him.

He had never done that in front of a room like this one. Not from his own mouth. Not about his own life.

He had kept most of it to himself for three years. Now he was going to hand it to people who did not know him.

He stood up anyway. He had nothing written down. He told them where he had come from. He told them what had been done to him there. He told them what those years had taken from him.

Then he sat down.

Before the night was over, he was offered work. Not one night of it. Steady work, and they would pay him for his time.

He said yes.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: he took the paid work and kept at it through the rest of that year and for years after, some places would not let him in, some meetings had to be held outside, and before this he had spoken only at the small church. Withheld for anonymity: that the work was travel from town to town, the halls and the circuit, the length of the speaking life that followed, and everything that came after this episode. Still anonymous; he is never named in this beat.",
      text: `He said yes, and then he had to do it.

He spent the rest of that year saying it out loud to people who did not know him. Some places would not let him in the door. Some nights there was no room to be had at all, and the meeting happened outside.

He kept going.

For three years he had told it only in that small church, to people who already knew it. Now he told it to people who had never asked. Faces he had never seen. Rooms that did not always want him there.

It was the same story he had carried since he was a boy. Now strangers sat still and listened to it.

He kept telling it. Not for a season. Year after year.

He had started with none of this. A room that was not his. A name that was not his. Four days between him and everything he had ever known.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Frederick Douglass.

He became one of the most important voices in American history. He had escaped from slavery as a young man. He spent the rest of his life fighting to end it, and then fighting for everyone the country still wouldn't make room for. His books are still read. His words are still quoted. None of that had happened yet on the morning we just sat with him.

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
      "She had finished a third novel after two unsold ones, and was sending it out to publishers while working low-wage jobs and writing before dawn.",
    agencyState:
      "She had control over the morning hour and almost nothing else; the morning hour had produced two small story sales years earlier and nothing since.",
  },
  biographicalFacts:
    "Octavia Estelle Butler was born June 22, 1947 in Pasadena, California, the only child of Octavia Margaret Guy, a housemaid, and Laurice James Butler, a shoeshiner who died when she was a small child (accounts give her age as three or as seven). She began writing fiction at ten and resolved to take it seriously at twelve after seeing the film Devil Girl from Mars. She attended Pasadena City College and California State University, Los Angeles, and in 1970 — at twenty-three — used her savings from menial work to attend the Clarion Science Fiction Writers Workshop in Pennsylvania, where she met Harlan Ellison and Samuel R. Delany. From 1971 to 1975 she lived with her mother in Pasadena and supported her writing by working a series of low-wage jobs: potato chip inspector, telemarketer, food deliverer, dishwasher. She wrote daily before her shifts began, often at two or three in the morning. Her first published story, \"Crossover,\" appeared in the Clarion 1971 anthology; \"Childfinder\" was bought by Harlan Ellison in 1972 for The Last Dangerous Visions (an anthology Ellison did not publish in his lifetime). Those two sales were the only fiction sales she made for several years afterward. Two novel manuscripts written in this period went unsold. In 1975 she completed a third manuscript, Patternmaster; Sharon Jarvis at Doubleday bought it for an advance of $1,750. Patternmaster was published in July 1976, the first of an eventually four-book Patternist series. Mind of My Mind followed in 1977, Survivor in 1978, and Kindred in 1979. Around this time she was able to stop taking temporary jobs and write full time; sources give the year as 1978 or 1979. She received a MacArthur Fellowship in 1995, the first science fiction writer to do so. The journals and commonplace books in which she repeatedly wrote affirmations such as \"I shall be a bestselling writer\" are now held in the Octavia E. Butler Papers at the Huntington Library, San Marino, California.",
  sources: [
    "Butler, Octavia E. Bloodchild and Other Stories (New York: Seven Stories Press, 2005), especially the essay \"Positive Obsession.\"",
    "Canavan, Gerry. Octavia E. Butler (Modern Masters of Science Fiction series; Urbana: University of Illinois Press, 2016).",
    "The Octavia E. Butler Papers, Huntington Library, San Marino, CA — particularly the commonplace books and 1970s correspondence.",
    "McCaffery, Larry, ed. Across the Wounded Galaxies: Interviews with Contemporary American Science Fiction Writers (Urbana: University of Illinois Press, 1990), interview with Butler.",
    "Francis, Consuela, ed. Conversations with Octavia Butler (Jackson: University Press of Mississippi, 2010).",
    "MacArthur Foundation, MacArthur Fellows Program, Class of 1995: Octavia E. Butler (macfound.org).",
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
        "Documented: two finished novel manuscripts that did not sell, two short-story sales years earlier and nothing after them, the string of low-wage jobs, and writing at two or three in the morning before her shifts. Dramatized: the rejection letters summarize years of submissions rather than one dated batch, and opening them on a single morning is compression.",
      text: `She opened the letters one morning before work.

They all said more or less the same thing. We liked your writing. We don't think anyone would buy this. Try someone else.

She had finished two whole books by then. Neither had sold. She was halfway through a third.

Two of her short stories had sold years before. Two. Since then, nothing. She had started to wonder if those two had been luck.

She was getting up at two in the morning to write. Then she went to work. Then she came home. Then she did it again.

That night she sat at the kitchen table and looked at the stack of pages.

She had been getting up before the sun for fifteen years. She had nothing to show for it.

She didn't know if any of it had mattered.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Her habit of writing notes-to-self about the writing life she intended to have is documented across the commonplace books in her papers at the Huntington Library. The best-known of those notes dates from later in her career, so placing one in this period is inference, not a dated fact. The corner store, the pack of paper and the capital letters are dramatized texture.",
      text: `She kept writing.

The next morning she walked to the corner store, bought another pack of paper, walked home, and sat back down at the table.

A few weeks later she opened a notebook. She wrote down the kind of life she wanted to have one day, in big capital letters. The words were more hopeful than she felt.

She didn't need to believe it. She just needed to be the kind of person who would write it down.

She kept the job. She kept the morning. She kept opening the letters when she had room in her head for them.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: a third completed novel sent out to publishers, the string of low-wage jobs, writing before dawn, and starting the next book before the last one had sold. Dramatized: the length of the wait, the change of job, and her day-to-day state of mind are compression — no dated milestone is claimed.",
      text: `She finished the third book.

She made copies. She paid for the postage out of money she did not really have. She sent it out and started another one.

Then she waited.

Months went by. One job ended and she found another. She kept getting up at two in the morning. She kept putting words down before anyone else was awake.

Nothing came back.

Some days she thought she was building something. Some days she thought she was just a woman who could not stop doing a thing that didn't work.

The new book wasn't very good yet. She kept writing it anyway.

The morning didn't owe her anything. It just had to be hers.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: a publisher bought her third novel in 1975 and paid her an advance, and her only earlier income from fiction was two story sales years before. The afternoon, the wording of the call, standing by the stove and writing the day down that night are dramatized texture. No sum of money is named to the reader.",
      text: `The phone rang one afternoon.

It was someone calling about her book. They said they wanted to publish it. They said how much they could pay her.

It was not a lot of money. It was more than anyone had ever paid her for anything she had written. Two short stories had sold years before. Then nothing, for a long time. This was a whole book.

She didn't cry. She didn't sit down. She finished the call politely and hung up.

Then she walked into the kitchen and stood by the stove for a long time.

Fifteen years of getting up before the sun, and someone had finally said yes.

That night she went back to the kitchen table. She wrote down what had happened, in plain words, the way she had written down everything else.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the novel came out the following year and three more followed by the end of the decade (Mind of My Mind, Survivor, Kindred), and she was able to stop taking temporary jobs around 1978-79. Sources disagree on the exact year, so the beat says only \"a few years later\". Wide readership and the major awards came years after this episode. Still anonymous - she is never named here.",
      text: `The book came out the next year.

It didn't make her rich. It didn't make her famous. It made her, for the first time in her life, a person with a book out in the world.

She wrote another one. And another one. And one after that.

A few years later she stopped taking shifts. She wrote full-time. The morning hour didn't change. The kitchen table didn't change. She just no longer needed a second job to pay for the first one.

The thing she had wanted since she was a kid had taken her until almost thirty to turn into a book. It would take many more years before a lot of people read her.

She didn't know that yet. It wouldn't have changed what she did the next morning anyway.

She kept writing.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Octavia E. Butler.

She became one of the most important science fiction writers of the last hundred years. She was the first Black woman to become widely known in science fiction. She was the first science fiction writer to win a MacArthur Fellowship. People read her books in classrooms now. None of that had happened yet on the morning we just sat with her.

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
    "She went back to a medical examiner she had known since she was young, a friend of the brother she had just buried, and offered to pay for the academic field he had spent his life building from the edges of.",
    "She asked that the new chair and the new library carry his name rather than hers, so that the work would be the thing that was named.",
  ],
  facets: {
    emotionalCore:
      "She felt the late weight of decades spent inside someone else's idea of her life, and the strange pressure of finally having the means to escape it without yet knowing how.",
    decisionShape:
      "Whether to keep living the private domestic life her family had laid out for her, or to spend the inheritance on the field she had wanted to enter since she was a girl and had been refused.",
    triggerEvent:
      "Her brother died and left her enough money that the constraints which had governed her for fifty years no longer had any practical hold on her time or her movements.",
    agencyState:
      "She had means and time for the first time in her life, and decades of conditioning that told her she had no right to use them on what she actually wanted.",
  },
  biographicalFacts:
    "Frances Glessner Lee was born March 25, 1878 in Chicago, the daughter of John Jacob Glessner — a founder of the farm-machinery firm Warder, Bushnell & Glessner, which became part of International Harvester in 1902 — and Frances Macbeth Glessner. She and her older brother, George Macbeth Glessner (born October 2, 1871), were educated at home in the Prairie Avenue house their father commissioned from H. H. Richardson. She wanted to study law or medicine; her parents refused to let her go to college, her father telling her that a woman's place is in the home. Her brother went to Harvard, graduating in 1893, and through him she met his classmate George Burgess Magrath, later Suffolk County Medical Examiner in Boston and the person through whom she first learned about legal medicine. In 1898, at twenty, she married the Chicago lawyer Blewett Lee; they had three children and divorced in 1914. George caught influenza while abroad and died in January 1929, leaving her a large inheritance; both her parents were still alive — her mother died October 19, 1932 and her father January 20, 1936, leaving her more. From 1929 she renewed her contact with Magrath, attending autopsies and crime scenes with him, reading case files and state death-investigation law, and collecting books. In 1931, roughly two years after her brother's death, she endowed a chair and helped establish the Department of Legal Medicine at Harvard Medical School — the first such department in the United States — with Magrath as the chair's first holder. The chair, and the book collection she gave in 1934 that became the George Burgess Magrath Library of Legal Medicine, were named for Magrath and not for her; Harvard did not designate the chair the Frances Glessner Lee Professorship until 1945, and disbanded the department in 1967. Beginning around 1940 she designed and built the Nutshell Studies of Unexplained Death — close to twenty miniature dollhouse-scale death scenes, with working lights, used to train investigators in observation, built in her workshop at her summer estate, The Rocks, in Bethlehem, New Hampshire. Nineteen survive; eighteen are still used in homicide-investigator seminars and are held by the Maryland Office of the Chief Medical Examiner. In 1943 the New Hampshire State Police made her a captain, the first woman in the United States to hold that rank in a state police force; sources disagree over whether the post was honorary, and the superintendent who appointed her said it was not. She died January 27, 1962, age eighty-three.",
  sources: [
    "Goldfarb, Bruce. 18 Tiny Deaths: The Untold Story of Frances Glessner Lee and the Invention of Modern Forensics (Naperville: Sourcebooks, 2020).",
    "Botz, Corinne May. The Nutshell Studies of Unexplained Death (New York: Monacelli Press, 2004).",
    "The Frances Glessner Lee Papers, Harvard Medical School / Center for the History of Medicine, Boston.",
    "Glessner House Museum, Chicago — the Glessner Family page and house archives, for Prairie Avenue and for the family birth and death dates.",
    "Countway Library of Medicine, Harvard — Corpus Delicti: The Doctor as Detective, online exhibit section An Endowment for Legal Medicine, for the 1931 chair, the Magrath library and endowment, and the 1945 renaming.",
    "Harvard Magazine, Frances Glessner Lee — Magrath as her brother's college classmate and the 1931 department.",
    "Smithsonian American Art Museum, Murder Is Her Hobby: Frances Glessner Lee and The Nutshell Studies of Unexplained Death (Renwick Gallery, 2017-2018) — nineteen surviving studies, eighteen still in training use.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Documented: her older brother died in January 1929 and left her a large inheritance; her parents refused to let her go to college while he went to university; she married at twenty and divorced sixteen years later; three children; the family's city house and the summer estate. Dramatized: sitting at his desk.",
      text: `There was a woman in her early fifties.

She was sitting at her brother's desk. He had died a few weeks earlier, and the desk belonged to her now. So did a lot of the family's money.

When they were kids, her brother had been allowed to do the things she wasn't. He had gone to the school she wanted to go to. He had picked his own life.

She had been told to be a wife. So she had been a wife. She was married for sixteen years. She had been divorced for fifteen. She had three grown children. She had a big house and a place in the country, and furniture she hadn't picked out.

Since she was a girl, she had wanted to study one thing.

She had never been allowed to.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: her father refused to let her go to college while her brother went to university, telling her a woman's place is in the home; she married at twenty and divorced in her thirties; her brother's friend, a medical examiner, had known her since she was young and was her way into the field. Dramatized: the letter, the drawer, and sitting still at the desk. Note: both her parents were in fact still living in 1929.",
      text: `There was a letter on her desk she could not bring herself to answer.

It was from a friend of her brother's. A man who had spent his whole career quietly building the field she had wanted to study her whole life. She had known him since she was young.

She put the letter in a drawer.

She sat at the desk and did not move.

When she was a girl, she had asked to go to school like her brother. Her father said no. He said a woman's place was at home. She had not argued.

When she was twenty, she married, because that was the life laid out for her. She had not argued then either.

She had only broken from the plan once. That was the divorce, in her thirties.

Fifty years of being told what she could and could not have. The money was hers now. Nobody had to say yes to her anymore.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: from 1929 she renewed contact with him, went with him to autopsies and crime scenes, read case files and state death-investigation law, collected books, and approached his medical school offering to fund the field. Dramatized: the shape of a single visit and the questions; roughly two years of reading and negotiation are compressed here.",
      text: `She wrote back to him.

Then she went to see him. She watched him work. She stood in rooms most people are never allowed into and looked at what he looked at. She asked questions. He answered all of them.

She was fifty-one years old and nobody had ever explained any of this to her before.

She started reading everything she could find. Case files. The laws about how deaths get investigated, state by state. She collected books.

Then she wrote to the school where he taught. She offered to pay for something that did not exist yet — a place where this work would be taught.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: about two years passed between her brother's death and the 1931 endowment; she specified a department and asked that the chair be created in her brother's friend's name rather than her own, and he was its first holder. Dramatized: the school's hesitation itself, the wording of its replies and the tone of the meetings — no account of the negotiation survives, and the two-year delay is the only documented part. Withheld from the beat text for anonymity (rubric G): that this was the first department of its kind in the United States, stated in that form; the beat now says only that the school had nothing like it.",
      text: `The school did not say yes.

They did not say no either. They thanked her. They said they would think about it. They suggested other things she might like to pay for instead, things that already existed and already had people in charge of them.

It took two years.

She kept writing. She kept coming back. She set out exactly what she wanted. A department. The school had nothing like it. Her brother's friend at the head of it. His name on it, not hers.

The men she was dealing with were polite. They were also in no hurry. She was a woman in her fifties with no degree, offering to build a field she had never been allowed to study.

She did not raise her voice. She just did not go away.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the department was established in 1931, the first in the country; the chair carried her brother's friend's name and not hers, and Harvard did not attach her name to it until 1945; she was in her early fifties; her father had refused her college on the grounds that a woman's place is in the home. Dramatized: what she thought about in the moment. Withheld from the beat text for anonymity (rubric G): the landmark-first framing, which this note keeps on record; the beat now says only that the department was going to exist. Also softened: her request that the chair carry her brother's friend's name is documented in Goldfarb but is not carried by biographicalFacts, so the beat now states only what the naming shows.",
      text: `They said yes.

There was going to be a department. It would teach the thing she had wanted to learn as a girl, to people who would spend their working lives doing it.

The chair went to her brother's friend. His name was on it. Hers was not on anything.

She was past fifty.

She thought about being a girl and being told she would not be going to school. That a woman's place was at home. Nobody in the room had argued with that. She hadn't either. She had gone away and been the wife and the daughter she was supposed to be, for more than thirty years.

And now there was a room in a school where that work would be taught. Taught to people who would carry it out into the world.

She had paid for it herself.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the department ran until 1967; the book collection she gave became its library, named for her brother's friend, as the chair was; from about 1940 she built close to twenty miniature death scenes with working lights, nineteen of which survive and eighteen of which are still used in homicide-investigator seminars; in 1943, at sixty-five, the New Hampshire State Police made her a captain, the first woman in the United States to hold that rank in a state police force (whether the post was honorary is disputed). Dramatized: nothing beyond compression. Withheld from the beat text for anonymity (rubric G): what the miniatures depict, how many she built, who is trained on them, her rank, and the wording of the first. The beat keeps the building, the exactness, the teaching and the fact that the people who did that work took her in.",
      text: `The department she paid for lasted more than thirty years. It trained the people who would go on to do the work she had wanted to do as a girl. She gave it her books, too, and they became its library. The library had his name on it. So did the chair. That was how she wanted it.

Years later, in her sixties, she started building things with her own hands. Tiny rooms, built from scratch, every detail exact, down to lights that really turned on. She used them to teach people how to look. Not how to guess. How to see what was actually in the room before deciding what had happened.

People are still taught that way.

Later, the people who did that work for a living made her one of their own. No woman before her had been given that.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Frances Glessner Lee.

She is called the mother of forensic science. She paid for the first department of its kind in the country and gave it its library. She built the models that investigators are still trained on. She did all of this in her fifties and sixties, after spending the first half of her life being told she couldn't.

Your life is not theirs. But a piece of this story may still sit beside you.

She had been waiting a very long time. The years she lost were really lost. Nobody gave them back to her. The room at the school, when it finally existed, did not ask her to be younger than she was. It only needed her to start.

You don't have to be early. You just have to begin.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born March 20 1928, Latrobe PA; only child until a sister, Elaine, was adopted
//    when he was 11; severe asthma + frequent childhood illness; overweight, shy; bullied —
//    peers called him "fat Freddy" and boys followed him home from school; played alone with
//    hand puppets and at the piano from age five; maternal grandfather Fred Brooks McFeely was
//    his namesake and the one steady counter-voice, and the source of the sentiment behind "I
//    like you just the way you are"; became Mister Rogers (Mister Rogers' Neighborhood,
//    national broadcast Feb 1968 - Aug 2001); testified May 1969 before Sen. Pastore's
//    subcommittee and public-TV funding was preserved. (King, The Good Neighbor; Junod,
//    Esquire 1998; Rogers' 1995 Saint Vincent College address.)
//  Interpretive: framing the loneliness/sensitivity as the seedbed of his life's work; "he
//    decided the problem was him"; the grandfather as the one counter-voice. Emotional reading.
//  Unverified: the grandfather's exact wording varies across retellings ("you make my day
//    special" / "you made this day a special day"), so the beats render him in indirect speech
//    and never quote him; the eleven-block walk and the six-minute testimony come from King and
//    are not repeated as numbers in any beat.
//  Avoid saying: don't name the show / puppets-on-TV / cardigan / the children he spoke to,
//    before the bridge (naming any of them kills the reveal). Blind readers have now named him
//    three times, so beats 0-5 also withhold the character voices (the boyhood puppets survive only
//    as "people he made up"), music and the piano entirely, that he was a heavy child, the
//    taunt about his weight, the mill-town texture of the walk home, and who his life's work
//    was for (those people are described only by what they were living through). Every echo of
//    his signature sentence is out: the grandfather's gift is given only in the negative (he
//    never told the boy to toughen up), and no beat says anyone was glad you came or that he
//    was enough as he was. Also out: his trademark slowness, and telling anyone they matter.
//    Don't put the grandfather's words in quotation marks in a beat; don't make the childhood a
//    tidy origin myth; the loneliness is this episode, not his whole life (he had friends and
//    love later).
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
  biographicalFacts: `Fred McFeely Rogers was born March 20, 1928, in Latrobe, Pennsylvania, the only child of James Hillis Rogers, president of the McFeely Brick Company, and Nancy McFeely Rogers; a sister, Elaine, was adopted when Fred was eleven. He was an overweight, shy, and frequently ill child who suffered from severe asthma, scarlet fever, and a string of other childhood diseases that often kept him indoors and alone. He had few friends and was bullied; he later recalled a group of boys following him the eleven blocks home from school, shouting "Freddy, hey fat Freddy! We're going to get you, Freddy!" Told by adults to act as though it did not bother him, he did — while privately concluding that the fault was his own. He spent long stretches alone, inventing characters and stories with hand puppets and expressing what he could not say at the piano. His maternal grandfather, Fred Brooks McFeely, was a decisive presence: he told the boy that he made the day special simply by being himself, a sentiment Rogers later distilled into the phrase "I like you just the way you are." Rogers graduated from Latrobe High School, studied music at Rollins College, and was ordained a Presbyterian minister; he remained shy and unusually sensitive throughout his adult life. In 1968 he launched Mister Rogers' Neighborhood, which ran for more than thirty years; he used television to speak slowly and honestly to children about fear, anger, loneliness, and worth. In 1969 his six-minute testimony before a U.S. Senate subcommittee preserved federal funding for public broadcasting. He died of stomach cancer on February 27, 2003.`,
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
        "Anonymized. Frequent illness that kept him indoors, only child, shy, and long hours alone inventing characters and stories are all documented. Withheld for anonymity: that the invented characters were hand puppets given separate voices, that music was his outlet, and that he was a heavy child — a blind reader named him from that combination of details. The room as his one private world is editorial texture.",
      text: `There was a boy. He was about nine.

He got sick a lot. Bad enough that he had to stay inside while the other kids were out playing. He was shy, and he was an only child. The house was usually quiet.

He spent most of his time alone in his room. He had built a little world up there. People he made up. Long stories that nobody else ever heard. He could keep it going all afternoon.

It wasn't that he didn't want friends. He just didn't seem to have any.

The room was the one place that was all his. He was fine in there. It was everywhere else that was hard.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The walk home and the boys shouting that they were going to get him are his own account, as is being told by grown-ups to act as though it did not bother him and his private conclusion that the fault was his. Nothing is quoted directly. Withheld for anonymity: the taunt itself, which is the most retold version of this story, and the mill-town texture of the walk, which dates and places him.",
      text: `School was the hard part.

There was a group of boys who had decided he was theirs to chase. When the last bell rang, he would come outside and they would already be waiting.

He had a long way to walk home. They followed him most of it. Shouting. Telling him they were going to get him. Telling him everything that was wrong with him.

He didn't fight back. He didn't know how. He kept walking and listened to them behind him.

He asked some grown-ups about it once. He wanted to know what he was supposed to do. They told him to act like it didn't bother him. So that is what he did. He walked home every day and acted like it was fine.

It was not fine. Somewhere in there he had decided that the problem was him. Not them. Him.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His grandfather as the one steady counter-voice is documented, and so is the substance of it: the old man wanted the boy's company and never asked him to be anything other than what he was. Withheld for anonymity: every positive form of that sentiment. A blind reader recognized being glad you came and being enough as you are as the seed of the line he later became known for, so here the old man's gift is given only in the negative — he never told the boy to toughen up. Nothing of his is quoted, and no invitation or other recurring gesture is attributed to him.",
      text: `There was one person who made it different.

His grandfather. An old man who lived nearby, and who wanted the boy around.

That was the whole of it, and it was a lot. The boy went over there often. When he was there, the old man talked to him like he was worth talking to. He never told him to toughen up. He never told him to stop being the way he was.

Nobody else did that. Other people meant well and still wanted him a little different.

The boy did not have many people. He had that one. He held on hard.

Then he went home, up the stairs, back to his room. He took it with him.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: his lifelong shyness, his unusual sensitivity, and the long stretches alone. Withheld for anonymity: music, which a blind reader named as one of the tells — the making-things-up survives without it. Interpretive: that he long read the sensitivity as a weakness to hide, and that knowing loneliness from the inside turned out to be useful. That is the editorial through-line, not a claim he made in these words.",
      text: `He grew up slowly, and a lot of it was lonely.

He stayed shy. He stayed the kind of person who felt things hard. Something small could sit on him all week while everyone else shrugged it off. For a long time he was sure that was the flaw. The thing to keep hidden.

He still made things up. He still spent hours by himself, the way he always had.

And slowly he started to notice something. All those years of feeling too much had taught him something most people never learn. He knew from the inside what it is like to be small, and scared, and certain that nobody likes you. He knew what a person needs in that state, because he had needed it.

He didn't know yet what it was for. He just knew it was true.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: as a young man he judged the way grown-ups spoke to the people he went on to work with — loud, demeaning, never about anything that actually frightened them — and deliberately did the opposite. His shyness persisted all his life. Interpretive: the line this beat draws between that way of talking and the grown-ups who told him as a boy to act as though the bullying did not bother him — the advice is documented, the connection is editorial. Withheld for anonymity: who those people were, the medium, its scale, his trademark slowness, and the sentence he became known for. A blind reader named him from the audience alone, so they are described here by what they were living through rather than by who they were.",
      text: `Years later, as a young man, he found his work.

The work put him beside people who were frightened of things nobody would talk to them about. People who got talked at, loudly, and were never told the truth about anything that mattered.

He knew that way of talking. He had been on the receiving end of it as a boy. Act like it doesn't bother you. Don't say the hard thing out loud.

He decided to do the opposite. He was still shy. He did it anyway.

He would say the hard things out loud and stay in the room afterward. Being scared. Being angry. Being lonely. Feeling like nobody likes you and having no way to say so.

And he would do for them what the old man had done for him. He would take them seriously. He would stay.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Decades of the same work, the trust it earned, and the accounts of people who described feeling wholly seen and safe in his presence are documented, as are his lifelong shyness and sensitivity. Withheld for anonymity: the wording of the message he became known for, who the work was for, and its scale — a blind reader recognized all three. The reach of it is left for the bridge, which is where he is named.",
      text: `He did that for the rest of his life.

Day after day, year after year, the same quiet work. He said the frightening things out loud instead of talking around them. He never told anyone a thing was small when it wasn't.

He stayed shy his whole life. He stayed the kind of person who felt everything. He had just stopped treating that as a defect.

People trusted him. They could tell he was not performing. The ones who spent real time with him said the same thing afterward. That he had looked at them and actually seen them. And that nothing bad happened when he did.

The lonely boy who was sure he had no friends spent his working life beside people who felt the way he had felt. He gave them what he had needed and never got.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Fred Rogers.

For more than thirty years he made a television show for children. It was just him, talking quietly, with a few hand puppets and a cardigan and a pair of sneakers. He told a whole country of kids that they were liked just the way they were. When people in government wanted to cut the money that paid for it, he went and spoke to them, and they changed their minds. None of that had happened yet on the afternoon we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

The boy who became that man spent his childhood sick, alone, and chased home from school. He thought his soft heart was the thing that was wrong with him. It turned out to be the thing people needed most from him.

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
//    bridge (height + Paris + cooking = instant ID). The beats also keep the trigger generic —
//    "someone else's work, done seriously" rather than a restaurant lunch abroad — hold the
//    collaborator count and the nation-scale teaching claims back for the bridge, and never say
//    "back home"; the meal itself survives only in the facets, the shape sentences and
//    biographicalFacts, which the reader never sees. A blind reader still named her from beats
//    0-5 on 2026-08-27, so four more tells came out: don't say "the war" (useful work far from
//    home is enough), don't describe the teaching as something strangers watch or follow along
//    with (that is the show in all but the word), don't give her exact age at publication
//    ("well past forty", not "nearly fifty"), and don't use the "if she could do it, so could
//    anybody" formula. Don't frame her as a failure — she was
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
  biographicalFacts: `Julia Carolyn McWilliams was born August 15, 1912, in Pasadena, California, into a wealthy family. She graduated from Smith College in 1934 and drifted through her twenties and early thirties with no clear direction — writing advertising copy for the W. & J. Sloane furniture company in New York, returning to California, finding nothing that felt like a vocation. After the United States entered World War II she joined the Office of Strategic Services (the wartime forerunner of the CIA), too tall at 6'2" for the women's military branches; she was posted to Ceylon and China, where she met Paul Child, a cultured OSS officer. They married in 1946. In 1948 Paul was posted to Paris, and there, at age thirty-six, Julia ate a lunch of oysters, sole meuniere, and wine at La Couronne in Rouen that she later called "an opening up of the soul and spirit." French food was the first thing that fully gripped her. She enrolled at Le Cordon Bleu in 1949, earned her diploma in 1951, and spent roughly a decade testing and writing recipes with Simone Beck and Louisette Bertholle. The huge manuscript was rejected by Houghton Mifflin, whose editors found it too much like an encyclopedia and too formidable for American home cooks; Alfred A. Knopf published Mastering the Art of French Cooking in 1961, when she was forty-nine. Her television program, The French Chef, began in 1963 and made her the most influential cook in America. She died August 13, 2004.`,
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
        "Anonymized. Privileged upbringing, good schooling, post-college drift through advertising and odd jobs, several years of useful work far from home where she met her husband — all documented. The beat withholds that the work was wartime service, which pins the era and narrows the person. Her being funny and liked at parties is characterization from the biographies, not a documented scene. The lack of a vocation is the through-line.",
      text: `There was a woman in her thirties.

By every outside measure her life was fine. She came from money. She had gone to a good school. She was funny, and people liked her at parties.

But she had reached her mid-thirties without ever finding the thing she was for.

She had tried. After school she took a job writing ads. It didn't take. She drifted home, then drifted somewhere else. For a few years she did useful work far from home, and met the man she married. But when that work ended, the old question came back.

What was she going to do with her life?

She was well into her thirties, and she still didn't know. Most people her age had stopped asking a long time ago.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Move abroad for husband's posting, days suddenly unstructured, trying classes that didn't catch — documented. The fear that some people simply never find a calling is a fair reading of her own later accounts of feeling adrift.",
      text: `She and her husband moved to another country for his work.

Now she had time on her hands. A whole foreign country to herself and nothing she had to do in it.

That was the hard part. Before, being busy had hidden the problem. Here, with the days wide open, she could see it plainly. She was a grown woman with a good mind and a strong back and no idea what to point them at.

She tried things. A class here. A club there. A course in the language. Nothing caught. She came home from each one a little emptier than before.

She watched her husband, who loved his work, who lit up when he talked about it. She didn't have that. She never had. She began to wonder if some people just never got it. Maybe she was one of them. Maybe she would pass through a pleasant life without ever once feeling on fire about anything.

She was nearly forty. The question felt closed.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "At thirty-six she was cracked open by other people's craft work done with complete seriousness, and she enrolled soon after as a beginner among much younger students. Both are documented. The setting and the craft are left generic here to protect the bridge reveal; the specific meal stays in the facets, the shape sentences and biographicalFacts, none of which the reader ever sees.",
      text: `Then one afternoon she ran into someone else's work.

She hadn't gone looking for it. It was just there in front of her, done by people who took it completely seriously. It was so good, and so carefully made, that something in her went still and then woke up.

She couldn't stop thinking about it. For the first time in her life, here was a thing she wanted to understand all the way down.

So she did a small, almost embarrassing thing for a woman her age. She signed up to learn it. As a beginner. In a room full of people much younger than her.

She didn't tell herself it would amount to anything. She just couldn't stay away from it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of practice and obsessive recipe-testing, the decade-long collaborative book project, and the first publisher's rejection of the book as too encyclopedic for American home cooks are all documented. The number of collaborators and the country she was writing for are withheld to protect the bridge reveal.",
      text: `What followed was not glamorous and not quick.

She practiced for hours. She made the same things over and over, getting them wrong, until her arms ached. She filled notebooks. She tested everything. She threw out whatever failed and started again.

She decided to write it all down. Everything she had learned, in order, so an ordinary person could follow it. That turned into a project that swallowed years. Nearly a decade. She and the friends working with her wrote, and rewrote, and tested, and argued over tiny details no one else would ever notice.

A publisher looked at all those pages and said no. It was too long, too strange, too much.

She was in her forties now. She had poured the better part of a decade into something no one had bought.

She kept going.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "A second publisher (Knopf) accepted the book; it sold and spread by word of mouth. Publication came in 1961, when she was forty-nine on the widely cited October date — the month is not independently confirmed. Her sense of finally having direction is a fair reading. The country she was writing for is left unnamed, and the beat now gives only \"well past forty\" instead of her exact age at publication, to protect the bridge reveal.",
      text: `Then another publisher said yes.

They believed in the strange, enormous book she and her friends had built. They printed it.

And it worked. People bought it. Then more people. Word spread from one home to the next. It turned out there were thousands of ordinary people who had wanted exactly this and never had it. They wanted someone patient enough to show them how, step by step. Someone certain they could do it too.

She was well past forty when it came out. The thing she had been missing her whole life had taken until middle age just to begin.

It did not matter to her at all. She had found it. For the first time, when she woke in the morning, she knew exactly what she was for.

After a lifetime of drifting, the drifting was over.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The teaching work began when a cancelled guest led to an unplanned cooking demonstration on a local station; it drew a strong response and produced a pilot and then a series. Her unpolished joyful manner, her openness about her late start and her work into her eighties are documented. Name, height, craft and medium are all withheld for the bridge, so the beat says only that she taught it out loud in front of others; the broadcast framing, her remembered if-I-can-do-it-so-can-you formula and the nation-scale claims are all held back for the bridge.",
      text: `She did not slow down after that. She sped up.

Then people asked her to teach it out loud, in front of others. She was loud, and joyful, and not remotely smooth. That turned out to be exactly why people trusted her. She got things wrong and laughed and kept right on going. What she wanted people to see was simple. She had been a beginner too.

She never pretended it came easily. She never hid how long it had taken her to begin. And the appetite never let up. She kept starting new things. New books. New students. She was still at it in her eighties.

The woman who had spent half her life sure she had no calling spent the rest of it on fire with one.

She just got a late start. That was all.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Julia Child.

She taught America how to cook. The huge French cookbook she spent a decade on is still in kitchens everywhere. Her television show made her one of the most loved people in the country. She didn't learn to cook until she was almost forty. She didn't publish that book until she was forty-nine. She wasn't famous until her fifties.

Your life is not theirs. But a piece of this story may still sit beside you.

For the whole first half of her life, she thought maybe she just wasn't built for a calling. Some people get one and some people don't. She thought she was one of the ones who don't. She was wrong. It hadn't passed her by. It simply hadn't started yet.

You don't have to have found it yet. She hadn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born 29 Nov 1898 Belfast; mother died of cancer when he was 9; atheist as a
//    teenager, Christian again at 32; famous novelist + popular-theology writer, incl. a 1940
//    book giving a reasoned account of why a good God allows suffering; answered readers' letters
//    for decades, many of them from people in distress; unmarried until 57; married Joy Davidman
//    (civil 23 Apr 1956, then a Christian bedside ceremony 21 Mar 1957 after her Oct 1956
//    diagnosis of breast cancer that had spread to her bones); remission, then recurrence
//    Oct 1959; she died 13 July 1960 (he was 61); kept four notebooks of raw grief/doubt;
//    published them 1961 as "N. W. Clerk," titled A Grief Observed, calling her only "H."; he
//    died 22 Nov 1963. (A Grief Observed; Collected Letters; Sayer, Jack; McGrath, C. S.
//    Lewis - A Life.)
//  Interpretive: "grief felt like fear" is his own; framing his faith as returning "smaller,
//    quieter" is a fair reading of the book's arc. The turn is internal (grief as a process that
//    moves), not a decision - this is a single-fork-style integrity shape.
//  Avoid saying: don't name Narnia / Christianity / the titles / his name before the bridge.
//    Beats 0-5 must also not describe either book in all but its title - no "a book about how to
//    bear suffering", no "pressed into the hands of grieving people". Those two sentences alone
//    let a stranger name him, and the reveal is the whole point. Don't tidy the faith into a
//    triumphant restoration - the honest record is a partial, humbled recovery, not a neat happy
//    ending. Don't sentimentalize the marriage.
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
  biographicalFacts: `Clive Staples Lewis was born November 29, 1898, in Belfast, Ireland. His mother died of cancer when he was nine, a loss that shadowed his early life; he became an atheist as a teenager and a Christian again at thirty-two, going on to be one of the most widely read religious writers and novelists of the twentieth century — including a famous series of children's fantasy novels and works of popular theology, among them a 1940 book offering a reasoned account of why a good God permits suffering. For decades he answered a very large volume of letters from readers, many of them from people in distress writing to him for help; his replies were later collected and published. He was unmarried until he was fifty-seven. On April 23, 1956 he married Joy Davidman, an American writer, in a civil ceremony; she was diagnosed in October 1956 with breast cancer that had spread to her bones, and on March 21, 1957 they were married again in a Christian ceremony at her hospital bedside. Her cancer then went into remission and they had a few happy years; it returned in October 1959. She died on July 13, 1960; Lewis was sixty-one. In the months after, he filled four handwritten notebooks with his raw grief and his anger and doubt toward God, recording among other things that grief did not feel as he had expected it to — it felt like fear — and that the faith he had argued for in print now looked to him like something that might have held only because nothing had tested it. He published the notebooks in 1961 under the pseudonym N. W. Clerk, titled A Grief Observed, referring to Joy only as "H." The book records a man whose lifelong faith was shaken to its foundations by a loss he could not reason away; the belief its later sections arrive back at is smaller and less certain than the one he had defended before. Lewis died on November 22, 1963.`,
  sources: [
    "Lewis, C. S. (as N. W. Clerk). A Grief Observed (London: Faber & Faber, 1961).",
    "Lewis, C. S. Surprised by Joy: The Shape of My Early Life (London: Geoffrey Bles, 1955).",
    "Lewis, C. S. The Collected Letters of C. S. Lewis, ed. Walter Hooper, 3 vols. (London: HarperCollins, 2000-2006).",
    "Sayer, George. Jack: A Life of C. S. Lewis (London: Hodder & Stoughton, 1988).",
    "McGrath, Alister. C. S. Lewis - A Life (Carol Stream, IL: Tyndale House, 2013).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Documented: he was unmarried until fifty-seven, then married a sharp, argumentative equal and was happy in the marriage. The rooms and the books are soft texture. This beat is the prologue to the stage's 60-62 window, which is why the marriage is placed in his late fifties rather than in his sixties. Name, work and fame withheld for the bridge.",
      text: `There was a man in his sixties.

For most of his life he had been alone, in the romantic sense. He had friends. He had work he was good at. He had a quiet set of rooms full of books. Long ago he had decided the great love most people get was not going to be his.

Then, late — far later than people usually do this — he had met her.

She was sharp and funny and unafraid of him. She argued with him as an equal. Almost no one did that. He married her in his late fifties. For the first time in his life, he was not alone.

He was happier than he had ever been. He thought the hard part of his life was behind him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: her cancer, the remission and the renewed hope, its return, her death, and his own record that what he felt was closer to fear than to sadness. The quiet house and the person-shaped hole are plain paraphrase of the notebooks' mood, not quotation; nothing here is in quotation marks, and the notebooks' best-known opening sentence is deliberately not echoed.",
      text: `Then she got sick.

It was the kind of sickness that does not let go. For a while it pulled back, and they let themselves hope. Then it came back.

He sat with her through all of it. He watched the person who had finally made his life full get smaller and weaker. There was nothing he could do. Nothing.

She died.

What came after was not what he had expected. He had thought it would be sadness. It wasn't. He was frightened. All day, of nothing he could point to. He would be doing something ordinary and a wave of panic would rise in him for no reason.

The house was unbearably quiet. He kept turning to tell her things. She wasn't there.

He had been alone before. This was not that. This was a room with a person-shaped hole in it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: four private notebooks, written for himself and not initially intended for publication, are the origin of the book. Framing the writing as survival rather than teaching is a fair reading of the notebooks, not a claim he made in those words.",
      text: `He started writing in a notebook.

Not for anyone. Not to publish, not to teach. He had spent his life writing things meant to help other people. This was the opposite of that. This was just a man trying not to drown. He put down on paper exactly how bad it was, so it would stop going round in his head.

He wrote down the fear. He wrote down the anger. He wrote down the questions he was ashamed to be asking.

He didn't tidy any of it. He didn't make it wise. He told the truth, page after page, on the worst nights.

It was the only thing that helped. And it barely helped.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: the crisis of faith is the core of the notebooks, including his fear that his belief had held only because nothing had ever tested it, and the decades of letters from readers in distress. The 1940 book on suffering is deliberately NOT described here — naming its argument is the single clearest give-away in the whole story — so the irony is carried by the letters instead.",
      text: `Here is the part that frightened him most.

His whole life, he had believed something. He had built everything on it. His work. His name. The way he explained the world to himself and to thousands of other people. When people were in pain, they wrote to him, and he wrote back. He had answers for them. He believed the answers.

Now the pain was his, and the answers were no use at all.

He found himself furious at the thing he had believed in. He wondered, in the dark, whether he had been fooling himself the whole time. Maybe what had held him up for decades was only a story. Maybe it worked because nothing had ever really tested it.

For once, the man who could argue anything could not argue his way out.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The turn is internal and gradual, not a decision or an event: grief as something that moves, and belief returning in a smaller and less certain form. This is the documented shape of the notebooks' later sections. No date is given for the shift because none is documented.",
      text: `Slowly — and it was slow — something shifted. Not a fix. Not a moment where the clouds broke and it all made sense.

What changed was smaller than that. As he kept writing, he noticed the grief was not one frozen thing. It moved. Some mornings were a little less terrible than the ones before. The pain did not leave. It just stopped feeling like a wall he was thrown against every hour of the day.

And his belief, when it came back, came back different. Smaller. Quieter. Less sure of itself. He stopped demanding that the world explain itself to him. He found he could hold the grief and the belief at the same time, without either one having to win.

He was not healed. He was still standing. Slowly, he came to feel that still standing was its own kind of answer.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: he published the notebooks under a pseudonym the year after her death, and grieving readers have read the book ever since. Deliberately not described in its recognizable form, and no superlative claim is made about it. Still anonymous — he is never named here.",
      text: `He did something he had not planned to do. He let the notebook be published.

Not under his own name. He used a false one, because the pages were too raw and too private to put his real name on. He didn't want it to be a famous man's book. He wanted it to be one grieving person talking honestly to another.

That is what it turned out to be. Other people who were in the middle of it read it and found it useful. Not because it fixed anything. Because it didn't pretend.

He had written it with nothing left. No comfort, no answers, no wisdom. It went out into the world anyway, and it helped people.

He didn't fix his grief. He just refused to lie about it. That turned out to be the thing that mattered.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was C. S. Lewis.

He was one of the most famous writers of his century. He wrote beloved children's books about a magical land, and books about faith that millions still read. Twenty years before his wife died, he had written a calm, confident book explaining how a person is meant to bear suffering. Then he had to bear it himself, and none of it held. The small, honest book he wrote in his grief has sat with hurting people ever since. It did not exist yet on the mornings we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He was past sixty, with all the answers, and grief knocked every one of them out of his hands. He didn't get them back the same. He got something quieter instead. He kept going, not because it stopped hurting, but because the hurting slowly began to move.

You don't have to have the answers right now. He didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born Jan 17 1931 Arkabutla MS; raised by his maternal grandparents John Henry &
//    Maggie Connolly, who moved the family north from Mississippi to a farm in Dublin, Michigan
//    when he was about five; he found the upheaval traumatic and a severe stutter followed; by
//    his own account his first school year was his first mute year and the mute years ran until
//    high school (roughly age 6-14); he wrote instead of speaking, spoke only haltingly to his
//    family, and talked freely only to the farm animals and to himself; wrote
//    poetry; high-school teacher Donald Crouch (a former professor) doubted he had written a
//    poem and dared him to recite it from memory to the class; he got through it without
//    stuttering; went on to read poetry and Shakespeare aloud and to compete in public speaking,
//    winning a contest and a scholarship to the University of Michigan in his senior year;
//    became the voice of Darth Vader and Mufasa across a celebrated career; died Sept 9 2024.
//    (Jones & Niven, Voices and Silences; Academy of Achievement; the Stuttering Foundation.)
//  Interpretive: the boy's internal "my own voice is the enemy" framing; shame as the engine of
//    the silence. Drawn closely from his own accounts; lightly dramatized.
//  Avoid saying: don't name Vader / Mufasa / Star Wars / the university / his name before the
//    bridge. Don't turn the teacher into a magic cure - it unlocked him, but years of work
//    followed. Keep farm/era markers soft. No direct quotations inside the beats.
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
    "He was a small boy moved far from everything he knew to a farm in another part of the country, and the shock of it gave him a stutter so bad that he simply stopped talking, for years.",
    "He was so ashamed of the sounds that came out when he tried to speak that he learned to live almost entirely in silence, writing things down, talking only to the farm animals.",
    "The thing that brought his voice back was not a doctor but a teacher who refused to believe the silence was permanent, and a poem the boy had written himself.",
  ],
  facets: {
    emotionalCore:
      "He carried the deep shame of a child who believes the very act of opening his mouth will humiliate him, and who has decided that silence is safer than the certainty of being laughed at.",
    decisionShape:
      "Whether to stay safe inside the silence he had built, or to risk the one thing that had always humiliated him — his own voice — out loud, in front of a room full of people.",
    triggerEvent:
      "Uprooted as a small child when the family moved far from everything he knew, the boy developed a stutter so severe that he stopped speaking aloud almost entirely for years.",
    agencyState:
      "He had near-total control over one thing — whether to speak at all — and he used it to protect himself by choosing silence, which kept him safe and kept him alone.",
  },
  biographicalFacts: `James Earl Jones was born January 17, 1931, in Arkabutla, Mississippi. He was raised by his maternal grandparents, John Henry and Maggie Connolly; when he was about five the family moved north from Mississippi to a farm in Dublin, Michigan. He found the upheaval traumatic and developed a stutter so severe that he stopped speaking almost entirely. He later said that his first year of school was his first mute year and that those mute years continued until he reached high school — roughly ages six to fourteen. He communicated in writing, spoke only haltingly to his family, and talked freely only to the farm animals and to himself. In high school in Michigan, an English teacher named Donald Crouch, a former college professor, discovered that the silent boy wrote poetry. Suspecting a poem was too accomplished to be the boy's own, Crouch challenged him to prove he had written it by reciting it from memory in front of the class. Jones did, and got through it without stuttering. Hearing his own fluent voice changed his life. He went on to read poetry and Shakespeare aloud at length, and Crouch encouraged him to compete in high-school debates and oratorical contests; in his senior year he won a public-speaking contest and a scholarship to the University of Michigan, where he graduated in 1955 with a degree in drama. He became one of the most distinctive and recognizable voices in the world — the voice of Darth Vader in the Star Wars films and Mufasa in The Lion King — across a celebrated stage and screen career spanning more than six decades. He died September 9, 2024.`,
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
        "Anonymized. Being raised by his grandparents, the family's move far north when he was about five, the traumatic upheaval, the severe stutter that followed, and the retreat into silence are all documented.",
      text: `There was a boy. He was about seven.

He had been raised by his grandparents. When he was five, they moved him far away from the place and the people he knew, onto a farm a long way off. He never really got over the shock of it.

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
        "Years of near-total silence, writing answers instead of speaking, and talking freely only to the farm animals and to himself are documented in his own account. The internal belief that his voice was the enemy is drawn from it.",
      text: `He stayed silent for years.

Think about what that means for a kid. Years. He went to school and didn't speak. He raised his hand for nothing. When a teacher asked him a question, he wrote the answer down.

The only ones he really talked to were the animals on the farm. They didn't care how the words came out. He could talk to them as long as he wanted, easy and free. Then he would go back to the house and put the silence back on.

He talked to himself, too. Inside his own head, his voice worked fine. It only failed him when it had to come out into the world.

He grew up believing, all the way down, that his own voice was the enemy. It would shame him every single time. So he kept it locked up, and he kept himself locked up with it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "That he wrote — including poetry — fluently while unable to speak is documented, and is the hinge the later turn depends on.",
      text: `There was one place the words came out clean. On paper.

When he wrote, there was no stutter. No one waiting for him to finish. No faces watching him struggle. He could say anything he wanted, exactly the way he meant it.

So he wrote. Quietly, for himself. He started writing poems. The things he could not say out loud, he could finally put down on paper.

He didn't show them to anyone. They were his. They were proof, at least to himself, that there was a voice in there.

It just had no way out.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The long duration of the silence and the way it shaped his whole identity as the quiet one are documented. The sentence he carried inside is interpretive but well-grounded in his own account.",
      text: `This went on for years. Most of his childhood, really.

On the outside he was the quiet one. The boy who didn't talk. Teachers learned not to call on him. Kids learned he wasn't going to say anything back. He made himself smaller and smaller around the silence, until it was just who he was.

He was good at hiding it. He had to be. A whole life can be built around not letting people see the thing you are ashamed of.

But the hiding cost him. Every day he carried the same sentence around inside him. Something is wrong with me. If I open my mouth, everyone will hear it.

He had no reason to think this would ever change. As far as he knew, this was just the shape of his life.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the teacher (Donald Crouch) found the boy's poetry, doubted he had written it, and dared him to prove it by reciting it from memory to the class; the boy got through it without stuttering, and he described it afterwards as the thing that changed his life. The word stunned is dramatized texture; the challenge is given as indirect speech because no verbatim quote is carried in the facts.",
      text: `Then he got a new teacher.

An older man who had taught a long time and paid attention to his students. He found one of the boy's poems. And it was good — so good the teacher said he didn't believe the boy had written it.

Then he gave him a way to prove it. Stand up. Say the poem out loud, from memory, to the whole class.

Every instinct the boy had screamed no. Standing up in front of people was the exact thing he had spent years avoiding. The whole room would watch his mouth fail.

But he stood up.

And he opened his mouth, and the poem came out. All of it. Clean. Not one stutter.

He stood there, stunned, hearing his own voice fill the room. It had been in there the whole time. The teacher had simply refused to believe it was gone.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Reading aloud at length, competing in high-school debates and speaking contests, and winning a contest and a scholarship in his senior year are documented (Academy of Achievement). The famous roles, the sound of the voice, and the fact that he became known for it are all withheld for the bridge.",
      text: `After that, he could not be stopped.

He went after the very thing that had terrified him his whole life. He read out loud for hours, alone, just to feel the words come out whole. He started entering speaking contests, standing up in front of judges on purpose. In his last year of school he won one. That same year he won a scholarship, and he went to college.

The boy who had not spoken for years stopped being that boy.

He had spent his whole childhood certain that opening his mouth would shame him. Now he did it on purpose, in front of strangers, again and again. He had heard the proof once. He wanted to hear it again.

The thing he had been most ashamed of turned out to be the best of him. He spent the rest of his life using it.

He just had to be dared, one time, to let it out.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was James Earl Jones.

The boy who couldn't speak grew up to have one of the most famous voices in the world. He was the voice of Darth Vader in Star Wars. He was Mufasa in The Lion King. For decades, on stage and screen, people knew that deep, steady voice the moment they heard it. None of that had happened yet in the years we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He didn't do it alone. It took one teacher who refused to believe the silence was the end of the story. It took one poem he had written when he thought no one would ever hear it. The voice was in there the whole time. It just needed one safe place to come out.

You don't have to have your voice yet. He didn't either, for years.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: born 1940 near Clarksville TN, premature, 20th of 22 in her father's family;
//    father a railway porter, mother a maid, household poor; polio ~age 5 left her left leg and
//    foot weak; a doctor said she'd never walk, her mother said she would ("I believed my
//    mother"); segregated South -> ~2 years of weekly ~50mi bus trips to the (Black) Meharry
//    Medical College in Nashville + family massage 4x/day; brace off in public at ~9 1/2, and by
//    ~12 she needed neither brace nor orthopedic shoe (the brace went back to Nashville);
//    basketball in 8th grade, then running; 1956 Olympics relay bronze at 16; 1960 Rome 3 golds
//    (100m, 200m, relay), first American woman with 3 track-and-field golds at one Games,
//    "fastest woman in the world"; insisted her homecoming be integrated; later
//    teacher/coach/foundation; died 1994. (Rudolph, Wilma; Smith, Wilma Rudolph; NWHM;
//    Encyclopedia.com.)
//  Interpretive: framing "believe her mother over the doctor" as the act of defiance; the secret
//    brace-off practice and the "if I can walk I can run" turn are grounded, lightly dramatized.
//  Avoid saying: don't name the Olympics / Rome / three golds / "fastest woman" / the first
//    integrated homecoming / her name before the bridge. The brace-to-champion arc is famous
//    enough that the landmark shapes give her away even unnamed, so beats 0-5 stay off "the
//    biggest stage in her sport", the world watching, and winning again and again. Withheld for
//    anonymity (2026-09-01): beats 0-5 no longer say she ran, raced or was fast. Withheld again
//    (2026-09-02), after a blind reader still named her from beats 0-5: the athletic becoming is
//    gone altogether (no getting good at it, no school team, no winning, no being carried away
//    from home by it), and so are the brace's metal-and-leather form, her mother's famous
//    two-word answer, the reason the hospital near home turned the family away, the room of
//    astonished people at the first walk without the brace, and the split celebration she made
//    them integrate. All of it stays true in biographicalFacts and in the bridge; beats 0-5 carry
//    only the cost of the segregation (help that was hours away), never its name, its region or
//    its era. Don't reduce her to an inspirational object - the agency is hers.
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
    "She was a small, sick girl in a leg brace who had been told by a doctor that she would never walk, and for years the most defiant thing she did was believe her mother instead of him.",
    "Week after week she made the long trip for treatment and let her family work the weak leg by hand, on the faith that a body others had written off might still be taught to move.",
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
  biographicalFacts: `Wilma Glodean Rudolph was born prematurely on June 23, 1940, in Saint Bethlehem, near Clarksville, Tennessee, weighing about four and a half pounds. She was the twentieth of twenty-two children from her father Ed Rudolph's two marriages; he worked as a railway porter and her mother, Blanche, worked as a maid, and the household was poor. A sickly child, she survived pneumonia and scarlet fever and then, at about age five, contracted infantile paralysis (polio), which left her left leg and foot weak and partly paralyzed. A doctor told the family she would never walk again; her mother told her she would. Rudolph later said: "My doctor told me I would never walk again. My mother told me I would. I believed my mother." Because the local hospital would not treat Black patients, for about two years Wilma and her mother made weekly bus trips of some fifty miles to the historically Black Meharry Medical College in Nashville for treatment, and family members massaged her leg four times a day at home. She wore a heavy metal leg brace and an orthopedic shoe. At about age nine and a half she took the brace off in public for the first time; by about age twelve she could walk without the brace or the orthopedic shoe, and the brace was sent back to Nashville. She began playing basketball in eighth grade and then took up running. She competed in her first Olympic Games at sixteen, winning a bronze medal in the 4x100 relay; four years later, at the 1960 Rome Olympics, she won three gold medals — the 100 meters, the 200 meters, and the 4x100 relay — becoming the first American woman to win three gold medals in track and field at a single Olympic Games, and she was called the fastest woman in the world. She insisted that her hometown victory celebration be integrated, and it became the first integrated public event in the town's history. She later worked as a teacher and track coach and founded a foundation for young athletes. She died of cancer on November 12, 1994.`,
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
        "Anonymized. The crowded, poor household, the childhood illness that left one leg weak and braced, the doctor's verdict and her mother's opposite one are all documented. Both verdicts are loose paraphrase here, never quotation. The two-futures framing is editorial. Withheld for anonymity: the brace's metal-and-leather form, her mother's famous two-word answer, how many children were really in the house, and the sport she later took up.",
      text: `There was a girl. She was about eight.

She had been sick almost since the day she was born. One of the sicknesses left a leg weak and turned the wrong way. She wore a brace on it to hold it up. She couldn't play the way the other kids played. Most days she could barely keep up walking.

There were a lot of children in her house, and never quite enough of anything to go around.

When she was small, a doctor had looked at that leg and told her family not to hope for much. He did not think it would ever carry her.

Her mother heard the same words and did not accept them. She told the girl a different future.

Two grown-ups. Two futures. The girl had to pick one to believe.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: the weekly trips of some fifty miles for treatment, and her brothers and sisters working the leg by hand four times a day. Being left out and teased over the brace comes from her own account of these years; the clanking is light texture. Withheld for anonymity: that the hospital close to home turned her family away because they were Black, and the distance and the place - the segregation is kept whole in biographicalFacts and the beat carries only its cost. No interior state is asserted; the sources do not record what she thought on those nights.",
      text: `Being the girl in the brace was its own kind of lonely.

She sat and watched while the other children played. She clanked when she moved. Kids can be unkind about a thing like that, and they were.

The only place that could help her leg was hours away. Once a week her mother took her there. A long ride there, a long ride back, and then the same week again.

Then home, where her brothers and sisters took turns working the leg with their hands. Four times a day. Every day.

It would have been so easy to stop. To decide the doctor was right. To let the leg be what it was and make her whole life small enough to fit around it.

Nobody could promise her any of it was working.

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

And slowly — so slowly no one could see it day to day — the leg began to come back.

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
        "Documented: she took the brace off in public for the first time at about nine and a half, still needed a brace on some days and an orthopedic shoe for a while, and by about twelve needed neither, the brace going back to the place that had supplied it. Withheld for anonymity: the setting and the astonished onlookers of that first walk, and the sport she took up right afterward - the beat says only that she walked where people could see her, and that she wanted to know what else the leg could do. The single-morning anchor and the walking-wasn't-enough framing are editorial.",
      text: `Then came the day.

She was about nine. She had worn that brace, in one form or another, for most of her life. One morning she left it off. She walked without it, out where other people could see, on her own two legs.

It wasn't finished after that. For a while she still needed the brace some days, and a special shoe on the weak foot. But by about twelve she didn't need any of it. The brace went back to the place that had given it to her.

The thing the doctor said would never happen had happened. She could walk.

But here is the part that tells you who she was. Walking wasn't enough. The moment her body would carry her, she was done sitting on the side of things. She wanted to find out what else this leg could do.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the strength that came back over years of daily work, that by her teens she could keep up with other children her age, and that she later worked as a teacher and spent her working life around young people. Withheld for anonymity: her name, the sport, the competitions, the medals and the title, and the celebration at home that she refused to attend unless everyone could come - all of that waits for the bridge or stays in biographicalFacts, because the brace-to-champion arc names her instantly. Editorial, drawn from the documented pattern rather than a recorded scene: that she kept working the leg after she could walk on it, and that she carried the refusal into the rest of her life.",
      text: `She found out.

It came the way the walking had come. Slowly, with work, and no single day you could point to. She kept working at that leg long after she could walk on it.

By the time she was a teenager she was not the girl on the side of things anymore. She was in the middle of them. She could keep up with anyone her age.

The body a doctor had written off was carrying her now. That weak leg. The one her family had worked by hand, four times a day, for years.

She grew into someone who taught, and spent her working years around young people.

And she never let go of what those years taught her. What other people decided she was allowed did not get the last word. She had already outlived one of those decisions, on her own two legs.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Wilma Rudolph.

At the Olympic Games in Rome in 1960 she won three gold medals, and people called her the fastest woman in the world. She was the first American woman to win three track and field golds at a single Games. She spent years afterward teaching, coaching, and opening doors for the young athletes who came behind her. None of that had happened yet in the years we just sat with her.

Your life is not theirs. But a piece of this story may still sit beside you.

None of it arrived in one leap. It came from a little girl, a stubborn mother, and a family who worked her leg by hand four times a day. It came from years of small steps that didn't look like much from the outside.

You don't have to believe the worst thing you have been told about yourself. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.4 Apr 1928 St. Louis; pregnant at 16, hid it, graduated, and ~3 weeks later gave
//    birth to Clyde (later Guy) Johnson in 1945, at 17; she initiated the encounter and did
//    not involve the father, who was never part of their lives; raised the boy alone on low-wage
//    jobs (cook, waitress, dancer), hand-to-mouth; too frightened to even hold him at first; the
//    anecdote (Caged Bird ch.36, ~3 weeks after the birth) of her mother making the baby sleep in
//    her bed, her terror of crushing him, meaning to stay awake, sleeping, and being woken to see
//    she was sheltering him under her arm, plus the lesson "if you're for the right thing, you do
//    it without thinking"; later one of the great writers (I Know Why the Caged Bird Sings), read
//    On the Pulse of Morning at Clinton's inauguration 20 Jan 1993; raised Guy lifelong and stayed
//    close to him; d.28 May 2014. (Caged Bird; Gather Together in My Name; Mom & Me & Mom;
//    Britannica; mayaangelou.com.)
//  Interpretive: the "I'm going to ruin him / I'm not enough" inner voice. From her own accounts,
//    lightly dramatized.
//  Avoid saying: don't name Angelou / Caged Bird / the inaugural poem before the bridge. Do NOT
//    pull in her separate childhood-trauma/mutism episode (a different stage) - keep this one about
//    young motherhood, and do not allude to it in beat 1. The waking detail is that her mother woke
//    her and the baby was safe under her arm; don't assert the "curled into a tent" image unless it
//    is verified against Caged Bird ch.36 directly. Keep the mother's lesson in loose paraphrase in
//    beat 4 - its verbatim wording is that memoir's famous closing line, and quoting it names her
//    before the bridge; the exact quote stays in biographicalFacts only. Sources differ on the
//    father's intent; say only that he was absent. The "father's temper" eval-miss is adjacent, not identical (her fear was
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
    "The father was never part of their lives, so it was just her and the baby and a string of jobs that barely covered the rent.",
    "The night she first understood she might not destroy this child came from her mother, and from her own arms doing the right thing while she slept.",
  ],
  facets: {
    emotionalCore:
      "She felt the specific terror of a young parent who is sure she is too young, too alone, and too unready to keep a small helpless person alive, let alone raise him well.",
    decisionShape:
      "Whether to believe she was bound to fail this child — too young and too alone to do it right — or to simply keep showing up for him until the doing became the proof.",
    triggerEvent:
      "A teenager barely out of school had a baby on her own, with the father gone and no money, and had to become a mother before she felt remotely ready to be one.",
    agencyState:
      "She had almost nothing — no partner, little money, no experience — except the daily, exhausting power to keep choosing this child over her own fear.",
  },
  biographicalFacts: `Marguerite Annie Johnson — later known as Maya Angelou — was born April 4, 1928, in St. Louis, Missouri, and grew up between Missouri, Arkansas, and California. At sixteen, in her final year of high school in San Francisco, she became pregnant after a brief encounter; she hid the pregnancy until after graduation and gave birth to her son, Clyde (later called Guy) Johnson, about three weeks later, in 1945, at seventeen. She had initiated the encounter herself and did not involve the father; he was never part of their lives. Terrified but determined, she refused to give the child up and set out to raise him alone, taking a string of low-wage jobs — cook, waitress, nightclub dancer — and at times living hand to mouth. In the first weeks she was afraid even to hold the baby, certain she would hurt him. She later recounted that about three weeks after the birth her mother insisted he sleep in the bed beside her; Maya was so afraid she would roll over and crush him that she meant to stay awake all night, but fell asleep — and her mother woke her to show that she had drawn the baby close and was sheltering him under her arm. Her mother told her: "See, you don't have to think about doing the right thing. If you're for the right thing, then you do it without thinking." Angelou went on to become one of the most celebrated writers of the twentieth century — author of I Know Why the Caged Bird Sings, the poet who read On the Pulse of Morning at Bill Clinton's inauguration on January 20, 1993, an actor, and a civil-rights worker — and raised Guy as a single mother through years of struggle; mother and son remained close for the rest of her life. She died May 28, 2014, in Winston-Salem, North Carolina.`,
  sources: [
    "Angelou, Maya. I Know Why the Caged Bird Sings (New York: Random House, 1969), Chapters 32-36.",
    "Angelou, Maya. Gather Together in My Name (New York: Random House, 1974).",
    "Angelou, Maya. Mom & Me & Mom (New York: Random House, 2013).",
    "\"Maya Angelou,\" interviews with Oprah Winfrey (OWN / SuperSoul Sunday).",
    "\"Maya Angelou,\" Encyclopaedia Britannica (britannica.com/biography/Maya-Angelou).",
    "\"Remembering Guy Johnson,\" Caged Bird Legacy (mayaangelou.com), February 17, 2023.",
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

She had gotten pregnant the year before, near the end of school, after one brief thing with a boy. She hid it as long as she could. A few weeks after she graduated, her son was born.

The baby's father was never part of their lives.

So it was her. A seventeen-year-old, with a newborn who needed everything, and almost nothing to give him but herself.

She loved him so much it scared her. And she was certain, all the way down, that she was going to get this terribly, terribly wrong.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Her fear of being inadequate, her fear of even touching the newborn, and the low-wage work to support him are documented (Caged Bird ch. 36). The inner \"I am going to fail him\" voice is drawn from her own accounts.",
      text: `The fear was the worst part.

She was so young. She didn't know what she was doing. Every cry could be something serious and she wouldn't know it. Every choice felt like one she was bound to make wrong.

In those first weeks she was scared to even pick him up. She was sure her own hands would hurt him somehow. A person that small, and only her to keep him alive.

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

Nobody handed her confidence. She just kept choosing him, over and over, before she felt ready. There was never going to be a day when she felt ready. So she stopped waiting for one.`,
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
        "Documented (Caged Bird ch. 36): about three weeks after the birth her mother insisted the baby sleep beside her, she feared crushing him, meant to stay awake, slept, and was woken to find she was sheltering him under her arm. Her mother's lesson is quoted verbatim in biographicalFacts; the beat renders it as indirect speech.",
      text: `One night, a few weeks in, her own mother made her let the baby sleep in the bed beside her.

She was terrified. She was sure she would roll over in her sleep and crush him. She decided she simply would not sleep. She would stay awake all night to keep him safe.

She fell asleep anyway.

Her mother woke her and told her to look. Sometime in the night, without thinking, without trying, she had moved the baby in close and tucked him safe under her arm. She hadn't crushed him. She had protected him — in her sleep, on instinct, while her scared, second-guessing mind was switched off.

Her mother told her something she never forgot. That she did not have to work out in her head how to be good to him. Wanting good for him was already most of it.

She had been so busy being afraid she would fail him that she had not noticed she was already keeping him safe.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "She raised Guy through years of struggle and became a major writer and public voice; mother and son stayed close for the rest of her life. Kept anonymous - no book titles, and the inaugural poem is held back for the bridge.",
      text: `She raised him.

Not perfectly. Nobody does. But she stayed, and she worked, and the scared seventeen-year-old slowly became a woman people leaned on. The fear didn't leave all at once. It left the way it came, a day at a time.

And she became more than she could have imagined on those frightened first nights. She found out she had something to say. She wrote about hard lives, including her own, and what she wrote reached people she would never meet. Strangers carried her sentences around with them for years.

The boy she was sure she would ruin grew up loved, and he stayed close to her for the rest of her life.

She did all of it while believing, for a long time, that she wasn't enough. She was. She just had to keep going long enough to find out.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Maya Angelou.

She became one of the most loved writers of the last hundred years. Her first book, about surviving a hard childhood, is read all over the world. Years later she stood up and read a poem she had written for a President's inauguration. None of that had happened yet on the night we just sat with her.

Your life is not theirs. But a piece of this story may still sit beside you.

She was seventeen and sure she was going to ruin the one person who needed her. Nobody talked her out of that. It got quieter over years of feeding him, and working, and staying. She just kept showing up until the showing up was the answer.

You don't have to feel ready. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. 1 Apr 1873 Russia; gifted young pianist/composer; First Symphony premiere
//    28 Mar 1897 (16 Mar OS) in St. Petersburg was a disaster (under-rehearsed; Glazunov
//    conducting - witnesses incl. Natalia Satina said he was drunk, but SR never confirmed it;
//    SR left the hall before the performance ended);
//    the critic Cesar Cui savaged it - a symphony that, written by a star pupil of a conservatory
//    in Hell, would have "delighted the inhabitants of Hell" (there is no "first prize" in the
//    actual line); ~3-year depression, composed almost nothing, doubted his talent; Jan-Apr 1900
//    near-daily free sessions with Dr. Nikolai Dahl (hypnosis + calm repeated formula: "You will
//    begin to write your concerto... You will work with great facility... The concerto will be of
//    excellent quality"); recovered; Piano Concerto No. 2 dedicated to Dahl, complete premiere
//    Moscow 9 Nov 1901 with SR as soloist, became a beloved staple; the lost symphony was rebuilt
//    from the orchestral parts and played again in 1945; major career; d. 28 Mar 1943 Beverly
//    Hills. (Bertensson & Leyda; Harrison; Walker; Britannica.)
//  Interpretive: "the skill stayed, the belief left"; "faith can be borrowed until yours returns"
//    reading of the Dahl treatment. Grounded, lightly dramatized.
//  Avoid saying: don't name Rachmaninoff / the Second Concerto / Russia / Cui / Dahl before the
//    bridge. Don't render the therapy as magic - it was patient, repeated suggestion over months,
//    plus his own slow return. Don't say he wrote literally nothing for three years (almost
//    nothing is the honest claim), and don't reduce Cui's line to a "first prize" verdict.
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
      "His ambitious first symphony was performed so badly, and reviewed so savagely, that the young composer concluded he had no talent and all but stopped composing for three years.",
    agencyState:
      "He had the skill and the training intact, but the one thing a creator cannot manufacture — the belief that the work is worth making — had been taken from him, and without it the skill was useless.",
  },
  biographicalFacts: `Sergei Vasilyevich Rachmaninoff was born April 1, 1873, in Russia. A prodigiously gifted pianist and composer, he completed his ambitious First Symphony in his early twenties. Its premiere, in St. Petersburg on March 28, 1897 (March 16, Old Style), was a catastrophe: the orchestra was under-rehearsed, and the conductor, Alexander Glazunov, was said by witnesses — including Natalia Satina, later Rachmaninoff's wife — to have been drunk on the podium, though Rachmaninoff himself never confirmed it. Rachmaninoff left the hall in distress before the performance ended. The work was savaged, most famously by the composer-critic Cesar Cui, who wrote: "If there were a conservatory in Hell, if one of its talented students were instructed to write a programme symphony on the 'Seven Plagues of Egypt', and if he were to compose a symphony like Mr Rachmaninov's, then he would have fulfilled his task brilliantly and would delight the inhabitants of Hell." The humiliation devastated him. He fell into a severe depression that lasted roughly three years, during which he composed almost nothing and doubted he had any talent at all. From January to April 1900, at his relatives' urging, he saw Dr. Nikolai Dahl almost daily and free of charge; Dahl talked with him about music and repeated a calm formula while he lay half asleep: "You will begin to write your concerto... You will work with great facility... The concerto will be of excellent quality." Rachmaninoff slowly recovered, and the music returned. The result was his Piano Concerto No. 2, dedicated to Dahl: its second and third movements were played in December 1900, and the complete work premiered in Moscow on November 9, 1901, with the composer as soloist. It became one of the most beloved works in the entire piano repertoire. He went on to be one of the great composers and pianists of his era. The First Symphony's score was lost after the 1917 revolution, reconstructed from the surviving orchestral parts, and performed again in Moscow in 1945; it is now admired and regularly played. He died March 28, 1943, in Beverly Hills, California.`,
  sources: [
    "Bertensson, Sergei, and Jay Leyda. Sergei Rachmaninoff: A Lifetime in Music (New York: New York University Press, 1956).",
    "Harrison, Max. Rachmaninoff: Life, Works, Recordings (London: Continuum, 2005).",
    "Walker, Robert. Rachmaninoff (London: Omnibus Press, 1980).",
    "Encyclopaedia Britannica, Sergey Rachmaninoff (biography entry, accessed 2026).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A prodigiously gifted young composer, recognized since boyhood, finishing his first large-scale work and staking his reputation on its premiere - all documented. His nerves and his private confidence on the night are dramatized texture, not recorded.",
      text: `There was a young man, not yet thirty. He wrote music.

He was good. Everyone had said so since he was a boy — teachers, other musicians, the people who knew. He had the kind of talent that makes a room go quiet.

He had just finished the biggest thing he had ever written. A huge, ambitious piece he had poured himself into. It was going to be the work that announced him to the world.

The night of its first performance, the whole musical world he cared about would be in the room.

He was nervous, the way you are before something you've bet everything on. But under the nerves was a young man's certainty that this was his moment.

It was about to go very, very wrong.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The under-rehearsed premiere, the composer walking out before the end, and the savage review are documented; the critic's Hell-conservatory line is put in plain words here, not quoted. Witnesses said the conductor was drunk, but the composer never confirmed it, so the beat keeps it as hearsay. His conclusion that he himself had failed is drawn from the record.",
      text: `The performance was a disaster.

The musicians had barely rehearsed. The man waving the baton out front did a clumsy, careless job — some said he had been drinking. The beautiful thing in the young man's head came out of that orchestra as a mess.

He couldn't stay. He walked out before it was over, while his great work fell apart in front of everyone.

Then came the reviews. One of the most famous critics alive tore it to shreds. Not gently. Not usefully. It was the kind of review built to end someone. He wrote that if hell had a music school, this is the piece its best student would hand in.

Something in the young man broke that night and didn't mend for a long time. It wasn't only that the piece had failed. It was that he had failed, in public, completely. And he believed it. He decided the critic was right. He decided he had nothing.

And the music stopped.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "He kept working as a performing musician to earn a living while unable to compose. He composed almost nothing rather than literally nothing, and the beat now says so. The waiting-out-the-days framing fits the documented depression.",
      text: `He didn't stop being a musician. He just stopped being able to make anything new.

He still went out into the world. He played. He earned his keep. To everyone watching, he looked fine — a working musician, doing his job.

Inside, the well was dry. He would sit down to write and almost nothing came. The part of him that made things had gone quiet, and he had no idea how to wake it.

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
        "His relatives urged him to the doctor, who saw him almost daily for months and repeated a calm formula: that he would begin writing again, that the work would come easily, that it would be good. The beat puts that formula in plain words rather than quoting it; the verbatim wording is in the facts. The slow return of his ability to compose is documented; the moment of the first notes coming back is compressed dramatized texture, not a recorded scene.",
      text: `Then his family talked him into seeing a certain doctor.

The doctor's method was strange and simple. Day after day, the young man would come and sit, and the doctor would talk to him in a calm, steady, certain voice. He said the same things, over and over. You will start writing again. The work will come easily. It will be good.

That was most of it. A quiet man repeating, patiently, a belief the young man could not yet hold on his own.

And slowly, it took. Something in him that had been clenched shut for three years began to loosen. One day he sat down — and a few notes came. Then a few more. Then a flood.

He wrote a new piece. It came out warm and huge and alive, the way music used to.

He had it back. Someone had simply believed it for him until he could believe it again.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The comeback work became one of the most beloved in the repertoire; he dedicated it to the doctor; he became a giant of his era. Name and titles withheld for the bridge.",
      text: `That new piece became one of the most loved pieces of music ever written.

A hundred years later, people still play it. They still record it. They still fall in love to it. He wrote it crawling out of the worst years of his life. It turned out to be the work the world would remember him for most.

He went on writing. He became one of the great composers of his time. He became one of the great players too. His was the kind of name that outlives everyone who knew him.

He dedicated that comeback piece to the quiet doctor who had talked him back to life.

The young man who walked out of that hall was sure he was finished. He had more than half his music still ahead of him. He just couldn't see it from the bottom.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Sergei Rachmaninoff.

He became one of the most beloved composers in the world. The piece he wrote after those three empty years is his Second Piano Concerto. It is still one of the most played, most loved works in all of music. Even the symphony that nearly ended him is performed now, and admired. None of that had happened yet on the night we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He didn't climb out alone. It took years. It took his family, and a patient doctor who said out loud, every day, that the music would come back. The talent never left him. Only the faith did. And faith can be borrowed from someone else until yours comes back.

You don't have to believe in yourself today. He couldn't either. Someone held that belief for him until he could pick it up again.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1925 Savannah GA; Iowa Writers' Workshop, early career in the Northeast; Dec 1950
//    (age 25) she fell gravely ill traveling home for Christmas and was hospitalized in Atlanta -
//    systemic lupus, the incurable disease that had killed her father when she was 15; the name of
//    the disease was withheld from her at first and she knew it by summer 1952; she and her mother
//    moved to Andalusia, the dairy farm near Milledgeville GA that Regina had recently inherited;
//    steroid-weakened bones -> crutches from the mid-1950s; daily routine of Mass + ~2-3 hours
//    writing, then rest/reading; kept peafowl; 2 novels + more than 30 stories across 14 ill years
//    (published counts vary 31-32, so the beats say "more than thirty"); major posthumous stature;
//    d.1964 age 39. (O'Connor, The Habit of Being; Gooch, Flannery.)
//  Interpretive: the internal turn - writing from inside the shortened life instead of waiting for
//    the old one back - is a fair reading of her letters. The beats deliberately do NOT claim the
//    illness deepened or improved the work. The illness is rendered honestly.
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
  biographicalFacts: `Mary Flannery O'Connor was born March 25, 1925, in Savannah, Georgia. A fiercely talented young writer, she studied at the Iowa Writers' Workshop and was living and working in the Northeast, at the start of a promising literary career, when she fell ill. In December 1950, at age twenty-five, on her way home to Georgia for Christmas, she became seriously ill on the train and was hospitalized on her arrival in Atlanta. The illness was systemic lupus erythematosus — the autoimmune disease that had killed her father when she was fifteen. It was incurable. After several months in and out of the hospital, she and her mother moved in 1951 to Andalusia, a dairy farm four miles from Milledgeville, Georgia, that her mother, Regina, had recently inherited, and where Regina cared for her. The name of the disease was kept from her at first; by the summer of 1952 she knew what it was. The disease and the steroid treatments weakened her bones; from the mid-1950s she walked on crutches. She organized her days around the illness: Mass in the morning, then two or three hours of writing — all the energy she had — then rest and reading, and tending the peafowl she kept. Over fourteen years of declining health she produced two novels and more than thirty short stories, work now considered among the finest American fiction of the century, much of it darkly comic and morally severe. She knew her time was short and worked steadily against it. She died of complications of lupus on August 3, 1964, at age thirty-nine.`,
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
        "Anonymized. Documented: an already-noticed young writer trained at a good program, living independently far from home, whose father had died of an incurable illness when she was fifteen. Her sense that the future was wide open is inference from her letters, not a recorded statement.",
      text: `There was a young woman. She was twenty-five.

She was a writer — a real one, the kind people had already started to notice. She had trained at a good program. She had moved far from the place she grew up. She was building the independent life she had always wanted.

She was sharp, and funny, and she did not go easy on anyone in her stories. She thought she had decades of work ahead of her. The future looked wide open.

She had one shadow behind her. When she was a teenager, her father had died of an illness. There was no cure for it. But that was his story. She was young, and just beginning hers.

She had no idea what was already coming for her.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: she fell gravely ill in December 1950 while traveling home for Christmas and was hospitalized; the disease was the incurable one that had killed her father, and its name was withheld from her at first; she and her mother then moved to the farm, where she was cared for. 'The holidays' softens the documented Christmas trip. No invented scene, dialogue or room detail.",
      text: `It hit her at twenty-five.

She got sick — strange, frightening sick. It came on while she was traveling home for the holidays, and it put her in a hospital. When they finally named it, it was the same disease that had killed her father. The one with no cure.

There was no fixing it. There was only managing it. And watching it take things from her, slowly.

She had to leave the life she had built. The independence. The distance. The whole world she had been moving toward.

She went back home to her mother's farm, in the place she had come from. She had to be looked after now. She could no longer fully look after herself.

So at twenty-five she traded a wide-open future for one hard fact. Her body was failing. Her time was short. And she would spend what was left of it in the place she had worked so hard to leave.

It would have been so understandable to give up.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: she wrote two to three hours each morning, all the energy the illness allowed, then rested and read. That her fiction almost never took up her own illness is a characterization of the body of work, not a claim she made.",
      text: `She started writing in the mornings.

That was when she had the most in her. Two or three hours, before the illness took the rest of the day. So she guarded those hours. Every morning, she sat down and worked.

Not for very long. The sickness only gave her so much. But she used what it gave her, completely, every single day.

She almost never wrote about being sick. She didn't write to be brave. She just wrote the strange, sharp, funny stories only she could write. The work was hers. The work was the point. The work was the one thing the illness couldn't take.

A few good hours a day. She decided that was enough to build something with.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: the slow decline, the bone softening that put her on crutches, her mother's care, and that she knew she would not recover. 'Working, not waiting to die' is the editor's characterization of her letters, not a quotation from them.",
      text: `The years after that got smaller and smaller.

Her body kept failing in small steps. Her strength went. The treatments wore her down in their own way. After a while she couldn't walk without crutches. Then that was just how she got around.

She did not get better. She was never going to get better. She knew it.

And still, every morning, the few hours. Story after story. She built a whole body of work out of those small daily windows. On a farm. Far from the world of writers she had left. With her mother looking after her, and not much time left.

She wasn't waiting to die. She was working. There is a difference, and she lived inside it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Internal, not an event: she stopped writing as someone waiting to get her old life back and wrote from inside the life she actually had. A fair reading of her letters. Deliberately does not claim the illness improved or deepened her work - the provenance note forbids that framing.",
      text: `Somewhere in those years, something turned. Not in her body. Her body kept failing. What turned was how she met it.

She stopped writing like someone waiting to get her real life back. She started writing like someone whose real life was this one. The farm. The crutches. The short hours. The end that wasn't far off.

That is a quiet thing to change, and it changed everything. She stopped measuring the day against the day she wished she had. She measured it against what was actually in front of her. Some mornings that was three hours. She took the three hours.

She never beat the illness. That was never on the table. What she refused was to let it have the one thing she could still give.

The shortened life turned out to be a whole life. She just had to build it at the size she had actually been given.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: two novels and more than thirty stories written in small daily windows; death at thirty-nine; her stature grew enormously after her death. Published story counts vary between thirty-one and thirty-two, so the wording stays approximate. Name and titles withheld for the bridge.",
      text: `She kept it up until almost the very end.

The illness took her far too young. She was still in her thirties. By then she had written two novels and more than thirty short stories. Nearly all of it came out of those small morning hours.

And the work did not fade with her. It grew. Today she is counted among the finest writers her country has ever produced. People who care about writing still study her sentences. Her strange, hard, unforgettable stories are read all over the world, long after she ran out of mornings.

She did not spend the time she had being angry that it was short. She filled it. That was her whole answer to it.

A few clear hours a day, for a handful of years, was enough to make something that outlived her by generations.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Flannery O'Connor.

She is one of the greatest short-story writers America has produced. She wrote nearly all of her work in two or three morning hours a day. She wrote it on her mother's farm, on crutches, with an illness she had carried since she was twenty-five. She never got the long, open future she had planned. She made something lasting out of the short, hard one she got instead. None of that was in sight on the day the illness first hit her.

Your life is not theirs. But a piece of this story may still sit beside you.

She didn't pretend it wasn't bad. She didn't promise herself it would get better. She took the few good hours each day gave her, and she put everything she had into them.

You don't have to have a long, easy life ahead of you to make it count. She didn't. She used what she had.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. 30 Sept 1951 Kalgoorlie, Western Australia; Perth physician; with pathologist
//    Robin Warren proposed that H. pylori (not stress/diet/acid) causes most ulcers/gastritis,
//    curable with antibiotics; the field dismissed it (dogma: nothing survives stomach acid, and
//    for nearly a century ulcers were blamed on stress, spicy food and drink); 1983 the
//    Gastroenterological Society of Australia rated his abstract in the bottom tier of that year's
//    submissions (accounts say bottom 10-20%, so the copy stays vague); animal infection failed;
//    July 1984 (age 32) he drank an H. pylori broth after a normal baseline endoscopy, developed
//    gastritis by day 8 as predicted, and began antibiotics on day 14; published in the Medical
//    Journal of Australia, 1985; full acceptance took about a decade; 2005 Nobel in Physiology or
//    Medicine with Warren. (Nobel biographical; Marshall et al., Med J Aust, 1985; Marshall &
//    Warren, The Lancet, 1984.)
//  Interpretive: the "right but powerless" isolation, the maddening pity, and watching a room stop
//    listening. Grounded.
//  Avoid saying: don't name Marshall / Nobel / H. pylori / "ulcers" before the bridge, and don't
//    state the old stress-and-worry explanation in its textbook form - "the textbooks blamed the
//    patient" is as close as beat 0 may go, because naming stress-causes-ulcers identifies him.
//    Don't call what he drank poison - it was a cultured bacterium, not a toxin. He is living - use
//    present tense in the reveal. Don't overstate the self-experiment as instantly decisive;
//    vindication still took years.
const marshall: FigureStageRow = {
  figureKey: "marshall",
  displayName: "Barry Marshall",
  birthYear: 1951,
  stageId: "1982-1984-drinking-the-proof",
  stageLabel: "Mocked for the theory: the year he drank the proof",
  ageMin: 31,
  ageMax: 33,
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
  biographicalFacts: `Barry James Marshall was born September 30, 1951, in Kalgoorlie, Western Australia. As a young physician in Perth, working with the pathologist Robin Warren, he became convinced that most stomach ulcers and gastritis were caused not by stress, diet, or excess acid — the settled medical wisdom of nearly a hundred years — but by a bacterium, Helicobacter pylori, that could be eradicated with antibiotics. The medical establishment dismissed the idea; it was a fixed belief that no bacteria could survive the acid of the stomach. In 1983 the Gastroenterological Society of Australia rejected his abstract, reviewers rating it in the bottom tier of the submissions they received that year. His attempts to infect animals failed, and he could not ethically infect patients. Frustrated, and unable to get the field to take him seriously, in July 1984, at age thirty-two, Marshall had a baseline endoscopy confirming that his own stomach was healthy and then drank a broth teeming with H. pylori. Within days he developed nausea and vomiting; on day eight a second endoscopy and biopsy showed marked gastritis and a positive H. pylori culture, exactly as he had predicted. On day fourteen he began antibiotics and recovered, and he published the self-experiment in the Medical Journal of Australia in 1985. The self-experiment helped turn the tide, though full acceptance by the field took about a decade. Marshall and Warren were eventually vindicated, and in 2005 they were awarded the Nobel Prize in Physiology or Medicine. Stomach ulcers, once a chronic, recurring misery for millions, are now routinely cured.`,
  sources: [
    "\"Barry J. Marshall - Biographical,\" The Nobel Prize, nobelprize.org.",
    "Marshall, B. J., and J. R. Warren. \"Unidentified curved bacilli in the stomach of patients with gastritis and peptic ulceration.\" The Lancet (1984).",
    "Marshall, B. J., et al. \"Attempt to fulfil Koch's postulates for pyloric Campylobacter.\" Medical Journal of Australia (1985).",
    "Marshall, Barry, ed. Helicobacter Pioneers (Oxford: Blackwell, 2002).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A junior doctor far from elite centers, with a colleague, proposing a cause for a common painful illness that contradicted a century of textbooks - all documented. The old explanation is kept vague on purpose: stating it plainly identifies him.",
      text: `There was a young doctor. He was in his early thirties.

He worked in a hospital far from the famous centers of medicine. He had noticed something, with a colleague, about why a very common and very painful illness happened. What he saw did not match the textbooks. It did not match what the senior doctors said either.

The textbooks blamed the patient. Their nerves. The way they lived. He thought that was wrong. He thought the real cause was something small, and that it could be treated. He thought millions of people were suffering for no good reason.

He was probably right. He had the beginnings of proof.

The trouble was, he was nobody. Young. Unknown. From the wrong place. And he was telling the most powerful people in his field that they had had it wrong for a hundred years.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The establishment's dismissal, the specialist society rating his work in the bottom tier, and his failed (ethically limited) attempts to prove it are documented. Watching a room stop listening is dramatized characterization of a documented pattern.",
      text: `They did not take it well.

He brought his evidence to the experts, and they brushed it off. It went against everything they knew, so they decided he was the one who was confused. A famous society of specialists looked at his work and ranked it near the very bottom of everything they got that year.

People in his field smiled at him the way you smile at someone who doesn't understand how things really work. He would stand up to make his case. He would watch the room stop listening before he finished.

He knew he was right. That was the worst part. It is one thing to be wrong and rejected. It is another to be right and rejected. To watch people keep suffering from something you could fix. To watch everyone who could help pat you on the head and move on.

He tried to prove it properly. The experiments he was allowed to do didn't work. He was stuck.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Unable to infect animals or to infect patients ethically, he chose himself; a baseline check confirming his own health came first. Documented. The quiet, private decision is fairly characterized.",
      text: `So he made a decision most people would call insane.

If he couldn't prove it on anyone else, he would prove it on the only person he was free to risk. Himself.

First he had himself checked, so no one could say he was already sick.

He took the thing everyone swore was harmless. The small thing he believed was the real cause. He swallowed a whole dose of it on purpose.

Then he waited to get sick.

He didn't tell many people first. He just did it, quietly. Then he watched his own body to see who was right: him, or a hundred years of medicine.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "He got sick on schedule, documented it with a second look inside, treated himself, and kept pushing; one self-experiment did not instantly convert the field. All documented.",
      text: `It worked, in the worst possible way. He got sick, exactly the way he had predicted. Nausea. Throwing up. His insides inflamed and overrun, right on schedule.

He had made himself ill to win an argument. And even then, it wasn't instant. One man making himself sick doesn't flip a whole field overnight. There were still doubters. Still people who didn't want to admit it. Someone so junior, so far from the center of things, had seen what they had all missed.

He treated himself and got better. He wrote up exactly what had happened. Then he kept pushing. He had put his own body on the line, and he was not going to let them ignore it now.

Slowly, the evidence became impossible to wave away.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "As others tested the theory, the simple treatment worked and the old belief fell; full acceptance took about a decade, which the beat now says plainly. \"A fact doesn't care how junior you are\" is editorial framing of a real shift.",
      text: `The thing about a fact is that it doesn't care how junior you are.

Other doctors started testing his idea. And it held. People with the painful illness got the simple treatment he had proposed, and they got better. Really better, not just for a while. The experts had only ever been able to hold the illness off. He had a way to end it.

It took years. But once enough people had checked it for themselves, the argument was over. Not because he had shouted loudest. Because he had been right, and being right, in the end, was enough.

The young nobody from the wrong place had seen something the whole field had missed. And he had been willing to make himself sick to force them to look at it.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "He earned his field's highest honor, shared with the colleague from the first beat; the illness became routinely curable. Name and prize withheld for the bridge.",
      text: `He became one of the most respected people in his field — the same field that had laughed at him.

The illness that used to torment millions of people for years on end became a thing a doctor could simply cure. That happened because of what he and his colleague found. People who will never know his name live easier lives because he refused to back down.

The same people who had ranked him at the bottom ended up honoring him. The man they had laughed at ended up at the very top.

He hadn't been crazy. He had just been early, and stubborn. He would not let a comfortable lie stand when he had the truth in his hands.

Sometimes the whole room is wrong. Sometimes the person they are laughing at is the one who is right.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name is Barry Marshall.

He proved that most stomach ulcers are caused by a bacterium, not by stress, and that antibiotics can cure them. The medical world laughed at him for years, until he drank a broth of the bacteria himself to prove it. In 2005 he and his colleague won the Nobel Prize. An illness that wrecked millions of lives is now something a course of antibiotics can cure. None of that had happened yet when he was standing in front of a room that had already stopped listening.

Your life is not theirs. But a piece of this story may still sit beside you.

For a long time, being right got him nothing but pity and closed doors. He didn't have power, or fame, or important friends. He just had the truth, and enough stubbornness to keep holding it up until the world finally looked. Being doubted by everyone is not the same as being wrong.

You don't have to be believed yet. He wasn't, for years.`,
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
//    before the bridge. Beat 1 also withholds that the relative who died had led the country -
//    naming the office would let a reader identify her before the reveal; say only that her family
//    was tied to the government that fell. Beat 5 also withholds the ritual of starting every
//    book on the same date - it is the most repeated public fact about her and a reader would
//    place her instantly. She is living - present tense in the reveal.
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
  biographicalFacts: `Isabel Allende was born August 2, 1942, in Lima, Peru, into a Chilean family, and grew up in Chile, where she became a journalist. After her father left the family, much of her childhood was spent in her maternal grandfather's house in Santiago; the grandfather, a great teller of family stories, helped raise her and stayed the central figure of her early life. In September 1973 a military coup overthrew the government of her relative, Chile's president, who died during the takeover. The country became dangerous, especially for those connected to the fallen government; in 1975 Isabel fled with her husband and two children to Venezuela, where she lived in exile in Caracas for thirteen years. Exile was disorienting and lonely: she struggled to find journalism work and felt she had lost her country and her footing. On January 8, 1981, hearing that her beloved grandfather, nearly a hundred years old, was dying back in Chile, she began writing him a letter she knew he would never read. The letter kept growing, filling with the family stories and the memories of the country she had lost, and it became a novel — The House of the Spirits. Rejected by several Spanish-language publishers, it was published in Barcelona in 1982 and became an international sensation. Allende went on to become one of the most widely read Spanish-language authors in the world. To this day she begins every new book on January 8th.`,
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
        "Anonymized. A journalist with a settled life in her home country, and a deeply loved near-centenarian grandfather full of stories - documented. Her expectation of growing old there, near him, is dramatized texture, not a recorded statement. Place and names withheld for the bridge.",
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
        "The coup, the danger to anyone tied to the government that fell, and her flight abroad with her husband and children are documented. Her relative's identity and death are withheld here so the bridge keeps the reveal.",
      text: `Then her country fell apart.

Soldiers took the government by force. People were arrested. People disappeared. Her own family was tied to the side that fell. Overnight, the place she knew became a place where it was dangerous to be who she was.

She had to run. She gathered her husband and her children and left. They crossed into another country — a safer one, but not hers. Not even close.

And there, the full weight of it landed. She had lost her home. Her work. The people who knew her. The grandfather she loved was back there, out of reach, and she could not go to him.

She was a grown woman starting over from nothing, in a place that would always look at her as a stranger. She didn't know who she was anymore, without the country that used to hold her up.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "She held her family together, took what scarce work she could in exile, and kept the lost country alive in memory. Documented in Paula. The remembered streets and smells are generic texture, not a specific documented scene. \"Saving up what she'd need\" is editorial foreshadowing.",
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

She was not back home. She was not really at home where she was either. She was always a little foreign, always a little homesick. The old life got further away every year.

She was in her late thirties now. The work she had been known for felt like another person's life. If you had asked her what she was, she might not have had an answer. The country that used to tell her who she was, was gone. Nothing had come to replace it.

She kept going. But she was lost, and she knew it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "On 8 Jan 1981 a phone call told her that her grandfather was dying and out of reach, and she began a letter to him that grew into The House of the Spirits. Documented. The nightly rhythm of the writing is compressed from her own accounts; no words of the letter are quoted.",
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
        "The rejections by publishers and the book's international success and millions of readers worldwide are documented. Her habit of starting each new book on the same calendar date is documented too, but withheld here - it is the most repeated public fact about her and would name her before the bridge. Her name is withheld from the beats and revealed in the bridge; the book's title is withheld throughout, including in the bridge.",
      text: `That book made her.

She had written it to hold onto a country she had lost. It turned out to speak to people everywhere. Publishers turned it down, and then it was printed, and then it was everywhere. The stranger in the borrowed country became a writer read by millions of people, all over the world.

She had found the work she was made for. Not back home, where life was comfortable and she knew everyone. She found it in exile, with everything stripped away, when she had nothing left but her memories and a page.

She kept writing. Book after book, for decades. She never forgot which night it had all started — the night she sat down to write to a dying old man.

She lost the country. What she found instead was the work.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name is Isabel Allende.

She is one of the most widely read writers in the Spanish language. Her books have sold tens of millions of copies, in dozens of languages, and she has been writing them for more than forty years. None of that had happened yet on the night we just sat with her, writing a letter to a man she could not reach.

Your life is not theirs. But a piece of this story may still sit beside you.

She lost her home, her work, and her sense of who she was. For years she was nobody, in a place that wasn't hers. She was almost forty before she found the thing she was made to do.

Losing the old life is not the same as losing yourself. She didn't know that yet either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.26 Nov 1895 East Dorset, Vermont; WWI vet, 1920s Wall Street speculator; severe
//    alcoholic - ruined finances, health, and his marriage to Lois; repeated stays at the Towns
//    Hospital (1933-34) under Dr. Silkworth (alcoholism-as-disease); his newly-sober friend Ebby
//    Thacher visited him Nov 1934; he entered Towns for the last time 11 Dec 1934 (age 39) - the
//    sobriety date he kept - and during that stay had a sudden overwhelming experience that lifted
//    the obsession; came to believe he stayed sober by carrying the message to other alcoholics;
//    met Dr. Bob Smith, an Akron surgeon, 12 May 1935; Smith's last drink 10 Jun 1935 is the date
//    AA dates its founding to; wrote the Twelve Steps and was principal author of the 1939 "Big
//    Book"; known publicly only as "Bill W." per the anonymity tradition; d.24 Jan 1971. (AA "Big
//    Book"; "Pass It On"; Cheever, My Name Is Bill.)
//  Interpretive: the shame-of-the-addict interior and "connection, not willpower." The "something
//    gave/shifted" deliberately under-specifies his spiritual experience (which he described
//    variously) - do not over-religious it. Beat 4 renders the Akron conversation as indirect
//    speech; none of its actual words are on record.
//  Avoid saying: don't name AA / "Alcoholics Anonymous" / the Twelve Steps / Bill / Dr. Bob before
//    the bridge. The reveal leans on the anonymity ("Bill W.") - but the bridge's first line must
//    be exactly "His name was Bill Wilson." on its own line (displayName), with the alias in the
//    next sentence. Beats 0-5 must also stay un-guessable: no "fellowship", no meeting format
//    ("honest with each other", "the next person through the door", "keep showing up"), no
//    worldwide scale, no surgeon/Akron/1935, and no recovery-culture formulas - not "one drunk
//    to another" (the "one alcoholic talking to another" slogan), not "something bigger than
//    himself" (the higher-power phrasing). The growth and the reach belong in the bridge. Don't
//    moralize about addiction; render it as the compulsion/disease the record describes. Don't
//    put a membership number on AA - the cited sources don't establish one.
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
  biographicalFacts: `William Griffith Wilson was born November 26, 1895, in East Dorset, Vermont. A veteran of the First World War, he became a Wall Street stock speculator in the 1920s. He was also a severe alcoholic, and his drinking grew steadily worse, wrecking his finances, his health, and his marriage to his wife, Lois. Through 1933 and 1934 he was hospitalized repeatedly at the Charles B. Towns Hospital in New York under Dr. William Silkworth, who taught him that alcoholism was a kind of disease rather than a moral failing. In November 1934 an old drinking friend, Ebby Thacher, who had gotten sober through the Oxford Group, visited Wilson and showed him it was possible. Thacher's message was that he had stopped trying to do it on his own: he had admitted he was beaten and had turned himself over to a power greater than himself. Wilson entered Towns Hospital for the last time on December 11, 1934; that is the sobriety date he kept, and he never drank again. During that stay, in deep despair, he had a sudden, overwhelming experience that lifted his obsession to drink. He came to believe he stayed sober by carrying the message to other alcoholics. On May 12, 1935, on a failed business trip to Akron, Ohio, terrified he would drink, he sought out another struggling alcoholic — a local surgeon, Dr. Bob Smith — and worked with him. Smith took his last drink on June 10, 1935, the date Alcoholics Anonymous dates its founding to. The fellowship Wilson co-created spread around the world. He wrote the twelve steps and was the principal author of the book at its core, published in 1939, and, honoring the tradition of anonymity, he was known publicly only as "Bill W." He died January 24, 1971.`,
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
        "Anonymized. A once-promising, ambitious man whose alcoholism cost him work and health and was destroying his marriage, with a long history of broken promises to quit - all documented. The glass in his hand is generic texture, not a recorded scene.",
      text: `There was a man. He was in his late thirties.

Once he had been on his way up. Sharp, ambitious, good at his work. He was married to a woman who believed in him. But something had its hooks in him, and it was winning.

He drank. Not the way some people drink. The way that takes everything. It had cost him his work. It was costing him his health. It was breaking the heart of the woman who loved him, slowly, in front of him.

He had promised to stop more times than he could count. He had meant it every time. And every time he ended up back in the same place. A glass in his hand. A fresh load of shame on his back.

He was starting to believe he was simply beyond help.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Repeated hospitalizations, the despair and shame of relapse, and the collapse of the belief that willpower could fix it are documented. What he assumed the doctors thought of him is interior texture, not a recorded thought. The bottom precedes his recovery experience.",
      text: `He ended up in a hospital. Again.

The doctors there knew him. They had dried him out before, and watched him walk out and come right back. He knew what they must think of him. He thought worse of himself.

Lying in that bed, he hit the bottom of everything. He had tried so hard, for so long, to control this on his own. To be strong enough. To want it badly enough. And he had failed, over and over and over.

The shame of it was crushing. He was a man who hurt the people he loved most, knew it, and couldn't stop.

There was nothing left of his pride. Nothing left of the idea that he could fix himself by trying harder.

He was out of his own ideas.

And it was right there, with nothing left, that something finally gave.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His surrender of the willpower model, and the influence of a newly-sober friend who showed recovery was possible by leaning on others, are documented. The spiritual experience is left under-specified on purpose.",
      text: `He stopped fighting it alone.

That was the strange key. For years he had treated this as a battle of willpower. Him against the drink. He had lost every round. Now, with no strength left, he gave up the idea that his own strength was the answer.

He held onto something a friend had shown him. The friend had been just as far gone, and had gotten sober. Not by being tougher. By admitting he was beaten, and leaning on other people.

The man in the bed grabbed that idea the way a drowning person grabs a rope.

He didn't drink that day. Or the next. Something had shifted that he couldn't explain. The craving had let go of him.

He knew it could come back.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The fragility of early sobriety and the failed business trip where he feared he would drink are documented and set up the turn. The hour-by-hour feeling of that afternoon is dramatized texture.",
      text: `Staying sober turned out to be its own daily fight.

The first days are one thing. The real test comes later. An ordinary afternoon, months in, when the old pull comes back quiet and reasonable and tells you one won't hurt.

He held on. But he could feel how fragile it was. He was one bad night away from losing everything he had just barely gotten back.

Then came a trip away from home that went badly. A deal fell through. He was alone in a strange town, discouraged. It was exactly the kind of moment that had always sent him back to the drink.

He could feel it coming for him. The craving, rising.

He knew how this usually went. His sobriety was going to come down to what he did in the next hour.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Instead of drinking, he sought out another struggling alcoholic (Dr. Bob Smith, 12 May 1935) and sat with him - documented. That helping kept him sober is his own stated conviction, recorded in the facts as a belief. None of the words they exchanged are on record, so the conversation is rendered as indirect speech, never as quotation.",
      text: `So he did something that didn't quite make sense.

Instead of looking for a drink, he went looking for another person like himself. Another hopeless case. Someone else who was drowning in the exact same way.

He found one. A man in that town who was deep in it, just as he had been. He sat down with him and talked. Not as an expert with answers. As one wrecked man to another. He told him where he had been, and what was helping.

And here is what he found out. Helping that man helped him. Sitting with someone else's struggle held his own craving off better than willpower ever had. In trying to save another person, he saved himself.

That was the secret. Not strength. Other people. One person who had been there, reaching for the next one.

He didn't drink that day. He spent it sitting with someone else who couldn't stop.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The group grew from that first pairing and he stayed sober for life - both documented. That helping others is what kept him sober is his own stated conviction, recorded in the facts as a belief. No membership number is claimed; the cited sources do not establish one. His name, the name of what he founded, and the scale it reached are all held back for the bridge, so the reader cannot identify him here.",
      text: `That one conversation became two. Then a small group. Then more.

He and the man he had helped started looking for others. People who had been to the bottom the same way they had. There was nothing clever about it. They told each other the truth, and neither of them had to do it alone.

It worked when nothing else had worked. And it kept working. For him, and then for people he never met.

He had gone into that strange town sure he was one bad hour from losing everything. He came out of it holding the one thing that had kept him sober. Another person who needed the same help he did.

He stayed sober the rest of his life. He did it the same way he had that first day. By helping the next person who couldn't.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Bill Wilson.

Almost everyone who knows what he built knows him only as Bill W. He and the man he sat with that day co-founded Alcoholics Anonymous. The thing he stumbled into was simple. People who have hit bottom can stay sober by helping each other, one day at a time. It became a fellowship that reaches around the world, and it is still going. He kept his last name out of it on purpose. He thought the help mattered more than any one person's name. None of that had happened yet on the day we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He didn't beat the thing that was destroying him by being strong. He beat it by admitting he couldn't do it alone. Then by reaching for someone else who was struggling too.

You don't have to carry it by yourself. He couldn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. June 27, 1949, NYC; began skating at 8; competed in pairs at the 1968 U.S.
//    championships and failed to qualify for the Olympic team; joined Vogue in 1971, one of its
//    youngest fashion editors at 23, ~17 years there, senior fashion editor; left in 1987 without
//    the top job. NOTE: Anna Wintour became editor-in-chief in 1988, the year AFTER Wang left
//    (Grace Mirabella held the post 1971-1988), so do NOT write that the job was handed to Wintour
//    in front of her; ~2 years as a Ralph Lauren accessories design director; married Arthur Becker
//    in June 1989 at 40; unable to find a gown she loved, she designed her own and had a dressmaker
//    make it; opened her bridal business in New York in 1990 at 41; became a world-famous bridal
//    and fashion designer (CFDA Womenswear Designer of the Year 2005, CFDA Lifetime Achievement
//    2013, National Medal of Arts 2021). (Wang, Vera Wang on Weddings; Encyclopedia.com,
//    "Vera Wang Bridal House Ltd."; Olympics.com interview.)
//  Interpretive: "two near-misses, then a third start"; the flat grief of doing everything right and
//    still not getting the thing; that the skating discipline and the editor's eye fed the design
//    work (an observation in career profiles, not a claim she made in these words). Grounded.
//  Avoid saying: don't name Wang / Vogue / wedding dresses / the skating-Olympics / Wintour before
//    the bridge - and don't describe them in all but the name either. A blind stranger test on
//    beats 0-5 named her from the wedding-dress origin, the exact "seventeen years," and "one of
//    the youngest ever," so those are now blurred in the beats ("something she needed," "the
//    better part of twenty years," "young for that job"). She is living - present tense in the
//    reveal. The skating + magazine + bridal combo IS the reveal; keep them generic ("a sport,"
//    "a well-known company") until then.
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
    "After seventeen years at a company, the top job she had worked toward went to someone else, and she walked away with nothing to show for the climb.",
    "She didn't find the work she would be known for until she was forty, in a field she had never worked in, starting from scratch.",
  ],
  facets: {
    emotionalCore:
      "She felt the flat, disorienting grief of doing everything right and still not getting the thing — of looking up in mid-life and realizing the path you bet on simply is not going to open.",
    decisionShape:
      "Whether to accept that her best years and chances were behind her after two long roads led nowhere, or to start over a third time, from zero, in something completely new and late.",
    triggerEvent:
      "After failing years earlier to reach the top of the sport she had trained for, she spent seventeen years climbing at a company — and then left it without ever being given the leadership job she had worked toward.",
    agencyState:
      "She had talent, taste, and a long resume, and none of it had delivered the thing she wanted; what she still controlled was whether to risk starting a brand-new career when it felt far too late.",
  },
  biographicalFacts: `Vera Ellen Wang was born June 27, 1949, in New York City. She began figure skating at eight and competed seriously through her teens, skating in pairs with James Stuart at the 1968 U.S. Figure Skating Championships. They did not qualify for the Olympic team, and Wang has said she was devastated. She graduated from Sarah Lawrence College and joined Vogue in 1971, and at twenty-three she became one of the magazine's youngest fashion editors, later senior fashion editor. She spent about seventeen years there and left in 1987 without ever being given the magazine's top job. The editor-in-chief post went to Anna Wintour in 1988, the year after Wang's departure; Grace Mirabella held it until then. Career profiles describe Wang's exit as the result of being passed over for that job, while other accounts say she left because she wanted to design clothes rather than write about them. She then spent about two years at Ralph Lauren as a design director for women's accessories. She married Arthur Becker in June 1989, at forty. Unable to find a wedding gown she loved, she designed her own and hired a dressmaker to make it. She left Ralph Lauren and opened her own bridal business in New York in 1990, at forty-one, with backing from her father. Vera Wang became one of the best-known bridal and fashion designers in the world, dressing brides, celebrities, and Olympic figure skaters, including Nancy Kerrigan at the 1994 Winter Olympics. She won the CFDA Womenswear Designer of the Year award in 2005, the CFDA Lifetime Achievement Award in 2013, and the National Medal of Arts in 2021. Career profiles note that the discipline of her skating years and the eye she developed as a fashion editor both carried into her design work.`,
  sources: [
    "Wang, Vera. Vera Wang on Weddings (New York: HarperCollins, 2001).",
    "\"Vera Wang Bridal House Ltd.,\" International Directory of Company Histories, via Encyclopedia.com.",
    "\"Fashion designer Vera Wang on her 'devastated' Olympic figure skating dreams,\" Olympics.com.",
    "Council of Fashion Designers of America award records (Womenswear Designer of the Year, 2005; Lifetime Achievement, 2013); National Endowment for the Arts, National Medal of Arts recipients (2021).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Documented: she began skating at eight, competed seriously through her teens, and failed to qualify for the Olympic team. The sport and the level she was reaching for are both left unnamed for the bridge. The beat no longer dates her ambition to age eight - what is documented is when she started, not when she set the goal. No invented scene detail.",
      text: `There was a young woman who had spent her whole life chasing one thing.

A sport. She had trained at it since she was a little girl. Hours on end, year after year. It was who she was. When people asked what she did, that was the answer.

She was good. Good enough to compete against the best. Good enough to believe the very top was within reach.

Then came the test that mattered most. The one she had been working toward her whole life.

She didn't make it.

Just like that, the thing she had built her whole young life around was over. The door she had been running toward closed. She was standing on the wrong side of it, with no idea what she was supposed to do now.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: about seventeen years at a well-known magazine, one of its youngest editors, senior fashion editor, and she left in 1987 without the top job. Deliberately does NOT say the job was handed to a rival in front of her - the editor-in-chief post was filled the year after she left. The exact tenure and the 'youngest ever' detail are blurred in the beat - a blind stranger test named her from them - so it says the better part of twenty years, and young for the job. Company unnamed for the bridge.",
      text: `She picked herself up and built a second life.

She found a new field, nothing like the first, and she was good at this too. She joined a well-known company and worked her way up. Year after year. Climbing, proving herself, getting closer to the top.

She gave it the better part of twenty years. She had been young for that job when she got it, young enough that people noticed.

The top job never came to her.

She waited, and she worked, and in the end it went to someone else. After all that time, the top of this second mountain turned out to be another door that would not open for her.

So she left. And there she was, no longer young, with two long roads behind her. Each one had taken her almost to the top and then stopped.

Twice she had given everything to a path. Twice it had not opened.

What do you even do with that?`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: about two years designing accessories for someone else's label while she approached forty. The 'too late' pressure is a fair reading of the period, not something she is quoted saying.",
      text: `She didn't fall apart. She kept moving.

She took another job in the same world. She worked for someone else and learned more of the craft. It was good work. It just wasn't hers.

She was still looking for the thing that was actually hers. And she was running low on time to find it, or so the world kept telling her.

She was almost forty. In the work she had done, that was supposed to be late. The big dreams were supposed to be behind her by then. The sensible thing was to settle. Be grateful for a good-enough career. Stop reaching.

She wasn't ready to stop reaching.

She just didn't know yet what she was reaching for.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Compression of the stretch between leaving the magazine and starting her own business. The in-between feeling - competent but unfulfilled, and old by her industry's standards - is interpretive, not sourced to her.",
      text: `For a while she lived in that in-between place.

Good at her work, but not in love with it. Doing fine on paper, but quietly sure she hadn't done the thing she was meant to do yet. And old enough, by the rules of her business, to wonder if she had missed her shot for good.

It is a particular kind of hard. Not dramatic. Just heavy. She had done everything right. She had worked, she had climbed, she had been good. And the life she pictured never quite arrived.

She carried that around for a while. Two near-misses behind her. Forty in front of her. No clear idea what came next.

Then the answer came from the most ordinary place there is.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: she married at forty, could not find a gown she loved, designed her own and had a dressmaker make it, then started her own business in a corner of the industry she had never worked in. The occasion and the garment are both left unnamed here - stated plainly they identify her - so the bridge delivers them. The 'eye and discipline' line is career-profile interpretation, not her own words.",
      text: `It came out of her own life.

There was something she needed, and she wanted it to be right. She looked everywhere for it and couldn't find anything she loved. Everything she saw felt wrong. She had spent a whole career judging what was good and what wasn't. She knew exactly what she wanted, and exactly why nothing out there measured up.

So she designed it herself, and had someone make it.

And somewhere in doing that, something clicked that two whole careers never had. This. This was it. The eye she had built in one life, the discipline she had built in the other, all of it finally had somewhere to go.

At an age when she was supposed to be winding down, she decided to start something brand new. Her own business. In a corner of the work she had never actually done. From nothing.

Plenty of people would have called it late. She started anyway.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the business she started at forty made her one of the best-known names in her industry. That her skating years and her magazine years fed the design work is an observation in career profiles, not a claim she made in these words. Name and field withheld for the bridge.",
      text: `It worked.

The thing she started at forty made her one of the most famous names in her whole industry. She had come into it as a beginner. People all over the world know her work now.

And the two failures that had broken her heart turned out to be the training. The sport had taught her to practice something until it was right. The long climb had trained her eye. The new work asked for both.

Nothing was wasted. Not the years on the first dream that didn't happen. Not the long climb that ended one step short of the top. It all fed the thing she finally became — the thing that had been waiting for her on the other side of forty.

She had spent half her life sure she had missed her moment.

Her moment hadn't come yet. That was all.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name is Vera Wang.

She is one of the most famous fashion designers in the world, known above all for her wedding dresses. She designed her first one for herself, at forty, because she couldn't find one she loved. Before that she had failed to make the Olympic figure-skating team as a young woman. Then she gave seventeen years to a magazine and never got the top job there. None of what she is known for had happened yet on the morning we just sat with her.

Your life is not theirs. But a piece of this story may still sit beside you.

Twice she gave everything to a path and watched it close. She could have decided, very reasonably, that her chances were behind her. She started over instead, at forty, at something she had never done.

You don't have to be on time. She wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1888; published poems, reviews and journalism in London in his early twenties,
//    then gave writing up for business; married Cissy Pascal (18 years his senior) in 1924; Los
//    Angeles oil-company executive (vice president, Dabney Oil Syndicate); drinking, absenteeism,
//    and affairs during the Depression; fired in 1932 at age 44; broke, he taught himself pulp
//    writing by taking apart and rewriting a novelette by Erle Stanley Gardner; first story
//    "Blackmailers Don't Shoot" in Black Mask, 1933; first novel The Big Sleep, 1939 - the year he
//    turned 51 - introducing the detective Philip Marlowe; a founder of hard-boiled crime fiction
//    alongside Hammett and the writer most credited with raising it to literature; Hollywood
//    screenwriter (Double Indemnity, The Blue Dahlia; two Oscar nominations); d.1959. (Chicago
//    Public Library biography; Hiney, Raymond Chandler: A Biography; MacShane, ed., Selected
//    Letters of Raymond Chandler.)
//  Interpretive: the midlife shame of self-inflicted failure; "the only door left." Grounded.
//  Avoid saying: don't name Chandler / Marlowe / The Big Sleep / detective fiction before the
//    bridge. Don't moralize the drinking (Wilson is the addiction figure) - here it's context for
//    the firing, and the through-line is the late reinvention. Don't say he invented hard-boiled
//    fiction (he shared its founding with Hammett and the other Black Mask writers), and don't pin
//    the first novel to age 51 - the publication month is unsettled and he was fifty until late
//    July 1939, so the beats say "past fifty."
const chandler: FigureStageRow = {
  figureKey: "chandler",
  displayName: "Raymond Chandler",
  birthYear: 1888,
  deathYear: 1959,
  stageId: "1932-1939-fired-to-the-first-novel",
  stageLabel: "Fired at forty-four: teaching himself a new craft in the wreckage",
  ageMin: 44,
  ageMax: 51,
  themes: ["late_start", "public_failure", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "He wrecked a good executive career through his own drinking and got fired at forty-four, in the worst economy of his life, when starting over was supposed to be impossible.",
    "Broke and middle-aged, he taught himself an entirely new craft from scratch, studying cheap magazines like a schoolboy because it was the only door left.",
    "He did not publish the first real book of his new life until he was past fifty — and it turned out to be the start of everything he is remembered for.",
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
  biographicalFacts: `Raymond Thornton Chandler was born July 23, 1888. As a young man in London he published poems, reviews and sketches and worked briefly as a newspaper reporter, then gave writing up for business. He married Cissy Pascal, eighteen years his senior, in 1924. He became a successful executive in the Los Angeles oil business, rising to a vice presidency at the Dabney Oil Syndicate. During the Great Depression his heavy drinking, absenteeism, and affairs caught up with him, and he was fired in 1932, at age forty-four. Broke and middle-aged in a collapsed economy, he went back to the writing he had given up and taught himself pulp fiction — reportedly by making a close study of a novelette by Erle Stanley Gardner, writing his own version from a synopsis of it, and comparing the two. His first story, "Blackmailers Don't Shoot," appeared in the pulp magazine Black Mask in 1933, when he was forty-five, for very little money. He published more stories through the 1930s, sharpening his style, and in 1939 — the year he turned fifty-one — published his first novel, The Big Sleep, introducing the private detective Philip Marlowe. It drew serious critical notice without making him rich or widely known; that came in the 1940s. Chandler went on to become one of the most influential crime writers in the English language, a founder of the hard-boiled school alongside Dashiell Hammett and the writer most credited with raising it to literature, and later a celebrated Hollywood screenwriter (co-writing Double Indemnity, 1944, and The Blue Dahlia, 1946, each of which brought him an Academy Award nomination). He died in 1959.`,
  sources: [
    "Hiney, Tom. Raymond Chandler: A Biography (London: Chatto & Windus, 1997).",
    "MacShane, Frank. The Life of Raymond Chandler (New York: E. P. Dutton, 1976).",
    "MacShane, Frank, ed. Selected Letters of Raymond Chandler (New York: Columbia University Press, 1981).",
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
        "Fired at 44 in the depths of the Depression, and the unemployability of a middle-aged man with a bad reputation, are documented. The shame is editorial but well-grounded. The men standing in lines is general Depression context, not a documented scene; the wife is documented (married 1924) and now sits in the facts.",
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
        "Documented: he had written and published in London as a young man before going into business, and he taught himself pulp writing by taking apart one novelette by another writer, rewriting it and comparing the two. Beginner again at forty-five is accurate. The trains and the hand-copying in the earlier draft were invented and are gone; the genre stays unnamed for the bridge.",
      text: `So he tried something almost embarrassing for a man his age.

He decided to teach himself to write.

He had wanted to write once, long ago, before business swallowed the years. Now, with nothing left to lose, he went back to it. He got hold of the cheap magazines and studied them like a student. He picked one story he liked and took it apart. He wrote his own version, then set the two side by side to see what the other man knew.

Then he started writing his own.

He was a beginner again at forty-five. He wrote, rewrote, threw things away, and tried again.

He had no idea if any of it was good. It was the only door left, so he kept walking toward it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of low-paying pulp stories through the 1930s, gradually refining his voice, are documented. No sudden break preceded the first novel. He was 45 to 50 across these years, so the beat stays in his forties; the pay figure is out because the rubric bars amounts.",
      text: `It took years.

The first little stories sold for almost nothing. He wrote one, then another, then another. Each one a little better than the last. He was learning his own voice slowly, in his late forties, story by story.

There was no overnight anything. No big break. Just a middle-aged man at a desk, doing the slow, boring work of getting good at something late. The clock running. The money tight.

He kept at it. The drinking, the lost job, the shame — none of that had stopped him. He was a beginner in his forties and he stayed at the desk anyway.

He was building toward something. He just couldn't see how big yet.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "First novel published in 1939, introducing a distinctive new voice - documented. The beat says past fifty rather than fifty-one: no source gives a publication month and he was fifty until late July 1939. That it did not make him rich or immediately famous is the conservative reading; the wider fame came with the films of the 1940s. The genre, the book and the detective are held back for the bridge.",
      text: `Then, past fifty, his first novel came out.

A real book. Built out of everything he had taught himself in those years of cheap stories. It had a voice in it unlike anything else out there. Hard and clean and a little heartbroken. It sounded like nobody else, because it was his.

It did not make him rich. It did not make him famous overnight.

But people who cared about books noticed. This wasn't cheap stuff anymore. This was something new.

The man who had been fired in disgrace at forty-four had taught himself to write from magazines. Now he had written a book people would still be reading long after he was gone.

At an age when most people are settled — finished becoming whoever they are going to be — he had just become a writer.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "His later novels, his influence on other writers, and his Hollywood screenwriting (two Oscar-nominated screenplays) are documented. He was a founder of that school of writing alongside Hammett and others rather than its inventor, so the beat no longer says he invented it. Name, titles, genre and the character he created are all held back for the bridge.",
      text: `He had found it. Late, but completely.

He wrote more novels. Other writers studied him the way he had once studied those cheap magazines. The movies came calling, and he helped write some of the most admired films of his day. He spent the rest of his life doing the work he had taught himself at forty-five.

The voice he had built at a desk in middle age — that hard, sad, beautiful way of putting things — outlived him completely. People still read him. People still copy him. He did not do it alone, and he did not do it first. But he was the one who made that kind of writing count as real writing.

And he didn't even start until he had already failed, been fired, and run out of other options.

The end of his old life turned out to be the beginning of the only one that mattered.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Raymond Chandler.

He became one of the great crime writers in the language. He created the private detective Philip Marlowe, and he turned a cheap kind of story into something people call literature. Writers and filmmakers still copy him. And he did not publish his first novel until he was past fifty — more than six years after being fired at forty-four. None of that had started yet on the day he lost the job.

Your life is not theirs. But a piece of this story may still sit beside you.

He had every reason to believe his best years were behind him. He'd had a career and wrecked it himself. He was too old, by all the usual rules, to begin again. So he began anyway, from scratch, at an age when you're supposed to be done.

You don't have to be early. He wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.16 Jun 1917; daughter of Eugene Meyer, who bought The Washington Post at a
//    bankruptcy auction in 1933 and handed the paper to her husband, Phil Graham, in 1946 rather
//    than to her; Phil was charismatic, domineering, and belittling, and had bipolar disorder; he
//    died by suicide on 3 Aug 1963; Katharine, 46, took over the company that September; she was
//    gripped by self-doubt, had no women in comparable roles to learn from, and was not taken
//    seriously by the men around her; she made the call to publish the Pentagon Papers (Jun 1971,
//    at 54) and backed the Watergate reporting through 1972-74; Nixon resigned Aug 1974; she led
//    the company until 1991; memoir Personal History won the Pulitzer (1998); d.17 Jul 2001.
//    (Graham, Personal History; Britannica.)
//  Interpretive: "raised to pour the coffee," the impostor dread, and "nobody would have been
//    surprised" if she had sold - drawn from her memoir and from how widely she was underestimated.
//  Avoid saying: don't name Graham / The Washington Post / Pentagon Papers / Watergate before the
//    bridge, and keep the words story, print, reporters and the government out of beats 0-5 - a
//    newspaper heiress whose husband died makes her guessable. Beat 4 stays at "something powerful
//    people wanted kept quiet." Handle the husband's death gently in-beat ("died suddenly"); the
//    suicide stays in the facts, not the prose. Don't imply she sought power - it was thrust on her.
const graham: FigureStageRow = {
  figureKey: "graham",
  displayName: "Katharine Graham",
  birthYear: 1917,
  deathYear: 2001,
  stageId: "1963-1971-thrust-into-the-chair",
  stageLabel: "Thrust into the chair: a diminished wife who became formidable",
  ageMin: 46,
  ageMax: 54,
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
      "Whether to hold the family business in name only and let capable men run it, or to take a job she felt wholly unequal to and risk failing at it in public.",
    triggerEvent:
      "Her husband, who ran the powerful family company, died suddenly, leaving the business — and a role she had never been prepared for — abruptly in her hands.",
    agencyState:
      "She suddenly held enormous power she had never been trained to use and did not believe she deserved, surrounded by men who did not take her seriously and assumed she would fail.",
  },
  biographicalFacts: `Katharine Graham was born June 16, 1917, the daughter of the financier Eugene Meyer, who bought The Washington Post at a bankruptcy auction in 1933. Katharine married Philip Graham in 1940, and in 1946 her father handed the paper to her husband rather than to her - a choice she accepted as natural for the time. Phil Graham was brilliant and charismatic but also domineering and often belittling toward her, and he suffered from severe bipolar disorder. On August 3, 1963, he died by suicide. At forty-six, having spent her adult life as a wife and mother in his shadow, Katharine took over the company in September 1963 to preserve it for her children. She was gripped by self-doubt, felt like an impostor among the powerful men of the business, had no women in comparable positions to learn from, and was widely underestimated by the men around her. She learned the job in public. In June 1971 she made the decision to publish the Pentagon Papers over advisers who warned of grave legal and financial risk to the company; the administration asked the paper to stop and went to court for an injunction. Through 1972-74 she backed her reporters' Watergate investigation despite intense political pressure, including a crude threat aimed at her by John Mitchell, President Nixon's former attorney general; Nixon resigned in August 1974. She was president of the company from September 1963, publisher of the paper from 1969 to 1979, and chairman of the board from 1973 to 1991. She became one of the most powerful and respected publishers in America. Her memoir, Personal History, won the Pulitzer Prize for Biography or Autobiography in 1998. She died on July 17, 2001.`,
  sources: [
    "Graham, Katharine. Personal History (New York: Alfred A. Knopf, 1997).",
    "Felsenthal, Carol. Power, Privilege, and the Post: The Katharine Graham Story (New York: Putnam, 1993).",
    "\"Katharine Graham,\" Britannica.",
    "New York Times Co. v. United States, 403 U.S. 713 (1971) (consolidated with United States v. Washington Post Co.).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Documented: raised to be a wife; her father owned the family business and handed it to her husband rather than to her; her husband was charismatic and often belittling; her diminished self-image is documented in her memoir. Dramatized: the parties and the household routine stand in for years of daily life, not one recorded evening.",
      text: `There was a woman in her forties.

She had been raised, her whole life, to be a wife. A good one. The daughter of a powerful man, married to a brilliant, charming, difficult one. Her husband ran the important family business. Her own father had owned it first, and had handed it to her husband instead of to her.

She kept the house. She raised the children. She stood a little behind her husband at parties and let him shine. That was the role. Nobody had ever taught her there was another one.

He could be cruel to her. He made her feel small, and slow, and not very bright.

She had come to half-believe it. She thought of herself as a wife, a hostess, a helper. Nothing more. Certainly not someone who could ever run anything herself.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: her husband's sudden death, her abrupt and unprepared inheritance of the company, and her terror and impostor feelings. The suicide is softened to \"died suddenly.\" Dramatized: \"nobody would have been surprised\" is an inference from how widely she was underestimated, not a recorded expectation of any particular person.",
      text: `Then her husband died, suddenly, and everything fell on her.

The business — the big, important, powerful one — had no one to run it. It was hers now, by family. But she had never been groomed for it. She had been groomed to pour the coffee.

She could have sold it. She could have handed it to a man who already knew the work, and gone quietly back to her old life. Nobody would have been surprised. That was what a woman in her position did.

She thought so too, at first. She was terrified. She walked into rooms full of powerful men who had spent their whole careers in this world. She felt like a fraud. A housewife playing at a job she had no business holding. She second-guessed every word out of her own mouth.

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
        "Documented: years of learning a complex business in public, being underestimated by the men around her, and gradually coming to trust her own judgment. Dramatized: several years are compressed into a few lines; no particular meeting or remark is claimed.",
      text: `For a long time it was hard and lonely.

She was learning an enormous, complicated business in public. There was no room for error, and an audience half-hoping she would stumble. The men around her were polite, mostly. Polite in the way that doesn't quite hide the rest.

She kept at it. She learned. Slowly, the job stopped feeling like a costume. She started having opinions. Then she started trusting them. Then she started acting on them.

She had spent her whole life keeping that voice quiet. She had been taught it wasn't worth much. It turned out to be sharp, and steady, and right more often than the loud, confident men around her.

She was becoming something nobody had expected. Including herself.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the decision to make public material powerful people wanted buried, the grave legal and financial risk to the company, the frightened advisers, the threats from the administration, and her backing her people again under worse pressure. Every identifying specific is stripped and nothing is quoted - the newspaper detail is what gives her away.",
      text: `Then came the test that decided everything.

Something came into her company's hands that powerful people badly wanted kept quiet. Making it public could have brought the whole business down. Her advisors were frightened. The threats came from people who could actually carry them out.

It came down to her. One decision, hers alone, with everything on the line.

The woman who used to think she wasn't smart enough to have an opinion looked at the risk. Then she looked at what was right. She said go ahead.

And when it got more dangerous after that, she stood behind her people. Again. And again.

The frightened housewife everyone expected to fold turned out to have more nerve than any of the men who had doubted her.

When it mattered most, she didn't blink.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: more than two decades running the company (president from September 1963, chairman of the board 1973-1991), being taken seriously by powerful men once she had proved herself, and never fully losing her early self-doubt. Dramatized: the scared woman in the meeting is a composite of years, not a recorded scene. Name withheld for the bridge, and the scale of her power is kept general so the beat does not identify her.",
      text: `She ran that company for more than twenty years. She had learned it in public, one hard year at a time.

She turned it into one of the most respected of its kind. And she became genuinely powerful. The men who had once talked past her were careful with her now. They knew exactly how tough she was.

The girl who was raised to pour the coffee had become someone whose decisions mattered to a great many people.

And she never quite lost the memory of the scared woman in the meeting, sure she didn't belong. She just stopped letting that woman have the final say.

She had been underestimated her whole life. Most of all by herself. It turned out she was the last one to find out who she really was.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Katharine Graham.

She ran The Washington Post for more than two decades. She made the call to publish the Pentagon Papers. She stood behind the reporters who uncovered the Watergate scandal. The president resigned two years later. By then she was one of the most powerful and respected people in America. Her memoir, Personal History, won the Pulitzer Prize. None of that had happened yet on the morning her husband died and the job landed in her hands.

Your life is not theirs. But a piece of this story may still sit beside you.

Almost nobody expected her to manage it. She least of all. The doubt didn't go away. She just kept walking into the room anyway, until one day she looked up and found she was the strongest person in it.

You don't have to feel like the right person for it. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b.1902; maize geneticist; discovered transposition ("jumping genes") ~1944-48,
//    presented it at a 1951 symposium and met near-silence, then mumbling, snickering and open
//    complaints - with one or two exceptions nobody in the room understood it; deeply disappointed,
//    she stopped publishing those results in the main journals and stopped lecturing on them
//    (~1953) but never stopped the research, working in relative isolation with a reputation as
//    brilliant but eccentric; confirmed in the 1960s-70s as molecular biology caught up; solo Nobel
//    in Physiology or Medicine 1983 (age 81), the first woman to win it unshared; she found the
//    ceremonies arduous and the publicity repugnant (paraphrase; exact memoir wording
//    unverified) and she never retired; d.1992.
//    (Keller, A Feeling for the Organism; Fedoroff, NAS Biographical Memoir; Nobel; Britannica.)
//  Interpretive: "she loved the work for itself, so being ignored couldn't stop her, only delay the
//    recognition." A fair reading of her documented temperament.
//  Avoid saying: don't name McClintock / Nobel / "jumping genes" / corn-maize before the bridge.
//    Don't make her a bitter martyr - the record shows equanimity, not resentment. Don't say she
//    enjoyed the late honors - the record says the opposite.
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
  biographicalFacts: `Barbara McClintock was born June 16, 1902. A maize geneticist of extraordinary gifts, she spent decades in painstaking observation of corn and, in the 1940s, discovered "transposition" — that genetic elements can move and rearrange themselves on the chromosome (now called transposons, or "jumping genes"). It overturned the assumption that the genome was a stable, fixed thing. She presented the work at a scientific symposium in the summer of 1951. The talk was met with near-silence; afterward there was mumbling, some snickering, and open complaints. With one or two exceptions, no one in the room understood it, and the idea ran against the deepest assumption of the field. Colleagues who respected her ability found the concept so strange, and her experiments so hard to follow, that she was widely regarded as brilliant but eccentric, and she worked for much of her life alone. Deeply disappointed, around 1953 she stopped publishing her transposition results in the main journals and stopped lecturing on them — she stopped trying to convince anyone — but she never stopped the research itself, and went on reporting it in institutional yearbooks and symposium volumes. Only in the 1960s and 1970s, as molecular biology matured, did other scientists find transposition in bacteria, viruses and yeast and confirm what she had seen; her work was then recognized as foundational. Recognition arrived late and in a rush: the National Medal of Science in 1970, a MacArthur grant and the Lasker Award in 1981, and in 1983, at age eighty-one, the Nobel Prize in Physiology or Medicine — the first woman to win that prize unshared. She did not enjoy it: the National Academy of Sciences memoir records that she found the ceremonies arduous, the attendant publicity and adulation repugnant, and that she longed for her privacy. She never retired. She stayed at her laboratory and kept working almost to the end of her life. She died September 2, 1992.`,
  sources: [
    "Keller, Evelyn Fox. A Feeling for the Organism: The Life and Work of Barbara McClintock (San Francisco: W. H. Freeman, 1983).",
    "Fedoroff, Nina V. \"Barbara McClintock, June 16, 1902-September 2, 1992.\" Biographical Memoirs (Washington, DC: National Academies Press, 1995), 211-235.",
    "\"The McClintock Renaissance and the Nobel Prize, 1978-1992,\" Barbara McClintock - Profiles in Science, U.S. National Library of Medicine, profiles.nlm.nih.gov.",
    "\"Barbara McClintock and the discovery of jumping genes,\" Proceedings of the National Academy of Sciences (2012), doi:10.1073/pnas.1219372109.",
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

She was brilliant — everyone in her field knew it. She had spent her whole life looking very, very closely at one kind of plant. Season after season. Decades of patient watching. She understood that plant better than almost anyone alive.

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
        "The 1951 talk met near-silence, then mumbling, snickering and open complaints; with one or two exceptions no one in the room understood it - documented. The interior shutting-down is a fair reading.",
      text: `She stood up in front of the other scientists and showed them what she had found.

And they didn't get it.

Worse than didn't get it — they looked at her like she had lost her way. What she was describing went against the deepest assumptions of her field. Almost nobody wondered if she might be onto something. They mostly decided she had gone strange. Too long alone with her plants.

The room went quiet while she talked. Blank faces. Afterward there was muttering, and some of it was laughter. Almost no one understood.

She had handed them the discovery of her life, and they had handed it back as if it were nothing.

She was not a person who showed much. But something in her closed that day. She had been so sure they would see it. They hadn't. And she did not know how to make them.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Around 1953 she stopped publishing her transposition results in the main journals and stopped lecturing on them, rather than fight for acceptance, but never stopped the research - documented. Framing the withdrawal as a deliberate, dignified choice is a fair reading.",
      text: `So she made an unusual choice.

She stopped trying to convince them.

She didn't argue. She didn't fight for credit, or campaign, or water down her findings to make them easier to swallow. She also didn't quit. She did something quieter and stranger than either.

She just kept working. Alone. She stopped sending the results no one understood out to the journals. She stopped giving the talks that fell flat. She went back to her plants and kept following the truth wherever it led, whether or not anyone ever came along.

She decided the work was worth doing even if she was the only person alive who knew it mattered.

So she did it. For years. In near-total scientific silence.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Decades of relative scientific isolation and her reputation as brilliant but eccentric are documented. That she never grew bitter is Keller's reading of her temperament, not a stated fact.",
      text: `The years stretched on. A lot of them.

She worked in a kind of exile — not forced out, exactly, just quietly set aside. People saw her as the odd one in the corner, doing her out-of-date thing. Younger scientists came up barely knowing what she had discovered. Her great finding sat there, unread, ahead of its time, waiting.

It would have been so easy to grow bitter. To decide the world was stupid and stop. Or to want the recognition so badly it poisoned the work.

She did neither. She kept her head down and kept looking, and she let being right be its own reward, since it was the only reward on offer.

Decade after decade. The truth she had found just sat there, patient, while the world slowly built the tools to finally understand it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Confirmation of transposition in bacteria, viruses and yeast in the 1960s-70s, the late flood of honors, and the top prize at eighty-one are documented; so is her dislike of the ceremonies and the publicity. Name and prize withheld for the bridge.",
      text: `And then, slowly, the world caught up to her.

New tools came along. New discoveries. Other scientists pushed deeper into how living things really work. They kept bumping into the exact thing she had seen, alone, decades before. The impossible idea that had gotten her dismissed turned out to be simply true.

People went back and read the work everyone had ignored. And they realized this quiet woman had seen, half a lifetime early, something the whole field was only now able to grasp.

The recognition came in a flood, late. The highest honors. The award that sits at the very top of her science.

She was an old woman by then. She did not enjoy any of it. The ceremonies wore her out, and the attention was close to unbearable. What she wanted was her privacy and her plants. She had already had the thing that mattered: she had been right, and she had never stopped doing the work.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Her discovery became foundational and is now textbook biology - documented. That she loved the work for its own sake and did not need applause is Keller's reading, consistent with her documented dislike of publicity. Name and prize withheld for the bridge.",
      text: `She had been right. About all of it.

The discovery they had dismissed became one of the foundations of how we understand life itself. It is in the textbooks now — the same kind of textbooks that once said she was wrong. Students learn her finding as basic fact, often without ever knowing the woman who waited thirty years for the world to believe her.

She never needed them to clap. That was her strange power. She had loved the work for itself, not for what it could get her. So when the world ignored her, it couldn't actually stop her. It could only be late.

She had spent the lonely decades doing exactly what she would have done if she had been famous. Looking closely. Telling the truth about what she saw.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Barbara McClintock.

She found "jumping genes" — the discovery that the genetic code can move and rearrange itself. It is one of the most important findings in all of biology. In 1983 she won the Nobel Prize in medicine for it, alone — the first woman ever to win that prize on her own. None of that had happened yet on the day she stood up and showed them what she had found.

Your life is not theirs. But a piece of this story may still sit beside you.

For most of her life, the people who should have understood her work simply didn't. She didn't let that make her bitter, and she didn't let it make her stop. She trusted what she had seen. She kept doing the work in the dark, for as long as it took.

Being right early can look a lot like being wrong. You don't have to be believed yet. She wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. March 17, 1912, West Chester PA; Quaker; master nonviolent strategist of the
//    civil-rights movement; beaten and arrested in Tennessee in 1942 for refusing to move to the
//    back of an interstate bus; imprisoned 1944-46 as a conscientious objector; 22 days on a North
//    Carolina chain gang after the 1947 Journey of Reconciliation; chief organizer and deputy
//    director of the 1963 March on Washington, Aug 28 (200,000+ people; 250,000 the most cited
//    estimate); gay, openly so for the era; a January 1953 Pasadena morals-charge arrest (guilty
//    plea, 60 days in jail) was used repeatedly to discredit him; kept out of public leadership and
//    denied credit (Roy Wilkins: "we must not put a person of his liabilities at the head"; Sen.
//    Strom Thurmond attacked him on the Senate floor weeks before the march); Quaker ethic of not
//    pushing oneself forward; largely written out of the movement's history for decades; d. Aug 24,
//    1987; posthumous Presidential Medal of Freedom, 2013. (Branch, Parting the Waters; the King
//    Institute; the NPS biography; the White House Aug 8, 2013 award announcement.)
//  Interpretive: the loneliness of being needed but hidden; "doing right matters more than being
//    seen." Grounded in his documented Quaker upbringing and practice.
//  NOT claimed: that he built the march "in under two months." Accounts differ on when organizing
//    began (Randolph and Rustin had discussed such a march since 1961), so no duration is asserted
//    in biographicalFacts or in any beat. Do not restore it without a primary source.
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
  biographicalFacts: `Bayard Rustin was born March 17, 1912, in West Chester, Pennsylvania, and raised a Quaker. A master strategist of nonviolent protest, he became one of the most important organizers of the American civil rights movement and a key teacher of its philosophy of nonviolence. He paid for that work early: he was beaten and arrested in Tennessee in 1942 after refusing to move to the back of an interstate bus; he was imprisoned from 1944 to 1946 as a conscientious objector who refused the draft; and he served twenty-two days on a North Carolina chain gang after the 1947 Journey of Reconciliation. In 1963 he was the chief organizer and deputy director of the March on Washington for Jobs and Freedom, held August 28, which brought more than 200,000 people peacefully to the capital — the day of the most famous speech in the movement's history. Rustin was also an openly gay man at a time when that was dangerous; in January 1953 he was arrested in Pasadena, California, pleaded guilty on a morals charge and served sixty days in jail, and that record was used against him for the rest of his career. Though leaders knew how essential he was, many worked to keep him out of public view and to deny him credit, fearing his sexuality and his past would be used to discredit the cause; Roy Wilkins objected that "we must not put a person of his liabilities at the head," and Senator Strom Thurmond attacked him on the Senate floor weeks before the march as a communist, a draft dodger and a homosexual. Shaped by a Quaker conviction that one should not push oneself forward, Rustin did the work from the background. For decades he was written out of the movement's popular history. He died August 24, 1987, and was posthumously awarded the Presidential Medal of Freedom, the nation's highest civilian honor, in 2013.`,
  sources: [
    "Branch, Taylor. Parting the Waters: America in the King Years 1954-63 (New York: Simon & Schuster, 1988).",
    "\"Rustin, Bayard,\" The Martin Luther King, Jr. Research and Education Institute, Stanford.",
    "\"Bayard Rustin,\" National Park Service, People (nps.gov) - birth and death dates, Quaker upbringing, deputy director and logistical planner of the March on Washington, twenty-two days on a chain gang after the 1947 Journey of Reconciliation.",
    "\"President Obama Names Presidential Medal of Freedom Recipients,\" The White House, Office of the Press Secretary, August 8, 2013 - posthumous award citation for Bayard Rustin.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. Documented: a master organizer of a justice movement who was beaten and arrested in 1942 for refusing to move to the back of a bus, imprisoned 1944-46 as a conscientious objector, and sentenced to a chain gang after a 1947 protest ride - yet was little known publicly. The movement is kept generic for the bridge.",
      text: `There was a man, around fifty, who was the quiet engine behind a great cause.

He was one of those people who make enormous things happen and are almost never seen doing it. Brilliant at it. He could take an impossible idea and turn it into a real plan. Who stands where. Who does what. How to move a sea of people safely toward one goal.

He believed in justice for people who had been denied it, and he had given that belief everything. His freedom. His safety. His young years. He had gone to jail for it. He had been beaten for it.

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

He was a gay man, in a time and place where that could destroy you. He had never been able to hide it completely. Once, years before, it had been used to shame him in public. That day followed him for the rest of his life.

And so the very movement he was helping to build kept him in the shadows. The leaders knew exactly how good he was. They needed him. But they were afraid. If his enemies pointed at who he loved, it could be used to discredit everything.

So he was told, again and again: do the work, but stay in the back. Don't lead, where people can see you. Let other men stand at the front and take the credit.

He had given his life to this. And the people he gave it to were ashamed to be seen with him.

That is a particular kind of lonely.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His Quaker ethic of not pushing himself forward, and his choice to keep working from the background without credit, are documented.",
      text: `He could have walked away. He could have gone to the press. He could have let the bitterness eat him.

He didn't.

He kept doing the work. Brilliantly. Without his name on it.

He had been raised in a faith that taught him not to push himself to the front. The point was the truth, and the good you do. Not the credit you collect for doing it. He took that seriously. If the cause needed him in the shadows, he would work in the shadows.

So he gave it everything, knowing the applause would go to other men. Doing the right thing mattered more to him than being seen doing it.

And then he was handed the hardest job of all.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "He organized an enormous, high-stakes mass gathering from the background, with disaster a constant risk - documented (the 1963 March on Washington), rendered generically. No claim is made about how long he had: accounts differ on when organizing began, so the earlier 'weeks, not months' line was removed. Crowd size and the speakers are kept off the page so the figure stays unguessable.",
      text: `They asked him to build the hardest thing the cause had ever tried. A crowd larger than anything he had organized before. One place. One day. And it had to stay peaceful.

He got one try at it. If a single thing broke — violence, chaos, too few people, too many — everyone would see it. The cause would carry that for years.

And he had to do all of it from the back. Quietly. Without the authority that comes from being a public leader, because he wasn't allowed to be one.

He worked around the clock. He thought of everything. The water. The routes. The sound. The safety. The ten thousand small things no one would ever thank him for.

He carried the whole impossible thing on his shoulders, in the dark.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The day was a peaceful, historic success and he ran its logistics from behind the scenes while others spoke. Documented; the speakers, the famous speech and the crowd size are kept off the page. 'It worked because he made it work' is editorial emphasis on his documented planning role, not a claim that he acted alone.",
      text: `The day came.

And it held. The crowd came, and it stayed peaceful. No chaos. No disaster. The thing everyone had feared simply did not happen. It became one of the strongest days that cause would ever have.

It worked because he made it work. The routes, the sound, the calm — a man almost no one could see had thought all of it through first.

He stood at the edge of the enormous thing he had built and watched it work. Other men stood at the front. Other men's names were the ones people learned. That was how it had always been for him.

He did not get up front. That was the deal. But he knew. He knew exactly whose hands had built this.

Sometimes that has to be enough. For him, that day, it was.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "He was written out of the movement's popular history for decades, then rediscovered and honored, including a posthumous national honor. Documented. Name and the specific honor withheld for the bridge.",
      text: `For a long time, history did what the movement had done. It left him out.

The day got remembered. The men who stood at the front got remembered with it. The man who had actually built it stayed a footnote. He was pushed out of the records for the same reason he'd been pushed to the back in life. Because of who he loved.

But the truth has a way of surfacing. Slowly, people went back and asked who had really made that day happen. And they found him. The quiet genius in the back. They began, finally, to say his name out loud.

Long after he was gone, his own country honored him in public, by name, for what he had done. It was the recognition it had denied him while he lived.

He had done the work without it. But it was right that it finally came.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Bayard Rustin.

He was the chief organizer of the March on Washington in 1963 — the day of the most famous speech in the movement's history. He was a master of nonviolent protest who helped shape the whole civil rights movement. And he was kept in the background for decades, denied the credit he had earned, because he was a gay man. Long after his death, his country gave him the Presidential Medal of Freedom. None of that had happened yet on the day we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He did some of the most important work of his century and watched other people take the credit for it. He didn't stop. He decided the work itself was worth doing, seen or unseen.

You don't have to be seen to matter. He wasn't, for a long time.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 9, 1890 (Henryville, IN); many failed early jobs/ventures; built the
//    successful Sanders Court & Cafe on US-25 in Corbin, KY, locally famous for his fried chicken
//    (pressure-cooker + "11 herbs and spices"); FIRST handshake franchise signed 1952 with Utah
//    restaurateur Pete Harman, still only six-to-eight franchisees by 1956; the US-25 route that
//    ran past the cafe was relocated about a mile north (Interstate 75 bypassed the town later,
//    in the early 1970s), which took the passing traffic and killed the business;
//    the property was VALUED near $165k but brought only ~$75k at the March 1956 auction, just
//    enough to clear his debts and taxes; at 65, with almost nothing, he drove the country cooking
//    the chicken for restaurant owners and selling "handshake" franchises for a few cents a bird;
//    600+ outlets by 1963; sold the company for $2M in January 1964 (age 73) to John Y. Brown Jr.
//    and Jack C. Massey; d. Dec 16, 1980. (Corbin KY Tourism / Harland Sanders Cafe and Museum;
//    Northeast Mississippi Daily Journal; FOX 13 Salt Lake City on Harman; standard biographies.)
//  Interpretive: the "earned a rest, then the ground dropped out" framing. Grounded.
//  Avoid saying: don't name Sanders / Colonel / KFC / Kentucky Fried Chicken / "fried chicken"
//    before the bridge. Beats 0-5 must also drop the brand's giveaway markers: no "one of the most
//    famous foods on earth," no face-on-signs / logo, no per-plate cents figure, and no exact
//    "sixty-five" (the beats say mid-sixties; the bridge carries the age and the reveal).
//    STRIP the motivational-poster myth: NOT "$105 Social Security check," NOT
//    "rejected 1,009 times," and NOT "he owed $165k" - $165k was the property's appraised value,
//    not his debt. The real story is the auction and the road-trip franchising. Soften era markers
//    (the highway is fine; keep exact dates/places out). Some sources say he was 74 at the 1964
//    sale; the January 6, 1964 close makes him 73, so the entry says seventy-three.
//    A blind reader named him again from beats 0-5, so the identifying legs are now removed
//    rather than softened. Beats 0-5 no longer contain: a road, a highway, a route change or
//    bypass; a restaurant, a kitchen, cooking, a dish or a recipe; the words franchise or
//    handshake; a payment per item sold; any outlet count or scale marker; the sale price;
//    or any claim of fame. What he was known for is only "the one thing he did"; the collapse
//    is "something outside his control changed and the people stopped coming"; the demos are
//    "he would do it for them himself"; the deal is only "they would pay him for it"; the
//    growth is "more people than he could get to"; the ending is that it passed into other
//    hands and he was paid enough never to worry about money again. Every specific stays in
//    biographicalFacts, and the bridge still names him, the brand and the highway.
const sanders: FigureStageRow = {
  figureKey: "sanders",
  displayName: "Harland Sanders",
  birthYear: 1890,
  deathYear: 1980,
  stageId: "1956-broke-at-sixty-five",
  stageLabel: "Broke at sixty-five: the highway, the auction, and the road",
  ageMin: 62,
  ageMax: 72,
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
      "A new highway routed traffic around his town and destroyed the roadside business he had built, and the forced sale of it brought far less than the place was worth, leaving him with almost nothing at sixty-five.",
    agencyState:
      "He had lost his business and the years he should have been able to coast on, and was left with one thing entirely his: a recipe and the method to cook it.",
  },
  biographicalFacts: `Harland David Sanders was born September 9, 1890. His early life was a long string of jobs and ventures that mostly failed or fell apart. In middle age he finally found something that worked: a roadside restaurant and motel, the Sanders Court & Café, on a busy highway (U.S. 25) in Corbin, Kentucky, where travelers stopped for the fried chicken he cooked, using a pressure cooker and a blend of seasonings. In 1952 he signed his first handshake franchise agreement with a Utah restaurateur, Pete Harman, whose cafe put the dish on its menu as "Kentucky Fried Chicken" and saw its sales more than triple in the first year; by 1956 he still had only six or eight franchisees. Then the highway that had run past his door was rerouted around him, with the new Interstate 75 planned to bypass Corbin as well, and the passing traffic went away. The business collapsed. The property was valued at roughly $165,000, but when it was auctioned in March 1956 it brought only about $75,000, just enough to clear his debts and taxes. He was sixty-five, with almost nothing left. With his recipe, his pressure cooker and his seasonings in the car, he took to the road, cooking the chicken for restaurant owners on the spot and asking a few cents for each one they sold afterward — "handshake" franchise deals. Many turned him down; he kept going. By 1963 there were more than 600 outlets, the largest fast-food operation in the country. In January 1964, at seventy-three, he sold the company for $2 million to a group led by John Y. Brown Jr. and Jack C. Massey. It became Kentucky Fried Chicken, one of the most recognized food brands in the world. He died December 16, 1980.`,
  sources: [
    "\"Harland Sanders Cafe and Museum,\" Corbin, Kentucky Tourism.",
    "Sanders, Harland. Life As I Have Known It Has Been Finger Lickin' Good (autobiography, 1974).",
    "Ozersky, Josh. Colonel Sanders and the American Dream (Austin: University of Texas Press, 2012).",
    "Northeast Mississippi Daily Journal, 'Colonel Sanders sells motel, popular restaurant; he will be missed' (djournal.com).",
    "FOX 13 Salt Lake City, 'Pete Harman, Utah native who opened first KFC franchise, has died' (November 19, 2014).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Anonymized. A man with a long history of failed ventures who finally built a small business that thrived on the people passing through his town - documented. Withheld for anonymity: the kind of business, the kind of work he was known for, and the brand markers; all of it stays in biographicalFacts and the bridge.",
      text: `There was a man in his sixties.

He'd had a hard, scrappy life. Dozens of jobs, and a lot of them had gone wrong. But late in middle age he finally built something good. A small place of his own, in a town people passed through, and for once the work held.

He got known around there for one thing he did. People came for it, and then they came back.

It wasn't a fortune. But it was his, and it worked. After a lifetime of false starts, he could finally picture getting old without worrying about money.

He had earned a rest. He thought he was going to get one.

He had no idea the ground was about to drop out from under him, at the worst possible age for it to happen.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "A change he had no control over took away the passing trade the business lived on; it collapsed, was sold for far less than it was worth, and the proceeds went to his debts and taxes, leaving him with almost nothing at sixty-five - documented. The motivational-poster myths (the retirement check, a huge personal debt) are deliberately avoided. Withheld for anonymity: what the change was, the sale figures, his exact age, and the retirement-age line.",
      text: `Then the people stopped coming.

Something outside his control changed, and the flow of people who had kept his little place alive went somewhere else. It wasn't anything he had done wrong. There was nothing he could have done to stop it either.

His business dried up. He held on as long as he could, and then he had to let it go. It sold for a fraction of what it was worth. After his debts were paid, there was almost nothing left.

He was in his mid-sixties. Broke. The thing he had spent his best late years building was gone.

By every reasonable measure, he was too old to start over. The rest he thought he had earned was not coming.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Years before the collapse he had shown his way of working to an owner far from home, who did very well with it, and only a handful of others had taken it up; afterward he went out to others himself and was paid out of what it earned them - documented. No invented dialogue. Withheld for anonymity: the trade, the word for the arrangement, and the per-item share of every sale.",
      text: `He took stock of what he was left with.

It wasn't much. But there was one thing. The way he did the thing his place had been known for. That was still his. Nobody could take that away from him.

Years before, he had shown it to someone far away, and it had worked just as well for them. A few others had too. It had never been the main thing. Now it was the only thing.

So he decided to bring it to other people in the same line of work. He would do it for them himself. If it worked for them, they would pay him for it.

He got in his car and started driving. He was starting over from nothing, in his mid-sixties.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Long drives, frequent refusals, and demonstrating his way of working himself, on the spot, to convince owners; the deals accumulated slowly - documented for these years. No dramatized lodging or road detail. Withheld for anonymity: the trade, the kitchens, and the rejection-count parable.",
      text: `It was a hard, humbling way to live.

He drove long distances. He walked in and asked people half his age to trust an old man they had never met. A lot of them were not interested. Some looked at him like what he obviously was, an old man whose own place had failed, asking them for something.

So he would do it for them himself, right there, so they could see it was real. Some still weren't interested. He would thank them, and drive to the next town, and do it again.

For a man in his late sixties, it was exhausting. Most days gave him nothing to show for the miles.

But every so often, somebody was willing. And their people liked it and asked for it again. And slowly, one at a time, it started to grow.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The arrangements multiplied through his late sixties and early seventies while he kept working the road himself, and what he had lost came back far larger - documented. Withheld for anonymity: the trade, the outlet counts, the scale markers, and the industry.",
      text: `And then it caught.

One willing owner turned into a few. The people who tried it came back wanting it again, and other owners heard about that and wanted it too. It started spreading faster than he could keep up with.

By his early seventies, more people than he could get to were paying him for it. Men his age had stopped working years before. He was still driving. He was still doing it for them himself, in their own places, the same way he had from the start.

The small thing he had lost had come back, bigger than it had ever been when it was only his.

Losing it had not been the end of his story. It had forced the beginning of the part that would fill the rest of his life.

He had been right about the one thing he had left.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "What he built grew far past the small business he had lost, he kept working into his seventies, and it eventually passed into other hands for enough money to leave him secure for life - documented. Withheld for anonymity: the name, the trade, the brand, the sale figure, and the fame; the bridge carries all of it.",
      text: `It kept growing, far past the small place he had lost. Bigger than he could have pictured, standing in that empty building with nothing left.

The thing he knew how to do was being done every day by people he would never meet. He was still working at it in his seventies, long past the age when he could have stopped.

He had spent most of his life as a man whose ventures kept falling apart. For years he had been the one asking, the one nobody had a reason to trust. By the end, he was the one people wanted to hear from.

In the end he let it go into other hands. He was paid enough that he never had to worry about money again.

He was not a young man who got lucky. He was an old one who kept going.

Not despite starting late. Because he was willing to start at all, when everything said he was finished.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Harland Sanders.

You know him as Colonel Sanders. A new highway killed his roadside restaurant and left him broke at sixty-five. He spent the years after that driving the country, selling his fried chicken recipe one handshake at a time. It became Kentucky Fried Chicken, one of the most famous food brands in the world, and his face is still on it. None of that had happened yet on the morning we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He was sixty-five and wiped out, at the exact age when you're supposed to be done. He had every reason to call it a life and sit down. Instead he took the one thing he had left and started over.

You don't have to be young to begin. He wasn't.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. May 11, 1888 (Israel Baline, Russian Empire); family emigrated 1893 to the Lower
//    East Side; father Moses (part-time cantor) died July 1901 when Irving was 13; youngest child
//    of a large family, sisters in wage work, he sold newspapers; left home at 14 believing the
//    family was better off with one less mouth — by his own later account he was bringing
//    in less than even his sisters; Bowery lodging houses, sang in bars for pennies,
//    song-plugger work; 1906 (18) singing waiter at the Pelham Cafe in Chinatown; 1907 first
//    published song "Marie from Sunny Italy" — he wrote the words, the house pianist the music, and
//    his share came to 37 cents in royalties (some accounts say 33 cents for the rights); printer
//    credited "I. Berlin" and he kept the name; "Alexander's Ragtime Band" (1911, age 23) made him
//    internationally famous; never learned to read/write music fluently; supported his mother and
//    siblings later; died 1989 at 101.
//  Interpretive: the "did the math on himself and came out worth almost nothing" framing of why he
//    left home. Grounded in his own retrospective accounts.
//  Avoid saying: don't name Berlin / the Bowery / Chinatown / Pelham Cafe / song titles before the
//    bridge; no dollar amounts (the 37 cents becomes "less than the price of a meal"); soften era
//    (no "ragtime", no "Tin Pan Alley"; "bar", not "saloon" or "cafe", in the beats); the
//    misspelled-name detail stays but unnamed; don't claim he supported the family for life.
//    Keep the general-culture hooks out of the beats as well: not "never learned to read music",
//    not the holiday-standards description, not "lived past a hundred" — a blind reader named
//    him from those three. All three stay in biographicalFacts; the bridge names the two songs.
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
    "Irving Berlin was born Israel Baline on May 11, 1888, in the Russian Empire; his family fled anti-Jewish violence and arrived on New York's Lower East Side in 1893 with almost nothing. His father Moses, who had been a cantor and now worked in a kosher meat market, died in July 1901, when Israel was thirteen. Israel was the youngest child of a large family. Everyone in the family worked: his older sisters took wage jobs and his mother took in work as well; Israel sold newspapers and, by his own later account, was convinced he contributed less than any of his siblings. At fourteen he left home so the family would have one less mouth to feed, living in Bowery lodging houses and singing in saloons for pennies. He worked as a busker and then as a song plugger. In 1906, at eighteen, he became a singing waiter at the Pelham Cafe in Chinatown, where the owner asked him and the house pianist to write an original song after a rival cafe's singing waiter had published one. The result, \"Marie from Sunny Italy\" (1907), earned him 37 cents in royalties (some accounts instead report 33 cents for the publishing rights) — and the sheet-music cover credited the lyricist as \"I. Berlin,\" a printer's error he kept as his name. He wrote the words; the house pianist wrote the music. He kept writing. \"Alexander's Ragtime Band\" (1911), written when he was 23, became an international sensation and made him famous. He never learned to read or write musical notation fluently, composing everything by ear. He went on to write an estimated 1,500 songs, including \"White Christmas\" and \"God Bless America\", supported his mother and siblings, and died in 1989 at 101.",
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
        "Left home at 14 by his own choice, believing the family was better off; Bowery lodging houses were paid for night by night — documented. 'Nobody chased him down the stairs' and the nights he could not pay for a cot are dramatized texture for the documented lodging-house years.",
      text: `At fourteen he packed what he had, which was almost nothing, and left home.

Nobody told him to go. He left because he had decided his family was better off with one less mouth at the table. And nobody chased him down the stairs.

That was the part that stayed with him.

He slept in the cheap lodging houses at the bottom of the city. He was a boy on a cot in a room full of grown strangers. He paid for the cot one night at a time. Some nights he couldn't, and he walked until morning.

He was fourteen. As far as he could tell, the world agreed with his math. He wasn't worth much, and nobody had argued.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Sang for pennies in bars, at tables and on corners from about fourteen — documented; his singing voice is consistently described as small and thin. Making up his own words to popular tunes is documented from the singing-waiter years; placing the start of the habit earlier is interpretive.",
      text: `He had one thing. He could sing.

Not beautifully — nobody ever said beautifully. But he could carry a song and make a room feel like the night was going well.

So he sang wherever pennies might come back. In bars. At tables. On corners. He followed the coins, and when one place dried up he found another.

It wasn't a plan. It was rent for a cot, one night at a time. But it kept him alive, and it kept a song in his mouth all day, every day.

After a while he started making up his own words to the tunes everybody knew. Just to see if he could.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Years of busking and song-plugging (singing a publisher's songs in public so the sheet music would sell); never returned to school — documented. The 'learning what made a room lean in' framing is interpretive.",
      text: `Years went by like that. He never went back to school.

He got small jobs around music — the lowest ones there were. Singing other people's songs wherever there was a crowd, so that someone else could sell more copies. The boys who did that work were nobody, and they knew it.

But at night, in the noise, he was listening. He learned what made a room lean in and what made it turn away. He learned it the way you learn a language: by living inside it, broke.

He still had nothing to show for it. But he was becoming, without anyone noticing, a person who understood songs from the inside.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Singing-waiter job at 18; the owner demanded an original song after a rival place's singing waiter published one; he wrote the words and the house pianist the music; his share of the money came to well under a dollar (accounts give 33-37 cents); the printer's misspelling became his name — all documented. The pause over the misspelled cover is dramatized texture for the documented fact that he kept the name.",
      text: `At eighteen he got a steady job. He waited tables in a loud bar where the waiters were expected to sing while they worked.

A place down the street had a singing waiter who had written his own song, and it was getting attention. So the owner told the boy and the house piano player: write us one too.

He had never written a song. He wrote the words for one, and the piano player wrote the tune.

It got published. It sold almost nothing. His share of the money came to less than the price of a meal.

But on the printed cover, the printer had made a mistake. The name was spelled wrong — a new name, really. He looked at it for a while. It looked like someone who could be somebody.

He kept the mistake. And he kept writing.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "One song (1911) made him internationally famous; an estimated 1,500 songs, written by ear, never fluent in notation; lived to 101; supported his mother and siblings once he had money — all documented.",
      text: `The songs did not stop coming. He wrote in the noise of the bar, in the middle of the night, anywhere. A few years later, one of them took off — not in one city, everywhere. The kind of song strangers on two continents were humming in the same month.

The boy from the lodging houses became one of the most successful songwriters who ever lived. He wrote for the stage. He wrote for the movies. He wrote songs that people are still singing. And nobody ever taught him how. He worked it all out by ear — the ear he trained in rooms where he sang for pennies.

He lived a long life.

And the family he had left at fourteen, so they'd have one less mouth to feed? When he had money, he took care of them.`,
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
//    modeled his early singing on Nat King Cole; invented soul (gospel+blues) and was condemned
//    for it as sacrilege by preachers and by blues singer Big Bill Broonzy; 17 Grammys; first
//    class of the Rock and Roll Hall of Fame + Kennedy Center Honors (both 1986); "Georgia on My
//    Mind" became Georgia's state song (1979); d. 2004. Date note: the biographies say spring
//    1945 for the mother's death (kept in the facts); a user-submitted grave record says Aug 31,
//    1945, so the beats name no season.
//  Interpretive: "the voice that organized his world was the thing that vanished" framing; the
//    map-decision as self-invention. Grounded. Her "one rule" is paraphrased from her documented
//    line that he was blind but not stupid and would have to do for himself; she is not recorded
//    forbidding him to beg, so that wording is gone. The bridge no longer says "no home to go
//    back to" — the sources establish only that he left school and was taken in by family
//    friends, so the entry does not carry the stronger claim.
//  Avoid saying: don't name Ray Charles / Seattle / St. Augustine / Georgia before the bridge; no
//    pity register anywhere; the brother's drowning (pre-episode, he was ~5) is deliberately left
//    out of the beats; keep the mother's death un-graphic; no "soul music" before the bridge; and
//    keep the boxer-collision name change, the gospel-plus-blues pairing, the sacrilege charge, the
//    "people have been building on it ever since" influence claim and the touring/prizes out of beat
//    5 too. Three blind-reader tests named him anyway, so this pass strips the remaining headline
//    forms as well. Beat 0 no longer says the school was for blind children, names no instrument
//    and drops braille music, and gives his mother's rule as plain "nobody was going to carry him"
//    rather than any quotable version of it. Beat 1 drops the ranking of her death against the loss
//    of his sight — he is on record making it, but it travels as a signature line — and keeps the
//    feeling. Beat 4 drops the map question, the biggest-city-farthest-away answer and the five-day
//    count (the single most retold anecdote of this life, and the opening of the film about him),
//    keeping only that at seventeen he chose a far city he had never seen, knew nobody there, and
//    rode a bus for days alone. Beat 5 drops the name change too. The blindness, the mother's death
//    at 14, the band years and the fact of the move stay: they are the episode.
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
      "He had lost the one person who taught him he could survive, at exactly the moment he had to start surviving — fourteen, in the dark, and out of the household that had raised him.",
    decisionShape:
      "Whether to stay where people would look after a blind orphan, or to bet that the skill his mother had made him build could actually carry him.",
    triggerEvent:
      "His mother died suddenly when he was fourteen — the person who had refused to let his blindness make him helpless.",
    agencyState:
      "Blind, orphaned, and fourteen, with no money and no family home — but carrying a trained skill and his mother's one rule: do for yourself, because nobody else will do it for you.",
  },
  biographicalFacts:
    "Ray Charles Robinson was born September 23, 1930, in Albany, Georgia, and raised in deep poverty in Greenville, Florida, by his mother, Aretha (Retha) Robinson. His sight began failing around age five — probably from glaucoma — and he was completely blind by seven. His mother, determined that blindness would not make him helpless, made him do chores, find his own way around, and fend for himself, over the objections of neighbors who thought her too hard on him; by his own account, when he felt sorry for himself she told him he was blind but not stupid, and that he would have to do things for himself because no one else would do them for him. From 1937 to 1945 he attended the Florida School for the Deaf and the Blind in St. Augustine, where he learned to read braille music and to play piano and clarinet, and trained his memory to hold whole arrangements. In the spring of 1945, when he was fourteen, his mother died suddenly; she was in her early thirties. He later described it as the most devastating loss of his life, and said he could not cry until a family friend, an older woman known as Ma Beck, talked him through the grief. He did not return to school. Taken in by family friends in Jacksonville, he began sitting in with local bands at fourteen and made his living as a working musician around Florida — Jacksonville, Orlando, Tampa — from fifteen to seventeen, often broke and by his own account living some weeks on crackers and water, and learned to have his pay counted aloud, bill by bill, into his hand. In March 1948, at seventeen, he asked a friend to look at a map and find the biggest American city farthest from Florida; the friend traced a diagonal across the map and landed on Seattle. He rode a bus roughly five days across the country alone, knowing no one there. Within weeks he was playing Seattle clubs; within a year he had made his first recordings, and he dropped his surname to avoid confusion with the boxer Sugar Ray Robinson. He modeled his early singing on Nat King Cole before finding his own voice. He went on to fuse gospel and blues into what became soul music, a mixture preachers condemned as sacrilege and the blues singer Big Bill Broonzy called wrong because it mixed the blues with spirituals. He won seventeen Grammy Awards, was inducted in 1986 into the first class of the Rock and Roll Hall of Fame and received the Kennedy Center Honors the same year, and his recording of \"Georgia on My Mind\" became the official state song of Georgia in 1979. He died June 10, 2004.",
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
        "Blind by 7; his mother's insistence that he do things himself (chores, finding his own way, over other people's objections); a boarding school far from home; the trained musical memory — all documented. Withheld for anonymity: what kind of school it was, the instruments he played, and how he was taught to read music, plus any quotable form of his mother's rule — blind readers named him from that combination. The closing thought that being good at something felt almost like seeing is interpretive, not his words.",
      text: `There was a boy at a boarding school a long way from his home.

He had lost his sight slowly, when he was little. By the time he was seven the world had gone dark for good. His mother had almost nothing, and she had one hard rule about him: nobody was going to carry him. She gave him chores. She made him find his own way around. People told her she was too hard on him. She kept doing it.

At school he found the thing he was good at. Music. He could hear a song once and hold the whole of it in his head. He learned to play, and he got better fast, and being good at something felt almost like seeing.

Home was poor and far away. But it was there, and she was in it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Mother's sudden death in 1945 when he was 14; his own account calls it the most devastating loss of his life; he could not cry until an older family friend talked him through it; he did not go back to school — all documented. Withheld for anonymity: he is on record ranking that loss against the loss of his sight, and that comparison is quoted everywhere, so the beat keeps the feeling and drops the formula. Being called out of class and the crowd at the funeral are dramatized texture, and the beat names no season because sources differ on the exact date.",
      text: `One day, when he was fourteen, they came and got him out of class. His mother had died. No warning. She was still young.

He went home for the funeral. People around him were crying. He couldn't. The grief locked itself somewhere he couldn't reach.

He said later that nothing in his life ever hit him harder. His sight had gone slowly, over years, with her voice right there beside him the whole time. This came all at once. And her voice was the part that was gone.

For days he stayed locked like that. Then an old woman in town, a friend of his mother's, sat him down. She talked to him plainly, for a long time. Whatever she said, it worked. The grief broke open and let him through it.

He did not go back to school.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "He left the town after the funeral and was taken in by family friends in a bigger place; began sitting in with working bands at fourteen — documented. The 'her list' framing is interpretive, grounded in his account of her teaching that he had to do things for himself. Withheld for anonymity: the towns and cities are never named.",
      text: `He was fourteen, blind, and now without her, in a poor little town that had no way to keep him.

He took stock the way she had taught him. Feeling sorry for himself was not on her list. Waiting for somebody else to fix it was not on her list. Doing it himself was the whole list.

He had one skill the world might pay for. So he went where the music was. Family friends in a bigger town took him in, and he started showing up wherever bands played, asking to sit in.

Fourteen years old, out at night, in rooms full of grown men.

He played whatever they needed played.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Three years of band work around the state; lean weeks (crackers and water is from his own account); could play anything heard once; had pay counted aloud into his hand — documented. That he told nobody about the lean weeks is dramatized.",
      text: `For three years he scraped by as a working musician, town to town around the state.

Some weeks there was work. Some weeks he ate crackers and drank water and told nobody. Bandleaders took a chance on the blind kid and found out he could play anything he heard once. Other people tried to shortchange him on pay, figuring he couldn't count what he couldn't see. He learned to have them count it out loud, bill by bill, into his hand.

He was getting better. He was also going in circles — the same little towns, the same little rooms, the same state he had grown up in.

He knew every inch of it by heart. That was exactly the problem.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: at seventeen he chose a big city on the far side of the country that he had never seen and where he knew nobody, rode a bus there alone for days, was playing for money within weeks and recording within a year. Withheld for anonymity: how he chose it. The map question, the answer it produced and the length of the ride are the single most retold anecdote of this life, so the beat keeps the decision and drops the mechanism. That nobody made him go, and that he wanted to be beyond the reach of the life he was leaving, are interpretive readings of his documented choice of a city picked for its distance; the sources record no one sending him. The beat makes no claim about what money he had, because the facts paragraph establishes none.",
      text: `At seventeen he did something that still sounds half crazy.

He decided to leave. Not the next town over. Not the next state either. He wanted to be far enough away that none of it could follow him. The same rooms. The same faces. The same small corner of the world.

So he settled on a city he had never been to. He knew nobody there. Not one person. He was seventeen, and he could not see. He got on a bus and rode it for days and nights, alone.

Nobody made him go. Nobody was waiting at the other end.

Within weeks he was working nights there. Within a year, people were paying to record what he played.

He had bet everything on the one thing he could do. It held.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: he arrived where nobody knew him; he modeled his early singing on a singer he admired before finding his own sound; the music he then made was condemned publicly and loudly; steady work followed and he never went back to the lean years. Withheld for anonymity: the name he dropped and why, which two traditions he put together, what the result came to be called, what the objection to it actually was, the influence claim, and the touring and prizes — blind readers named him from those, so they all wait for the bridge.",
      text: `Nobody in the new place knew what he used to be. He got to decide who he was now.

For a few years he sounded like the singers he admired. He was good at it, and it paid. Then he stopped. He started making music the way he heard it in his own head, instead of the way it was supposed to be done.

Some people were angry about that. They said so loudly, and not kindly. He kept going anyway.

It sounded like him, and not like anyone he had copied. That was the whole point.

The work came steadily after that. He never had to go back to the lean weeks and the little rooms. And all of it ran on the rules of a poor woman from a small town who would not let anybody carry him.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Ray Charles.

He put gospel and the blues together and made soul music. A lot of what you hear on the radio still comes from that. His version of "Georgia on My Mind" became the official song of the state he was born in. He won seventeen Grammys. He did all of it blind, and he never asked anyone to pity him for it. None of it had happened yet when he was fourteen, standing at his mother's funeral.

Your life is not theirs. But a piece of this story may still sit beside you.

He lost the person who taught him how to survive at exactly the moment the surviving started. What she left him wasn't money. There wasn't any. It was the stubborn idea that he could do for himself. That turned out to be enough to cross the whole map with.

You don't have to know yet what you can carry. He didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 14, 1866, Feeding Hills MA, poor Irish immigrant family; mother died of TB
//    when she was 8; father was an alcoholic and abandoned the children; sent to Tewksbury
//    Almshouse Feb 1876 (age 9) with her small brother Jimmie, who died there within a few months
//    (accounts say three to four); trachoma left her nearly blind; ~4 years in wards among the sick
//    and dying, no family visits; 1880 state investigation of Tewksbury — when Frank B. Sanborn's
//    inspection party toured, she threw herself at him crying "Mr. Sanborn, I want to go to
//    school!"; entered Perkins Institution Oct 7, 1880, age 14, illiterate, with no schooling and
//    no training in manners; mocked by younger students, temper nearly got her expelled; eye
//    surgeries during the Perkins years partially restored her sight; graduated valedictorian June 1886,
//    age 20 (her address: "duty bids us go forth into active life", and
//    on finding "our especial part"); Perkins had taught one earlier deaf-blind pupil, Laura
//    Bridgman, who still lived there, and Sullivan prepared by reading Samuel Gridley Howe's
//    reports on that case; reached the Keller home in Tuscumbia, Alabama, March 3, 1887, aged 20,
//    to teach 6-year-old Helen Keller; Helen's Radcliffe degree 1904. d. Oct 20, 1936.
//  Interpretive: the "one overheard word — school — held like something in a pocket" framing; the
//    invisibility-ended-because-she-ended-it reading of the Sanborn moment; following the party
//    ward to ward and not being able to see which man was in charge (drawn from her near-blindness).
//    Grounded.
//  Avoid saying: don't name Sullivan / Tewksbury / Perkins / Sanborn / Helen Keller / Laura
//    Bridgman before the bridge; keep the almshouse un-lurid (no cannibalism-investigation detail);
//    the brother's death is handled in one quiet line; no "Miracle Worker" before the bridge; she
//    was TWENTY when she reached the Kellers, not twenty-one; don't say the work had never been
//    done — Bridgman came first.
//    Anonymity: beat 5 must not say the pupil was deaf and blind, or six years old, or
//    world-famous afterward — that combination identifies her at once. A blind reader still
//    named her from beats 0-5, so beat 5 is softened further: it now says only that a family
//    far away needed a teacher, that the school sent her, that she went at twenty and never
//    quit. The pupil, what she could not do, the earlier case of its kind, the breakthrough
//    and the fame are all held for the bridge. Beat 3 no longer names what kind of school it
//    was; beat 1 already says these schools taught girls who could not see.
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
    "Anne Sullivan was born April 14, 1866, in Feeding Hills, Massachusetts, to poor Irish immigrant parents. Her mother died of tuberculosis when Anne was eight; her father, an alcoholic who could not or would not care for the children, abandoned them. In February 1876 Anne and her younger brother Jimmie were sent to the state almshouse at Tewksbury — a warehouse for the destitute, the sick, and the dying. Jimmie, who had a tubercular hip, died there within a few months and was buried on the grounds. Anne, whose eyes had been badly damaged by trachoma since early childhood, spent roughly four years in the wards, nearly blind, with no family visits, undergoing failed eye operations. From ward talk she learned that schools for the blind existed. In 1880 the state investigated conditions at Tewksbury, and when the inspection party led by Frank B. Sanborn of the State Board of Charities toured the wards, fourteen-year-old Anne threw herself toward him and cried, \"Mr. Sanborn, I want to go to school!\" That October she entered the Perkins Institution for the Blind in Boston — fourteen years old and unable to read, write, or spell her own name. Younger students mocked her ignorance; she had had no schooling and no training in manners, and her temper nearly got her expelled more than once. Surgeries during her Perkins years partially restored her sight, and she rose through the school at a furious pace. In June 1886, at twenty, she graduated as class valedictorian, telling her classmates that \"duty bids us go forth into active life,\" and urging them to go cheerfully and earnestly and to set themselves to find their especial part. That summer Michael Anagnos, the director of Perkins, was asked to find a teacher for the deaf-blind daughter of a family in Tuscumbia, Alabama, and he recommended Sullivan. Perkins had educated one deaf-blind pupil a generation earlier — Laura Bridgman, taught by Samuel Gridley Howe — and Sullivan, who had lived in the same house with Bridgman during her six years at the school, prepared by reading Howe's reports on that case. She reached the Keller home on March 3, 1887, aged twenty; her pupil, Helen Keller, was six. Sullivan gave her language — the breakthrough came at a water pump on the Keller property that spring — stayed with her for the rest of her life, and spelled lectures into her hand while Helen earned a Radcliffe degree in 1904. Sullivan became widely known as \"the Miracle Worker,\" which is also the title of the 1959 play about the two of them. Anne Sullivan died October 20, 1936.",
  sources: [
    "Nielsen, Kim E. Beyond the Miracle Worker: The Remarkable Life of Anne Sullivan Macy (Boston: Beacon Press, 2009), Chapters 1-3.",
    "Braddy, Nella. Anne Sullivan Macy: The Story Behind Helen Keller (New York: Doubleday, 1933).",
    "Keller, Helen. The Story of My Life (New York: Doubleday, Page & Co., 1903), Part III — John Albert Macy's supplementary account and Anne Sullivan's Tuscumbia letters.",
    "Perkins School for the Blind archives, \"Anne Sullivan\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Mother's death, the father's drinking and abandonment, the almshouse placement with her brother, near-blindness — all documented. Kept un-lurid.",
      text: `There was a girl in a state poorhouse.

Her mother had died when she was eight. Her father drank, and then he was gone. So the state took her and her little brother. It sent them to the place it sent everyone it had no plan for — the old, the sick, the dying. And, somehow, two children.

Her eyes were bad and getting worse. Some days the world was only shapes and light.

She and her brother stuck together in the wards. He was small and frail and she was fierce. Between them they had exactly one thing in the world, which was each other.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Jimmie's death within months, burial on the grounds, four years without a single visitor, ward talk about schools for the blind — documented. The 'word in a pocket' image is texture.",
      text: `Her brother died a few months after they arrived. They buried him on the grounds. She was ten.

After that, she was simply... there. Year after year. Nobody came to visit her. Nobody came to claim her. She grew up in wards full of women at the end of their lives. She listened to how lives end. She went half blind among people the world had already filed away.

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
        "The 1880 state inspection of the almshouse and her documented plea to the head of the visiting party — 'I want to go to school!', verbatim in biographicalFacts — which got her sent to the school for the blind that fall. Following them ward to ward and not being able to see which man was in charge are interpretive, drawn from her documented near-blindness.",
      text: `One day, when she was fourteen, important men came to inspect the place. Word ran ahead of them through the wards. Men from the state, come to see how bad it really was.

She understood one thing. Men like this might never come again.

She followed them from ward to ward, working up her nerve. She could not see well enough to tell which one was in charge. Then the voices turned toward the door. She knew it was ending.

She threw herself toward the sound of them and cried out:

I want to go to school!

The men stopped. One of them asked her name. Asked about her eyes.

She had spent four years being invisible. It ended because she ended it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Entered at 14 illiterate, with no schooling and no training in manners; mocked by younger children; temper nearly got her expelled; eye surgeries partially restored her sight; rapid rise through the grades — all documented. Withheld for anonymity: what kind of school it was — beat 1 already says these schools taught girls who could not see.",
      text: `They sent her away to school that fall.

She was fourteen years old, and she could not read, could not write, could not spell her own name. The other students who were starting out were little children — and they could. They laughed at her. She had bad manners too. Nobody had ever taught her any.

She was humiliated in small ways, daily, for a long time. Her temper went off like a struck match, and it nearly got her thrown out more than once.

But she was also learning fast. Reading, writing, all of it. She went up through the school the way something comes up from underwater. Doctors operated on her eyes, and part of her sight came back.

She caught up to the little children. Then she passed them.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Valedictorian, June 1886, at twenty; the address is hers, paraphrased here — 'duty bids us go forth into active life' and the charge to find 'our especial part'. The 'nobody in that hall knew the distance' framing and the closing recap of the plea are interpretive.",
      text: `Six years after she arrived unable to spell her own name, she finished at the top of her class.

The school picked her to give the speech at graduation. She was twenty. She stood up in front of the room and gave the address. She told her classmates that duty was calling them out into active life. She told them to go gladly, and to find the part of the work that was theirs.

Nobody in that hall but her knew the whole distance she had crossed to be standing there. A burial ground behind a poorhouse. Four years of nobody coming. And then one sentence, thrown into the dark at the right moment, to a man whose face she could not see.

She had asked for one door. Given one, she had walked through it farther than anyone could have guessed.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The request that summer from a family in another state, her having no teaching experience of any kind, her preparation by reading everything she could find, her going at twenty to live in the family's house, and her staying with the work for the rest of her life — all documented (Nielsen; Perkins archives). The closing lines about being left and about being reached are interpretive. Withheld for anonymity: the pupil, what she could not do, the earlier case of its kind, the breakthrough, and the fame that followed — all held for the bridge.",
      text: `That summer, a family far away wrote to the school. They needed a teacher, and they needed someone willing to come and live there and do it.

The school put her name forward. The girl from the poorhouse.

She had never taught anybody anything. She read everything she could find that might help her. Then she packed and went. She was twenty.

The work was slow and it was hard, and she did not walk away from it. She was still at it decades later. She never quit.

She knew what it was to be put somewhere and left. She knew what it took to be reached — one person had reached her, once, and only because she had shouted for it. She knew exactly what it costs to go and get somebody. She was willing to pay it.

The girl nobody came for became the one who came.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Anne Sullivan.

She was Helen Keller's teacher — the one who spelled water into Helen's hand at the pump and cracked the world open for her. They called her the Miracle Worker. They still do. None of that had happened yet when she was a half-blind girl in a poorhouse, holding onto one overheard word.

Your life is not theirs. But a piece of this story may still sit beside you.

She spent years as the person nobody came for — behind everyone, ashamed of it, starting from zero at an age when starting felt impossible. She caught up anyway. It took six years, and she did it half blind. Then she turned around and taught someone else the way out.

You don't have to be caught up to begin. She wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 25, 1917, Newport News VA, raised Yonkers NY; loved dancing, took the
//    train to Harlem to watch the theaters, learned songs off records at home (Connee Boswell her
//    favorite); mother Tempie died in 1932, when Ella was 15 — most accounts give injuries
//    from a car accident, but her early life is thinly documented and accounts differ, so the
//    beats say only that it was sudden; her mother's partner, then an aunt in Harlem in 1933,
//    grades collapsed, lookout and errand work; placed first in the Riverdale orphan asylum,
//    then the NY State Training School for Girls at Hudson (reform school; girls were beaten
//    there — later NYT reporting), got out and did not go back; homeless in Harlem
//    ~1933-34, sang and danced on street corners for change; Nov 21, 1934, age 17, Apollo Amateur
//    Night — entered intending to dance, followed the professional Edwards Sisters dance act,
//    froze, sang "Judy" and "The Object of My Affection" in the style of Connee Boswell instead,
//    won first prize; the promised week's booking was withheld over her unkempt appearance; won a
//    second Harlem amateur contest in early 1935 that led to paid work and to Chick Webb's band
//    (Webb and his wife informally looked after her); "A-Tisket, A-Tasket" (1938, age 21) made her
//    a star; 13 Grammys (some counts say 14, including the 1967 Lifetime Achievement Award); last
//    performance 1993; d. June 15, 1996.
//  Interpretive: "turning invisible, and she knew it" street framing; "luck you only get if you
//    put your name in"; "a habit she refused to drop." Grounded.
//  Avoid saying: don't name Ella / the Apollo / Harlem / Chick Webb / song titles / Connee Boswell
//    before the bridge; reform-school violence in one non-graphic line; don't linger on what street
//    survival required; no "First Lady of Song" before the bridge; don't assert the cause of the
//    mother's death; no "six decades" and no "greatest singer ever" overclaim; no presidents or
//    palaces (unsourced).
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
    "She lost her mother at fifteen, was sent away to a place that treated her like a criminal, and ended up singing on street corners for change with nowhere to sleep.",
    "At seventeen she walked onto the hardest amateur stage in the city planning to dance, froze in the lights, and sang instead — and the room went still.",
    "The homeless girl they wouldn't book became the most celebrated singer of her century.",
  ],
  facets: {
    emotionalCore:
      "Being sixteen with no mother, no address, and no one responsible for her, and feeling herself turning invisible on streets full of people.",
    decisionShape:
      "Whether to keep surviving small and unseen, or to put her name in and walk onto a stage in front of a merciless crowd with nothing prepared and find out if she was anything.",
    triggerEvent:
      "Her mother died suddenly when she was fifteen, and within two years she had gone from a family kitchen to a state reform school to no roof at all.",
    agencyState:
      "She had no home, no family watching, and no training — only the steps and songs she'd taught herself, and the nerve to enter anyway.",
  },
  biographicalFacts:
    "Ella Fitzgerald was born April 25, 1917, in Newport News, Virginia, and raised in Yonkers, New York, by her mother, Temperance \"Tempie\" Fitzgerald. As a girl she loved dancing above everything; she and her friends took the train into Harlem to watch the acts at the big theaters, and she planned to be a dancer. At home she listened to records and taught herself the songs she heard; the singer Connee Boswell was her favorite. In 1932, when Ella was fifteen, her mother died suddenly; most accounts give the cause as injuries from a car accident, though accounts of her early life differ on details. Ella stayed with her mother's partner and then, in 1933, went to an aunt in Harlem; her grades collapsed, she stopped attending school, and she worked as a lookout for a brothel and ran errands for numbers runners. The authorities placed her first in the Colored Orphan Asylum in Riverdale and then in the New York State Training School for Girls at Hudson, a reform school where, as later newspaper investigation reported, Black girls were housed apart from the others and were beaten. She got out and did not go back, and through 1933-34 she was homeless in Harlem in the depths of the Depression, singing and dancing on street corners for change and sleeping where she could. On November 21, 1934, at seventeen, she was drawn to perform at Amateur Night at the Apollo Theater. She had entered intending to dance, but the act before her was the Edwards Sisters, a professional dance duo whose act intimidated her, and she froze in the lights. As the notoriously unforgiving crowd began to rumble, she asked the band for \"Judy,\" a song her mother had loved, and sang it in the style of Connee Boswell, whose records she had grown up copying, then sang \"The Object of My Affection\" as an encore. She won first prize. The prize was supposed to include a week's engagement at the theater; the management withheld it because of her disheveled appearance. In early 1935 she won a second amateur contest in Harlem, and that one did lead to paid work and to the drummer and bandleader Chick Webb; he gave her a tryout and then a place in his band, and he and his wife informally took the teenaged Ella under their care. Her playful 1938 recording of \"A-Tisket, A-Tasket,\" made at twenty-one, became a national sensation. She went on to win thirteen Grammy Awards and to be called the First Lady of Song, and she performed until 1993. She died June 15, 1996.",
  sources: [
    "Nicholson, Stuart. Ella Fitzgerald: A Biography of the First Lady of Jazz (New York: Scribner, 1994), Chapters 1-2.",
    "Bernstein, Nina. \"Ward of the State: The Gap in Ella Fitzgerald's Life.\" The New York Times, June 23, 1996.",
    "Ella Fitzgerald Charitable Foundation, official biography.",
    "\"Ella Fitzgerald.\" National Women's History Museum, womenshistory.org.",
    "\"Ella Fitzgerald: Career Timeline.\" American Masters, PBS (pbs.org/wnet/americanmasters).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Documented: the dancing ambition, the train rides into the city to watch the theater acts, the records she learned songs from at home, and her mother's death in 1932 when she was fifteen. Most accounts give injuries from a car accident, but her early life is thinly documented, so the beat says only that it was sudden. 'Without meaning to' and the long hours her mother worked are editorial texture.",
      text: `There was a girl who loved to dance.

She grew up just outside a big city, in a home where her mother worked long hours and still made room for her. There were records in that house. The girl learned the songs off them without meaning to.

On good days she and her friends rode the train into the city. They went to watch the dancers at the big theaters. Then she came home and practiced the steps on the sidewalk until dark.

People said she was good. She believed them. Dancing was going to be her thing.

Then, when she was fifteen, her mother died. Suddenly. No warning, nothing to get ready for.

And the floor under her life just went.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: the move to a relative in the city, the school collapse, the trouble with the authorities, the children's home and then the reform school where girls were beaten (later newspaper investigation), getting out, and the homelessness and street singing that followed. 'Turning invisible, and she knew it' is editorial framing, not a feeling she recorded.",
      text: `Everything came apart fast. That is what happens when a kid loses the one person holding it together.

She was sent to a relative. It didn't take. She stopped going to school. She got into trouble. Then the state stepped in and sent her away. First to a home for children with nowhere else to go. Then to a reform school far from the city.

Girls got beaten there for small things.

She got out. She did not go back.

Which left her at sixteen with no mother, no address, and no one responsible for her. It was the middle of the worst years the country could remember. She sang and danced on street corners for coins. She slept where she could. She stopped taking care of herself. There was no one left to take care of herself for.

She was turning invisible, and she knew it.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: the weekly amateur contest, entrants drawn by lot, the crowd's reputation, her plan to dance, and the state of her clothes. 'The kind of luck you only get if you put your name in' is editorial framing.",
      text: `The theaters were still there. The music was still there.

One of the big theaters ran a contest night for amateurs. Anyone could put a name in. Once a week a few names got pulled out.

If your name came up, you got a stage. You also got a crowd that decided fast. They could love you loudly. Or let you know, just as loudly, that they didn't.

She put her name in. The plan was to dance. Dancing was the thing she trusted.

Her name came up.

That's luck. But it is the kind of luck you only get if you put your name in.

She was seventeen. She was wearing what the street had left her. She had one night and one stage.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented in outline: roughly two years homeless in the depths of the Depression, singing and dancing on street corners for change, sleeping where she could, and the songs she had learned at home. The day-to-day texture here is compressed and dramatized, not drawn from any specific account.",
      text: `Getting to that night had taken everything she had.

Months of corners and coins. Of singing to the backs of people who kept walking. Of finding somewhere to sleep, then finding somewhere else when that fell through.

Nobody was coming for her. She knew nobody was coming. The city was full of people barely holding on. One more girl who used to have a mother and a plan was nobody's business.

But she stayed near the music. Whatever else the street took, she kept the steps and she kept the songs. The songs from her mother's house were still playing in her head.

It wasn't hope, exactly. It was closer to a habit she refused to drop.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: she followed a professional sister dance duo and was intimidated by them; she had entered to dance, froze, asked the band for a song her mother had loved, sang it in the style of the singer whose records she knew, sang a second song, and won first prize. No invented gestures, costumes or room detail.",
      text: `The act right before her was two sisters who danced for a living. Fast, sharp, professional. Watching them, her nerve went.

And she was supposed to walk out there next. In street clothes. And dance.

She got into the lights and could not move. Nothing came. The crowd started to rumble, and at that theater the crowd did not wait politely.

Then something in her decided. Not the feet. The voice.

She asked the band for a song her mother had loved. She sang it the way she had heard it sung on a record at home.

The room went quiet. Then it went up.

They would not let her leave after one song. She sang another.

When the night was over, the girl with nowhere to sleep, who had come there to dance, had won the whole thing.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the week's engagement withheld over her appearance, a second amateur contest won in early 1935 that did lead to paid work, the bandleader who gave her a tryout and a place in his band and who with his wife looked after her, the 1938 hit record at twenty-one, and a singing career that ran until 1993. 'It stung' and 'the first steady home' are editorial readings. Kept anonymous.",
      text: `The prize was supposed to include a week of performing at that theater. They kept that part back. They looked at her clothes and decided she didn't look right for their stage.

It stung. It did not stop her.

A couple of months later she entered another contest and won that one too. That one led to real work.

Within months a well-known bandleader gave the orphan girl a tryout, and then a place in his band. He and his wife looked after her like family. It was the first steady home she'd had since her mother died.

A few years on she made a record that people played all over the country. It made her famous while she was still young.

She kept singing for almost sixty years, on the biggest stages in the world.

The girl who froze before the dance became one of the most loved singers her country ever had.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Ella Fitzgerald.

They called her the First Lady of Song. She won thirteen Grammy Awards, and her recordings of the great American songs are still the ones people reach for first. All of it goes back to one night when a seventeen-year-old with nowhere to sleep walked out to dance, froze, and sang instead. None of that had happened yet on the nights we just sat with her.

Your life is not theirs. But a piece of this story may still sit beside you.

She was about as alone as a person can be. No family holding her. No address. Nothing left of the plan she had made for herself. What she had was one thing she could do, and the nerve to put her name in anyway.

Feeling invisible now does not mean staying invisible. She had no way of knowing that either.`,
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
    "Sidney Poitier was born prematurely on February 20, 1927, in Miami, to Bahamian parents, and grew up poor on Cat Island and in Nassau in the Bahamas, with very little formal schooling. At fifteen he was sent to Miami; at sixteen, in the winter of 1943, he arrived in New York City with only a few dollars, sleeping at first in a pay washroom of a bus terminal and on rooftops, and finding work washing dishes. He served briefly in the Army (having lied about his age) from late 1943 to the end of 1944, then returned to dishwashing. Around 1945, at eighteen, he spotted an audition notice for the American Negro Theatre in the newspaper near the dishwasher want-ads. At the audition he stumbled through the reading — his schooling had stopped young and his Bahamian accent was heavy — and the director, Frederick O'Neal, angrily marched him out, telling him to stop wasting people's time and go get a job as a dishwasher or something. Poitier, who was a dishwasher, was stung most by the accuracy: a stranger had read the entire size of his life in about ninety seconds. He resolved to become an actor to disprove him. He bought a cheap radio and spent months listening to announcers — he later credited Norman Brokenshire — repeating everything they said, hour after hour, to flatten his accent; at the restaurant, an elderly Jewish waiter sat with him after closing, night after night, helping him read the newspaper (Poitier later said he never found the man again to thank him). About six months later he auditioned again, and worked as the theatre's janitor in exchange for acting classes. He understudied Harry Belafonte, was cast in a Broadway production of Lysistrata in 1946, and went on to a film career in which, in the spring of 1964, he became the first Black man to win the Academy Award for Best Actor, for Lilies of the Field. He died January 6, 2022.",
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
        "Island childhood without electricity, arrival in the city at sixteen in winter with a few dollars, the bus-terminal washroom nights and the dishwashing work are documented in his memoirs. The shock of the cold is his own account, compressed. The year in Miami at fifteen and his brief army stretch are left out for pacing.",
      text: `There was a young man washing dishes in the back of a restaurant, in a city far bigger than anything he had ever seen.

He had grown up on a small island — a place with no electricity, hardly any cars, no movie houses. He came to the city at sixteen with a few dollars in his pocket. It was winter. He had never been cold like that in his life. The first nights he slept in a washroom stall at the bus terminal, because it was warm and it locked.

He found work the way new arrivals do. Dishes. Sink after sink, night after night. The work was honest and it was going nowhere, and he knew both of those things.

He was eighteen now. He was looking for a door. Any door with his name on it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The first audition is documented: he could barely read the script, his accent was heavy, and the man running it walked him out and told him to stop wasting people's time and go be a dishwasher. Rendered here as indirect speech, not as a quotation. The 'accuracy' framing is his own later telling.",
      text: `One day, in the paper, right next to the dishwasher want-ads, he saw a notice. A theater company was looking for actors.

He had barely ever seen a play. But every other job on that page wanted somebody else. This one just said wanted. He went.

They handed him a script. He could barely read it. His schooling had stopped young. The words came out slow and broken, in an accent from the island that strangers had to work to follow.

The man running the audition stopped him partway through. He took him by the arm and walked him to the door. He told him to quit wasting people's time. Go get a job as a dishwasher or something.

The man had no way of knowing that was exactly the job he had.

Standing on the sidewalk afterward, that was the part he couldn't swallow. Not the no. The accuracy. A stranger had looked at him for ninety seconds and measured his whole life correctly.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "His resolve to disprove the man, the cheap radio and the nightly repeating-after-the-announcers practice are documented in his own account; he credited a radio announcer he listened to. The rented room is ordinary texture — by then he was working and no longer sleeping at the terminal.",
      text: `Somewhere on the walk home, the sting turned into something harder. Something he could use.

He decided the stranger was not going to stay right about him. Not because he loved acting. He barely knew what acting was. Because he refused to be a man whose whole future could be read in ninety seconds.

So he named the problem. Two parts: the reading, and the accent. A problem with a name can be worked on.

He bought a cheap radio. Every night after the dishes, alone in his rented room, he turned it on. The announcers had the smoothest voices in the country. He said their sentences back to them, one at a time, hour after hour, until his mouth learned the new shapes.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The ~6 months of radio nights; the elderly waiter who tutored his reading nightly and was never found again to thank — both documented.",
      text: `It went on for months.

Dishes all day. The radio half the night, the same sentences over and over until they came out right.

At the restaurant, an old waiter noticed the newspaper he kept trying to read and started sitting with him at the counter after closing. Night after night, a paragraph at a time, the old man walked him through it — patiently, asking nothing in return. Years later he would look for that waiter, to thank him. He never found him.

Progress was slow and invisible, the way real progress usually is. His voice flattened out. The words started to flow.

Nobody was watching him get better. That's the loneliest kind of getting better. He kept at it anyway.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The second audition about six months later and the janitor-for-classes deal are documented; the specific chores are ordinary janitor work, added as texture. The classes, the standing in for another actor and the first stage part are all in the facts, and no claim is made about who noticed him.",
      text: `Six months after being marched out that door, he walked back through it and asked to try again.

He read again. The accent was nearly gone. The words came out smooth and level. He wasn't good yet. But nobody could wave him off in ninety seconds anymore. The difference between those two things was every night he had spent with the radio.

They still weren't sure about him. So he offered them a deal. He would clean the theater — mop it, haul for it, lock it up at night — in exchange for classes and a place inside.

They took the deal.

He was in the building. That was all he had wanted. To be inside, where the work was, instead of outside being summed up by strangers.

After that came the classes, then standing in for another actor, then a part of his own.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Stage work within a year or two, film work from about five years on, leading-man billing and the top award of his profession are documented; the award evening was in the spring. His care over which parts he took is his own account and his biographers'. Kept anonymous — the industry barrier and the 'first' are saved for the bridge.",
      text: `Within a year or two he was acting for a living. A few years after that he was in films. Then he was carrying them, with his name at the top of the bill.

He was careful about the parts he took. Dignity. Intelligence. He had been summed up once by a stranger in ninety seconds. He was not going to let a job do it to him again.

The voice he had been thrown out for became the thing people knew him by. Slow. Clear. Level. Built at night, next to a radio, one sentence at a time.

And one spring evening, in front of the people who ran his whole profession, he won its highest honor.

He had been marched off a stage for the way he read. Now he was one of the best-known actors of his time.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Sidney Poitier.

In 1964 he became the first Black man to win the Academy Award for Best Actor. For the rest of his life he stood for a kind of dignity the movies had never been willing to show. And once, a man walked him out of an audition and told him to go wash dishes. None of the rest had happened yet that day on the sidewalk.

Your life is not theirs. But a piece of this story may still sit beside you.

A stranger measured him in ninety seconds, and that day the measurement was right. So he went home and changed what was true. Quietly, at night, with a radio and a newspaper and an old man's patience, until the measurement was wrong.

What someone sees in you today is a snapshot, not a prophecy. You don't have to prove it wrong today. He couldn't either, not that day.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Eunice Kathleen Waymon, Feb 21, 1933, Tryon NC, sixth of eight; mother Mary
//    Kate a Methodist minister; church-piano prodigy from ~3; her piano teacher (Muriel
//    Mazzanovich, "Miss Mazzy") organized the Eunice Waymon Fund — neighbors' collected money —
//    to pay for her training; the stated plan: to be the first Black concert pianist on America's
//    great stages; summer 1950 (17) Juilliard; family moved to Philadelphia on the strength of
//    the Curtis plan; spring 1951 (18) Curtis Institute audition — rejected (3 of ~72 applicants
//    accepted); she believed lifelong the reason was race (Curtis never said; the motive is
//    unverifiable and the beats keep that honest); 1951-54 taught children piano from her home,
//    accompanied a voice teacher's students, and kept private lessons with Vladimir Sokoloff, a
//    Curtis professor; summer 1954 (21) Midtown Bar & Grill, Atlantic City — the job paid better
//    than teaching and helped fund those lessons; took the name "Nina Simone" (niña + Simone
//    Signoret) to keep it from her mother, for whom such music was the devil's music; first night
//    the owner (Harry Steward) told her she'd sing as well as play or lose the job — she had never
//    sung; "I Loves You, Porgy" reached no. 18 nationally in 1959 (age 26); Curtis awarded her an
//    honorary diploma in 2003, two days before her death.
//  Interpretive: "the plan was gone in a single day"; "the side door was hers." Grounded in her
//    autobiography. No envelope or letter is documented; no dialogue is quoted in the beats.
//  Avoid saying: don't name Simone / Eunice / Curtis / Juilliard / Philadelphia / Atlantic City /
//    Sokoloff / song titles before the bridge; do NOT assert the rejection WAS racial — render her
//    lifelong belief and the school's silence; "High Priestess of Soul" only in the bridge.
const simone: FigureStageRow = {
  figureKey: "simone",
  displayName: "Nina Simone",
  birthYear: 1933,
  deathYear: 2003,
  stageId: "1950-1954-curtis-no-to-the-bar",
  stageLabel: "The answer was no: the conservatory rejection to the night she sang",
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
      "The sanctioned dream was dead and the path she had trained for was closed, but the skill was still hers, and nobody could take the piano out of her hands.",
  },
  biographicalFacts:
    "Nina Simone was born Eunice Kathleen Waymon on February 21, 1933, in Tryon, North Carolina, the sixth of eight children; her mother, Mary Kate, was a Methodist minister. A prodigy, she began playing piano in church around age three. Her piano teacher, Muriel Mazzanovich — \"Miss Mazzy\" — believed in her so completely that she organized the Eunice Waymon Fund, money collected from the townspeople, to pay for the girl's classical training. The plan was spoken aloud throughout her childhood: Eunice would become the first great Black concert pianist on America's classical stages. In the summer of 1950, at seventeen, she studied at the Juilliard School in New York, and her family relocated to Philadelphia in anticipation of her enrolling at the Curtis Institute of Music. In the spring of 1951, at eighteen, she auditioned at Curtis; about seventy-two pianists applied that year and only three were admitted. She was rejected. She believed for the rest of her life that the decision was about the color of her skin; the school never gave a reason, and the true motive is unverifiable. The rejection ended the plan her town had funded and her family had moved for. From 1951 to 1954 she stayed in music at its smallest scale — teaching piano to children from her home and accompanying the students of a voice teacher — and she kept taking private lessons from Vladimir Sokoloff, a professor at Curtis. In the summer of 1954, at twenty-one, she took a job playing piano at the Midtown Bar & Grill in Atlantic City; it paid better than teaching and helped fund those lessons. To keep her mother, a Methodist minister who regarded such music as the devil's music, from learning she was playing in a bar, she worked under an invented name: Nina Simone. On her first night the owner, Harry Steward, told her that if she wanted to keep the job she would have to sing as well as play. She had never thought of herself as a singer. She sang. Her singing voice was a deep contralto with slow, deliberate phrasing. Her sets ran for hours and mixed classical pieces with popular songs, gospel and blues, and within weeks people were coming specifically to hear her. Her recording of \"I Loves You, Porgy\" reached number eighteen on the national chart in 1959, when she was twenty-six, and she went on to become one of the most original figures in American music and a fierce voice of the civil rights movement. She performed in the major American concert halls, singing at her own piano. In 2003, two days before her death, the Curtis Institute awarded her an honorary diploma.",
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
        "Church prodigy from ~3; the teacher-organized town fund; the spoken plan of the classical stage — all documented. The door-to-door image is how the fund is described in the biographies; 'feet dangling off the bench' is texture.",
      text: `There was a girl from a small mountain town who could really play the piano.

She'd started at three, in church, feet dangling off the bench. By the time she was in school, the whole town knew what they had. Her piano teacher believed in her completely. She went door to door and raised a fund for the girl's classical training — money collected from neighbors who didn't have much.

The plan was said out loud, all through her childhood. This girl was going to be a concert pianist. A real one, on the great stages, in a country that had almost never made room for someone like her there.

She practiced like it was a religion. The town had paid for a dream, and she meant to deliver it whole.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The 1951 rejection (three of about seventy-two applicants admitted); the family's move made in anticipation; her lifelong belief about the reason and the school's silence — documented, rendered without asserting the motive. 'Gone in a single day' is compression; no envelope or letter is documented.",
      text: `At eighteen, she auditioned for the great conservatory that was the next step. The whole point of everything. Her family had already moved north to a new city on the strength of the plan.

The answer was no.

Dozens of pianists had tried for a handful of places, so a no was always possible. But she had been the prodigy her entire life. She could not make the no make sense. Then she found the one explanation that did make sense, in the country she lived in. The color of her skin.

Was that the reason? The school never said. She believed it was, to the last day of her life.

Either way, it was over. The dream her town had collected money for. The dream her family had moved for. Gone in a single day.

She was eighteen, and the plan for her whole life was finished.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 1951-54 teaching and accompanist work — documented. Nothing here is dramatized beyond compressing three years into a paragraph.",
      text: `She didn't stop playing. That part never felt like a decision. Her hands went to the keys the way they always had.

But she stopped being the town's dream and became a working musician nobody had heard of. She taught scales to children in the afternoons. She played accompaniment for a voice teacher's students — other people's auditions, other people's dreams, hour after hour.

It was smaller than the plan. It paid.

And it kept her hands strong. The rest of her was still working out what a life is supposed to be when the approved one is refused.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The private lessons kept up with a professor from the same conservatory, the bar job that paid better than teaching and helped fund those lessons, her mother's view of such music, and the invented name — all documented.",
      text: `Three years went by like that.

Children's lessons. Other people's recitals. She kept paying for private lessons with a teacher from the same conservatory that had turned her down, because she hadn't fully let go. Maybe another audition someday. Maybe the plan could still be revived.

Then came a summer job offer. Playing piano in a bar, in a beach town, nights. It paid better than teaching, and it would cover the lessons.

A bar. Her mother was a minister. In her mother's house, that kind of music was the devil's music. If word ever got home —

She took the job. And to make sure word never traveled, she invented a new name to work under. Something a little foreign, a little grand. A mask.

Her first night, she sat down at the piano as someone who did not exist.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The owner's first-night condition — sing as well as play or lose the job — her never having thought of herself as a singer, the long mixed sets, and the crowds within weeks are all documented. No dialogue is quoted; the exchange is reported indirectly, and placing it at the end of the night is compression.",
      text: `She played that first night straight through. Hours of it. Classical runs threaded into popular tunes, everything she had in her hands.

At the end of the night the owner came over. She figured she'd done well.

He told her the job came with a condition she hadn't heard about. If she wanted to keep it, she would have to sing too.

She had never been a singer. She had never thought of herself as one. Singing was not the plan. The piano was the last piece of the old dream still standing, even here.

But the job was the job. So she sang.

And the voice that came out was low and dark and unhurried. It was a thing she had never known she owned.

Within weeks, people were coming just for her. For the voice. For the name that had started as a mask and was quickly becoming more real than the old one.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Bar seasons to clubs to a record that reached number eighteen nationally in 1959, at twenty-six; the fused style; her civil-rights-era voice; the honorary diploma from the same conservatory two days before her death — all documented, kept anonymous.",
      text: `The bar summers turned into club bookings. The club bookings turned into a record. A few years later, one of her songs was on the national charts.

She became a category of one in American music. Not jazz exactly. Not blues exactly. Not classical exactly. All of it fused together at her piano, under the invented name.

She never did become the concert pianist the plan had promised. She became something the plan had never imagined. She played the great halls after all, on her own terms, singing. Then the country she lived in tore itself open over the color of people's skin. The voice she had found in that bar would not stay quiet.

Near the end of her life, the conservatory that had said no gave her an honorary diploma. It arrived two days before she died.

Late is late. But by then, even they knew exactly who they had turned away.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Nina Simone.

They called her the High Priestess of Soul. She became one of the most original voices in American music, and later one of the fiercest voices of the civil rights movement. The name she made up to hide a bar job from her mother is the name the whole world knows her by. None of that had happened yet on the day the answer came and the plan died.

Your life is not theirs. But a piece of this story may still sit beside you.

The door she had aimed her whole life at stayed shut. It broke something in her that never fully healed. The life she actually got came through a side door. She took it half in shame, under a made-up name, just to pay for lessons. The side door turned out to be hers.

You don't have to know which door is yours yet. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 2, 1805, Odense, shoemaker's son (father died 1816); to Copenhagen at 14
//    chasing the theater; patron Jonas Collin secured royal funding for grammar school — Slagelse
//    1822 (age 17), placed with 11-year-olds; headmaster Simon Meisling picked on him in every
//    lesson and humiliated him before the class; writing poetry was forbidden and called a waste
//    of time; boarded in Meisling's own house from 1825; moved with the Meislings to Elsinore
//    1826; broke the ban and wrote "The Dying Child" there, then could not keep it to himself and
//    read it aloud, and its quality was recognized (printed in a Copenhagen newspaper, Sept 25,
//    1827); Collin wrote to Meisling once about his treatment and it eased for a time; March 1827
//    Andersen wrote to Collin about how badly it was going; at his insistent appeals Collin took
//    him out in April 1827 (age 22, just past his birthday) and arranged private tuition;
//    university entrance exam 1828; first fairy tales 1835 (age 30); he said "The Ugly Duckling"
//    was about himself. d. 1875.
//  Interpretive: "believing the headmaster a little" as the core wound; the school-as-his-one-
//    chance dread that kept him from saying the whole of it sooner. Sources differ on how much his
//    letters told Collin — Wullschlager stresses how guarded he was, other accounts record
//    complaining letters — so the beats claim only that he did not say the whole of it for years.
//  Avoid saying: don't name Andersen / Denmark / Copenhagen / Slagelse / Elsinore / Meisling /
//    Collin / any fairy-tale title or recognizable fairy-tale character before the bridge; don't
//    describe the tales by kind either (no "stories for children," no "bedtime," no talking
//    animals, no odd-duckling summary) — beat 5 says only that he found short, plain writing
//    that travelled; don't call his father a shoemaker in the beats (the cobbler's-son detail is
//    a well-known Andersen tag; "worked with his hands" carries the same poverty); keep him
//    "the boy" not "the writer"; no era-marking theater/patronage detail beyond "people
//    paying for his school."
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
      "A patron secured the money that sent him to a grammar school at seventeen, years behind the children in his class, under a headmaster who chose him as a target.",
    agencyState:
      "He was poor, dependent on other people's charity, forbidden even to write — but they could not stop him from keeping words in his head and, once, on paper in secret.",
  },
  biographicalFacts:
    "Hans Christian Andersen was born April 2, 1805, in Odense, Denmark, the son of a poor shoemaker who died when Hans was eleven. At fourteen he went alone to Copenhagen to seek his fortune in the theater; he failed as a performer, but his strange talent attracted patrons, and Jonas Collin of the Royal Theatre secured royal funds to send him to grammar school. In 1822, at seventeen, he entered Slagelse Grammar School, placed in a class with boys around eleven years old. The headmaster, Simon Meisling, a classical scholar, made the gangly, sensitive, years-behind Andersen his target — picking on him in lessons and humiliating him in front of the class — and Andersen was banned from writing poetry so he would focus on his studies. From 1825 he boarded in Meisling's own house, so the torment followed him home; in 1826 he moved with the family to Elsinore when Meisling took over the school there, leaving him still more isolated. During the Elsinore period he broke the rule and wrote \"The Dying Child\"; unable to keep it to himself, he read it aloud, and its quality was quickly recognized — it was printed in a Copenhagen newspaper on September 25, 1827. For years he did not tell Collin the whole of how cruel the school was; sources differ on how much his letters conveyed. Collin wrote to Meisling at least once about his treatment of the boy, which eased it for a time; in March 1827 Andersen wrote to Collin about how badly the schooling was going, and at his insistent appeals Collin removed him from the school in April 1827 and arranged private tuition in Copenhagen; Andersen passed his university entrance examination in 1828 and began publishing. His first fairy tales appeared in 1835, when he was thirty, and made him, in time, the most famous writer in the world; among the best known are \"The Little Mermaid,\" \"The Emperor's New Clothes,\" \"Thumbelina\" and \"The Snow Queen,\" and he said of \"The Ugly Duckling\" that the story was about his own life. He died August 4, 1875.",
  sources: [
    "Andersen, Hans Christian. The Fairy Tale of My Life (Mit Livs Eventyr, 1855).",
    "Wullschlager, Jackie. Hans Christian Andersen: The Life of a Storyteller (New York: Knopf, 2001), Chapters 3-4.",
    "Hans Christian Andersen Centre, University of Southern Denmark, \"Schooling\" biographical materials.",
    "Hans Christian Andersen Centre, University of Southern Denmark, work notes on \"The Dying Child\" (Det doende Barn, 1827).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Placed at 17 in a class of ~11-year-olds; a patron secured royal money for the school; his poverty, his height and his thin schooling — documented. The small desk is dramatized texture.",
      text: `There was a boy of seventeen sitting in a classroom of eleven-year-olds.

He was poor. His father had worked with his hands, and he had been dead for years. The boy was too tall and odd-looking, with a high voice and big dreams he couldn't keep quiet about. A man with money and connections believed there was something in him, and got him sent to this school. It was, everyone said, his one chance in life.

He was years behind the children around him. Grammar, Latin, everything — the little boys knew things he didn't. He'd had almost no schooling at all.

So he sat where they put him, folded up at a small desk, grateful and scared, determined to earn it.

The headmaster had other plans for him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The headmaster's daily mockery in lessons, the ban on writing as a waste of time, and boarding in his house from 1825 so there was no escape — documented; secondary sources record him telling the boy he was stupid and would never make it, given here as indirect speech. Believing him is grounded in the diaries and letters.",
      text: `The headmaster made the boy his sport.

Every lesson, in front of the class, he found something. The boy's looks. His voice. His slowness. His dreams. He called him stupid, day after day, in front of the little boys, who learned the game and laughed along. The message never changed. He would never make anything of himself.

Writing was the one thing the boy loved, so writing was forbidden. The man called it a waste of time and told him to do his Latin.

Then it got worse. The boy was moved into the headmaster's own house as a boarder. Now the voice that ruled his days sat across the table at supper too. There was no room in his life the man couldn't reach.

And here is the darkest part. The boy began to believe him. Maybe he was stupid. Maybe the people who paid had wasted their money.

He didn't say so. This was his one chance.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "He stayed because leaving meant losing the funded schooling; he broke the ban and wrote \"The Dying Child\" during the Elsinore years, then could not keep it to himself and read it aloud, and its quality was recognized — documented. Why he stayed is interpretive.",
      text: `He stayed.

Not because he was brave in any grand way. Because leaving meant losing everything — the school, the money, the one door anyone had ever opened for him. So he got up every morning and took it, and did his Latin, and let the man have his sport.

But one rule he broke.

He wrote a poem. A small, sad thing about a child who was dying. He wasn't allowed to write it. He wrote it anyway.

Then he couldn't keep it to himself, and he read it out loud. People heard it. People said it was good.

If the man was right about him, the poem was worth nothing. He made it anyway. Some part of him refused to hand over the verdict.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The 1826 move with the headmaster's household to another town and the deeper isolation — documented. Sources differ on how much his letters told his patron, so the beat claims only that he did not say the whole of it; the shame and the fear of losing the funding are interpretive.",
      text: `Years passed like that.

The headmaster took over a school in another town and moved his household there. The boy went with him. New town, same table, same voice. Farther now from anyone who knew him. The loneliness closed in until every day tasted the same.

Five years, near enough. From seventeen to twenty-two. Years other people spend becoming themselves, spent being told daily what he could never become.

He wrote letters. He did not say the whole of it, not for a long time. He was ashamed of how bad it had got, and afraid too. Complain, and maybe the money stops. Maybe the chance closes.

But the truth has a way of traveling on its own.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The patron had written to the headmaster once and it eased for a time; in the spring of 1827 the boy wrote to him about how bad it had got, and at his insistent appeals the patron took him out of the school in April 1827, arranged a private tutor, and he passed the university entrance examination in 1828 — documented. That everyone expected him to fail it is interpretive.",
      text: `Word of what the school really was finally reached the man who paid for it.

He had guessed some of it. He had written to the headmaster once, and for a while the man eased off. But nothing changed until the boy said it himself. That spring the boy stopped protecting everyone and set down plainly how bad it had got.

The patron pulled him out at once.

No more headmaster. A private tutor instead, a patient one. And then the strangest discovery. Away from the daily grinding-down, the boy could learn. Quickly, even. The next year he sat the university entrance examination, the one everybody treated as beyond him. He passed.

The stupid boy. The hopeless boy. The boy who would never make anything of himself. He passed.

He walked out of that part of his life with two things. An education. And a bone-deep knowledge of what it is to be small in a room where someone bigger makes the rules.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Poems, travel books and novels first; the writing that made his name began in 1835 (age 30); translation into language after language, fame in his own lifetime and honor at home — documented, kept anonymous. What kind of writing it was is deliberately not said here, and no work is described; the reveal belongs to the bridge. That nobody thought it important at first is interpretive.",
      text: `He began to publish. Poems first, then travel books, then novels. People noticed.

And then, around thirty, he found the kind of writing that was actually his. Short pieces. The simplest words he could find. Nothing anyone would have called important at the time. Strange, sad, funny, true.

What he wrote traveled. Language after language, country after country, far past anywhere he had ever been. It has never stopped.

He was famous while he was still alive to see it. The place that had known him as a poor man's odd son ended up proud of him. People he would never meet knew his sentences by heart, and they still do.

He wrote, again and again, about the ones nobody expected anything of. Every page that was kind to the laughed-at came from somewhere. He knew exactly where.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Hans Christian Andersen.

He wrote The Little Mermaid, The Emperor's New Clothes, The Snow Queen, Thumbelina — fairy tales carried into language after language, all over the world. He said himself that one of them was his own story. That one is The Ugly Duckling: the odd, mocked bird who was never a duck at all. None of it existed yet in the years when a grown man made a classroom laugh at him every day.

Your life is not theirs. But a piece of this story may still sit beside you.

He spent five years being told, daily, by the person with all the power in the room, exactly what he was worth. He half believed it. That is what those voices do. But only half. The other half wrote a poem anyway.

The loudest voice in the room is not the truth about you. It wasn't about him.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 24, 1925, Fairfax OK, Osage Nation (father Osage; family had oil-lease
//    income); serious piano and ballet training from early childhood, family moved to LA at 8;
//    at her Los Angeles school classmates war-whooped at her, asked whether her father took
//    scalps and where her feathers were - she then began spelling the family name as one word,
//    Tallchief (NWHM exhibit); moved to NYC 1942 at 17, joined Ballet Russe de Monte Carlo;
//    Russians were assumed to be the best dancers and American dancers took Russian stage names
//    to be cast; director Sergei Denham suggested she Russianize hers to "Tallchieva"; she
//    refused: "Tallchief was my name, and I was proud of it" - she kept the family name but did
//    take a form of her middle name for the stage on Agnes de Mille's suggestion, so Betty Marie
//    Tall Chief was billed as Maria Tallchief; corps years of wartime touring; Balanchine arrived
//    as choreographer 1944 and began casting her; she was the first American to dance with the
//    Paris Opera Ballet (1947, age 22); Balanchine's Firebird premiered Nov 27, 1949 (age 24),
//    making her America's first prima ballerina. (They married 1946; the marriage is deliberately
//    left out of the beats.) d. 2013.
//  Interpretive: the name-or-career choice as the episode's spine; the precision-as-answer corps
//    framing; the "a girl from her people could see a name like her own" line. Grounded in her
//    memoir Maria Tallchief: America's Prima Ballerina and the NWHM exhibit.
//  Avoid saying: don't name Tallchief / Osage / Oklahoma / Balanchine / Firebird / Paris before
//    the bridge; don't move the school-era war-whoop mockery inside the company (it is documented
//    at her Los Angeles school, not in the dressing rooms); don't say the name went unchanged (she
//    kept the family name, not the first name she was born with); don't fabricate poverty (the
//    family had oil money); no marriage subplot; keep the mockery brief and un-lurid.
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
    "At seventeen she joined a company where every serious dancer had a Russian name, and the management told her to trade hers in; she refused, and set out to be too good to ignore under her family's name.",
    "She was mocked for where she came from and treated as a novelty in the corps, and she answered by being twice as precise as anyone in the room.",
    "The girl who wouldn't change her name became her country's first great ballerina — under that name.",
  ],
  facets: {
    emotionalCore:
      "Being told the truest thing about her — her name, her people — was a career liability to be erased, and deciding the price of belonging was too high if it cost who she was.",
    decisionShape:
      "Whether to take the Russian-sounding name that would smooth her path, or to keep the name her family gave her and force the field to accept it.",
    triggerEvent:
      "The company's director suggested she trade her family name for a Russian-sounding stage name, because in that world a Russian name was what got a dancer taken seriously.",
    agencyState:
      "A teenager at the bottom of a rigid company, with no say in casting and no allies in power — but complete say over one thing: what she would answer to.",
  },
  biographicalFacts:
    "Maria Tallchief was born Elizabeth Marie Tall Chief on January 24, 1925, in Fairfax, Oklahoma, a citizen of the Osage Nation; her family's oil-lease income paid for serious piano and ballet training, and the family moved to Los Angeles when she was eight to further the children's education. At school in Los Angeles her classmates mocked her name, made war whoops when they saw her, and asked whether her father took scalps and where her feathers were; she began spelling the family name as one word, Tallchief. In 1942, at seventeen, she moved to New York City and joined the Ballet Russe de Monte Carlo, dancing in the corps de ballet. Ballet in America was then a Russian world: Russian dancers were assumed to be the best, American dancers routinely took Russian stage names to be cast, and the company's director, Sergei Denham, suggested she adopt the stage name \"Tallchieva\". She refused — \"Tallchief was my name, and I was proud of it\" — and kept the family name; on the choreographer Agnes de Mille's suggestion she took a form of her middle name for the stage, so Betty Marie Tall Chief was billed as Maria Tallchief. She spent her early years in the wartime corps de ballet, taking class relentlessly and gaining roles as the company's Russian stars moved on. When George Balanchine became the company's choreographer in 1944, he noticed her musicality and precision and began casting her; in 1947, at twenty-two, she became the first American to dance with the Paris Opera Ballet. On November 27, 1949, Balanchine's Firebird premiered at New York City Ballet with the lead created on her; the performance made her America's first prima ballerina, and John Martin of The New York Times praised her in his review the next morning. She retired in 1966, directed the Chicago City Ballet in the 1980s, and died April 11, 2013.",
  sources: [
    "Tallchief, Maria, with Larry Kaplan. Maria Tallchief: America's Prima Ballerina (New York: Henry Holt, 1997), Chapters 2-5.",
    "Osage Nation and Oklahoma Historical Society biographical materials, \"Tallchief, Elizabeth Maria.\"",
    "National Women's History Museum, \"Maria Tallchief.\"",
    "Encyclopedia of Oklahoma History and Culture (Oklahoma Historical Society), \"Tallchief, Elizabeth Maria\" — the Ballet Russe request that she become \"Tallchieva,\" her refusal, and the Betty Marie Tall Chief to Maria Tallchief compromise; Balanchine joining Ballet Russe in 1944; retirement in 1966; Chicago City Ballet 1980-1987; death April 11, 2013.",
    "National Women's History Museum online exhibit, \"Maria Tallchief: America's Prima Ballerina\" — the school-era mockery of her name and heritage; the 1947 Paris Opera Ballet engagement at twenty-two.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Arrival at 17 into the Russian-dominated company; the back-line hierarchy; her disciplined training background and the family's move west - documented.",
      text: `There was a girl of seventeen in a famous touring ballet company.

She had trained her whole childhood for this. Hours of piano. Hours of ballet. A family who took her talent seriously and moved across the country for it. Now she was in, at the very bottom, one dancer in the back line.

The company came from far away, in the old tradition. The stars had names from that faraway country. So did the teachers. So did the American dancers — because everyone understood that a plain American name would not be taken seriously. You took a new name the way you took the right shoes. That was just the custom.

She already had a name. It was her father's name, and his father's. Her people had carried it a long time.

She was about to find out what it cost to keep it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Denham's documented 'Tallchieva' suggestion, and the documented assumption that the best dancers were Russian. The war-whoop and scalping mockery is documented from her Los Angeles school years and is carried here as memory - it is NOT placed inside the company, where the record shows name pressure, not war cries.",
      text: `The management called it a small thing.

Just soften the name. Make it sound like it came from the old country. A few letters, and doors open. Everyone does it. Surely she wanted a career more than she wanted a word.

She had heard the other version of that message her whole life. At school, kids had made war cries when she walked by. They asked if her father took scalps. They asked where her feathers were. They said it lightly, with a smile she was supposed to return.

Now she was in a world where everyone assumed the best dancers came from that faraway country.

Politely and not, it was all the same sentence: what you are is a problem. Fix it.

She was seventeen. No power over casting. No one important on her side. One career she had spent her whole childhood building.

All she had to do to protect it was give up her own name.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Her documented refusal and its stated ground ('Tallchief was my name, and I was proud of it'); the documented stage-name compromise (a form of her middle name, suggested by Agnes de Mille) is kept in so the story does not claim more defiance than the record supports. The resolve to be better every day is interpretive.",
      text: `She said no.

No speech. No scene. She just refused. The name was her name. She was proud of it — proud of her father, proud of her people. She was not going to pretend to come from somewhere else to make strangers comfortable.

She did take a new first name for the stage, a version of her middle name. The family name stayed exactly as it was.

And she knew what that would cost. Every day from now on, she would have to be better than the dancers who took the easy road.

So she went back to work.

She took every class. Then she took more.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Corps years of wartime touring, relentless class-taking, and roles opening as the company's Russian stars moved on - documented in her memoir. The precision-as-answer framing and being treated as a curiosity are interpretive.",
      text: `Those years were long.

Touring town after town. Dancing in the back lines, where nobody watches. Watching the famous names take the bows. To some in the company she was just a curiosity. The girl with the odd name. It didn't matter how clean her dancing was.

She answered the only way a girl with no power can. Precision. She became exact, every time, in a way nobody could argue with. Musical in a way you can't teach. The kind of dancer other dancers stop to watch in class, while the posters still spelled other people's names.

Slowly, the company's stars moved on. Roles opened up. She was ready for every one of them. She had been ready for years.

And people who mattered had started to notice the girl who wouldn't change her name.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Balanchine's 1944 arrival, his noticing her musicality and precision, and the 1947 Paris Opera Ballet first - documented. Him standing at the front of class is compressed from standard accounts; no claim is made about his rank at the time.",
      text: `A new ballet master came to run the company's dances. He was from the old country too, quiet, and already famous among people who knew.

He stood at the front of class and watched. He did not care about names, old country or new. He cared about music. He cared about whether a body could keep up with what he heard.

Hers could.

He started making roles for her. Bigger ones. Stranger ones. Faster ones. Other people saw a girl from nowhere with the wrong name. He saw a dancer nobody had used yet.

A few years later she was asked to dance as a guest with a great old company across the ocean. No dancer from her country had ever danced with them before. The name printed in the program was her family's name. Not a borrowed one.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The ballet created on her (premiere November 27, 1949), her standing afterward, the long career, the decades of teaching and her own company - documented, names and title withheld. The role itself is described only in general terms; 'The papers wrote about her the next morning' compresses the reviews; the line about a girl seeing a name like her own is interpretive.",
      text: `Then the choreographer built a whole ballet on her. On her speed, her sharpness, her line. Not a part borrowed from some famous dancer of the past. A part that had never existed before.

Opening night settled it. Not an American hiding under a borrowed foreign name. An American, under her own family's name, at the very top of the art.

The papers wrote about her the next morning. For the first time, a girl from her people could look at the top of that world and see a name like her own.

She danced at that level for years. Then she taught for decades, and ran a company of her own. Her name went up on posters exactly as it was, for the rest of her life.

They had told her it was a small thing to change. She had understood it was the whole thing.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Maria Tallchief.

She was Osage, and she became America's first prima ballerina. Balanchine created his Firebird for her. She was the first American ever to dance with the Paris Opera Ballet. She did all of it under the name she had refused to trade for "Tallchieva". None of that had happened yet on the day we just sat with her, seventeen and at the bottom of the company.

Your life is not theirs. But a piece of this story may still sit beside you.

Everyone with any power over her career agreed that the smart move was to erase a little of herself. Just a few letters. Just the surface. She bet everything the other way.

You don't have to make yourself smaller to be let in. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Nov 14, 1907, Vimmerby (small, pious Swedish town); first woman in the town to
//    cut her hair short (people asked her to lift her hat and look); trainee at the local paper at
//    16; spring 1926 (age 18) pregnant by Reinhold Blomberg, the paper's editor-in-chief — married
//    to his second wife with a divorce pending, b. 1877 so ~30 years her senior, already father of
//    seven; she described the town gossip as like lying in a snake pit; he wanted to marry her once
//    the divorce was final and she refused categorically, saying she could not imagine mothering his
//    seven children in Vimmerby; moved alone to Stockholm, Bar-Lock secretarial school; traveled to
//    Copenhagen (Rigshospitalet let a mother give birth without naming the father) and bore Lars
//    ("Lasse") Dec 4, 1926, at 19; left him in Bronshoj with foster mother Marie Stevens; visited
//    when fare allowed while typing for a living; Dec 1929 Stevens's heart gave out and she could no
//    longer keep him — Lasse reached Stockholm Jan 1930 (Astrid 22), a few months in her rented room,
//    then just over a year with her parents at Nas, and with her for good after she married Sture
//    Lindgren in 1931; Pippi Longstocking published 1945. Biographers connect her books' fierce
//    child-respect to these years. d. Jan 28, 2002, Stockholm.
//  Interpretive: "she said no to the man and the town at once"; the "promise to come back for him"
//    framing used in the facets and beats 3-4 (she visited and did collect him; no promise is on
//    record); the guilt of the train-window goodbyes; "the kind of mother children flock to."
//    Grounded in Andersen's biography and her own late-life accounts.
//  Avoid saying: don't name Lindgren / Pippi / Sweden / Stockholm / Copenhagen before the bridge;
//    no romance framing of Blomberg (older, married, her boss — stated plainly, briefly); never
//    moralize about the pregnancy; the foster mother is rendered kind (she was); don't say the
//    homecoming put mother and son under one roof for good — that came with the 1931 marriage; don't
//    give her an age at Pippi's publication (she turned 38 that same autumn); and don't describe
//    the books' children in recognizable form (the strong girl keeping house on her own) or claim
//    an all-time readership superlative before the bridge.
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
    "Astrid Lindgren was born Astrid Ericsson on November 14, 1907, on a farm outside Vimmerby, a small and pious town in southern Sweden. As a teenager she was the first woman in the town to cut her hair short; people stopped her in the street and asked her to take off her hat so they could see it. At sixteen she became a trainee at the local newspaper, writing short reports and proofreading; its editor-in-chief, Reinhold Blomberg — born in 1877 and roughly thirty years her senior, married to his second wife and in the middle of a long divorce, and already the father of seven children — began a relationship with her, and in the spring of 1926, at eighteen, she found she was pregnant. In a town of Vimmerby's size and piety the scandal threatened to engulf her family; she later described the gossip as like lying in a snake pit that she wanted out of as fast as she could. Blomberg wanted to marry her once his divorce was final; Astrid instead broke with him categorically and refused, saying she could not imagine living with him in Vimmerby and mothering his seven children. She left for Stockholm alone, enrolling at the Bar-Lock Institute to train as a secretary — typing, shorthand, business correspondence — and living in a rented room on very little. In November 1926 she traveled to Copenhagen — where the Rigshospitalet let a mother give birth without naming the father — and on December 4, 1926, at nineteen, gave birth to her son Lars, called Lasse. Unable to keep him, she left him in Bronshoj outside Copenhagen with a foster mother, Marie Stevens, who was kind to him. She took her first secretarial post in Stockholm in 1927 and worked as a typist and secretary through these years, saving the fare to visit Lasse when she could, watching him grow attached to another home and fearing she was failing him. In December 1929 Marie Stevens's heart gave out and she could no longer care for the boy; in January 1930, at twenty-two, Astrid brought the three-year-old Lasse — who by then spoke Danish and considered the Stevens family his own — to Sweden. He lived with her in her rented room for a few months, then just over a year with her parents on the farm at Nas, and was with her for good when she married Sture Lindgren in 1931. Pippi Longstocking was published in 1945; it and the books that followed were translated the world over and made her one of the most read children's authors in the world, and her biographers trace their radical child-respect to these years. She died in Stockholm on January 28, 2002.",
  sources: [
    "Andersen, Jens. Astrid Lindgren: The Woman Behind Pippi Longstocking, trans. Caroline Waight (New Haven: Yale University Press, 2018), Chapters 2-4.",
    "The Astrid Lindgren Company, official biography, \"Youth\" and \"Youth: Lasse\" (astridlindgren.com).",
    "Lindgren, Astrid. Samuel August från Sevedstorp och Hanna i Hult (1975; her own account of her origins).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The short haircut and the townspeople asking her to lift her hat, the newspaper traineeship at sixteen, the much older married editor whose marriage was ending — all documented. No invented interior state; the pregnancy is stated plainly, without romance.",
      text: `There was a girl in a small farm town. One church, one main street, no secrets.

She was quick and funny and a little too modern for the place. She was the first woman there to cut her hair short. People stopped her in the street and asked her to lift her hat so they could look.

At sixteen she talked her way into a job at the town's little paper. People said she had a future.

The man who ran the paper was much older. He was married, though the marriage was ending. He was her boss. He turned his attention on her, and she was much too young for any of it.

In the spring of her eighteenth year, she found out she was pregnant.

In that town, there was no such thing as a private catastrophe.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The threat to her family, the editor's wish to marry her once his divorce was final, his seven children, and her categorical refusal — documented. The snake-pit line is her own description of the town gossip, given here as indirect speech. What she thought while she sat with it is interpretive.",
      text: `She could see the whole script laid out for her, and everyone in it.

The whispering had already started. She said later that it was like lying in a snake pit. She wanted out of it, fast. And this was going to land on her family too, hard.

The town had one approved ending for a girl in her condition. Marry the man. He was willing. Wait for his divorce, take his name, and raise the seven children he already had.

All she had to do was hand him the rest of her life.

She was eighteen. She sat with it. The shame. The fear of what was coming. A baby, no money, no husband, no plan.

Underneath all of it was one stubborn fact. She did not want him.

Marrying him would fix everything except her.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The break with the editor, the move to the capital alone, the secretarial training, and the hospital abroad that let a mother give birth without naming the father — documented. Travel is rendered as ordinary travel; no sourced detail beyond that.",
      text: `She said no.

No to the man. No, with the same word, to the town's whole script for her. She broke it off completely. Then she got on a train to the capital, alone, with almost nothing.

She rented a small room. She enrolled in a school for secretaries. Typing, shorthand, the skills that can feed a person. By night she was one more girl nobody in the city knew. That was terrible, and it was also the point.

The baby was coming either way. She found out there was one city, in the country next door, where a woman could give birth without naming the father on any record.

When the time came she took the train there, by herself, and had her son among strangers.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The foster mother's kindness, the years of typing and secretarial work, the visits paid for out of her wage, the boy's Danish and his attachment to the foster home, and her fear that she was failing him — documented. The questions she asks herself on the way back are interpretive, and the 'promise' is an editorial framing, not a recorded vow.",
      text: `She could not keep him. No money, one rented room, a wage that barely fed one person.

A kind woman in that other country took him in. That was the mercy in it, and it was also the knife. Her boy was loved. He was loved in another country, by somebody else.

For three years she worked and saved and visited when she could afford the fare. Each visit he was bigger. Each visit he spoke more, in the other country's language. He called that woman's house home, because it was the only home he knew.

She rode back after every goodbye asking the same questions. Was she failing him? Would he ever really be hers? Had she already made the mistake that cannot be undone?

She kept working. She kept visiting. She kept the promise alive with nothing to back it up.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "In December 1929 the foster mother's heart was failing and she could no longer care for Lasse; he reached Sweden in January 1930, aged three, spoke Danish and knew the Stevens as his family; he stayed a few months in Astrid's rented room and then just over a year with her parents on the farm — all documented. The winter journey north is dramatized texture, and the reason given for the move to the farm is interpretive.",
      text: `That winter, word came that the kind woman was ill. Her heart was failing her, and she could not keep the boy any longer.

So the girl went and got her son.

He was three. He was small and serious. He spoke a language she had to reach across. He knew that woman's kitchen as home, and her family as his family. Now a young woman he had only ever known as a visitor was telling him he was going home. To a place he had never been.

They rode north together in the winter dark. Strangers, and mother and son, both at once.

It was not a storybook ending. It was harder than that. He stayed in her one room for a few months. Then he went to her parents' farm, because that was what she could manage.

But he was on her side of the water now. She was twenty-two, and she had kept the promise.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The 1931 marriage that finally brought the boy home for good, the daughter born after it, the turn to writing in her thirties, the character of the books, and biographers' linking of her child-respect to these years — documented. 'The kind of mother children flock to' is interpretive. Kept anonymous.",
      text: `Just over a year later she married, and the boy came to live with them for good. Then a daughter. Rooms full of children's noise, finally, all in one place.

She turned out to be the kind of mother children flock to.

And then, in her thirties, she started writing stories down. Stories for children, but not like anybody else's. Her children were brave and funny and free. They talked back. They were allowed to be difficult, and they were loved anyway. Her books took the child's side against the whole grown-up world, every time, without apology.

The books went everywhere. Her country loved her. Children she would never meet grew up on her books.

People asked, later, where her fierce tenderness for children came from. Her readers did not know. The serious little boy on the winter train knew.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Astrid Lindgren.

She wrote Pippi Longstocking, and dozens of other books, and they made her one of the best loved children's writers in the world. Whole generations, in language after language, grew up on her wild and funny and free children. None of that had happened yet on the morning we just sat with her, eighteen and pregnant in a town with no secrets.

Your life is not theirs. But a piece of this story may still sit beside you.

She was young, and ashamed, and sure she was failing her child. All three at once, for years. She turned down the life that would have made her respectable. Then she kept her promise to her son slowly, on a typist's wage, with no proof that it would work.

You don't have to feel brave to keep going. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. ~July 4, 1844 (Greenbush NY; year contested — she gave 1842, 1844 and 1854 on
//    different documents), mother Mississauga Ojibwe/African American, father Afro-Caribbean
//    (usually described as Haitian; sources conflict); orphaned by ~9, raised with her older
//    half-brother Samuel by maternal aunts among her mother's Ojibwe people; Samuel (California
//    gold money) funded her schooling; Oberlin College from 1859 (one of the few colleges admitting
//    Black women); winter 1862: two white classmates fell ill after spiced wine and accused her of
//    poisoning them; before the case was heard she was dragged into a field at night by unknown
//    assailants, badly beaten and left for dead — hurt so badly she could not walk, and the trial
//    was postponed; defended at trial by John Mercer Langston, charges dismissed for lack of
//    evidence (the stomach contents were never analyzed, so no corpus delicti); resumed studies;
//    early 1863 accused of stealing artists' materials (dismissed), then charged with aiding a
//    burglary, and the college forbade her to register for her final term — no degree; early 1864,
//    ~age 19, went to Boston with a letter of introduction (written by an Oberlin trustee) to
//    William Lloyd Garrison, trained with sculptor Edward Brackett; her abolitionist medallions and
//    her bust of Col. Robert Gould Shaw (bought by his family; ~100 plaster copies sold) paid her
//    passage — sources date her move to Rome to 1865 or 1866; she carved her own marble rather
//    than hire Italian carvers, because women sculptors
//    were routinely accused of not doing their own work; her studio became a tourist stop; first
//    African-American and Native American sculptor of national then international standing; The
//    Death of Cleopatra stunned the 1876 Centennial. d. London, Sept 17, 1907.
//  Interpretive: "the verdict didn't matter to the door" — the expulsion-after-acquittal as the
//    episode's core wound. Grounded. The record shows accusation and dismissal for want of
//    evidence, not a proven lie, so the beats say there was never any proof rather than that the
//    story was untrue.
//  Avoid saying: don't name Lewis / Oberlin / Langston / Garrison / Rome / Cleopatra before the
//    bridge, and don't describe the Centennial or the dying-queen statue in recognizable form — a
//    stranger reading beats 0-5 must not be able to name her; the beating stays in two restrained
//    sentences, no graphic detail; don't state the accusers' motive as fact, and don't state the
//    college's motive as fact either.
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
    "Edmonia Lewis was born around July 4, 1844, near Greenbush, New York; her mother was of Mississauga Ojibwe and African-American descent, her father Afro-Caribbean and usually described as Haitian, though the sources conflict. She gave 1842, 1844 and 1854 as her birth year on different documents. Orphaned by about nine, she was raised with her older half-brother Samuel by two maternal aunts, much of it among her mother's Ojibwe people; Samuel, who had made money in the California gold fields, paid for her schooling and in 1859 sent her to Oberlin College in Ohio, one of the few colleges in America that admitted Black women. In the winter of 1862, two white classmates fell ill after drinking spiced wine with her and accused her of poisoning them. Before the case was heard she was dragged into a field at night by unknown assailants, badly beaten, and left there; she was so badly injured that she could not walk, and the trial was postponed. At trial she was defended by John Mercer Langston, an Oberlin graduate and the first African-American lawyer in Ohio; the charges were dismissed for lack of evidence — the contents of the two women's stomachs had never been analyzed, so there was no proof that any poisoning had taken place. She resumed her studies while still recovering. In early 1863 she was accused of stealing artists' materials; that charge was also dismissed for lack of evidence, and a few months later she was charged with aiding and abetting a burglary. The college then forbade her to register for her final term, ending her education without a degree. In early 1864 she moved to Boston carrying a letter of introduction, written by an Oberlin trustee, to the abolitionist William Lloyd Garrison, who sent her to the sculptor Edward Brackett; she learned to model and carve, and her portrait medallions of abolitionists and her bust of Colonel Robert Gould Shaw — the Shaw family bought the original and she sold about a hundred plaster copies — paid her passage to Europe. Sources date her move to Rome to 1865 or 1866. In Rome she worked among the expatriate sculptors and, unusually, enlarged and carved her own marble rather than hire Italian carvers, because women sculptors were routinely accused of not doing their own work; her studio became a stop on the tourist circuit. She was the first African-American and Native American sculptor to achieve national and then international prominence; her Rome works included Forever Free, Old Arrow-Maker and Hagar, and her monumental The Death of Cleopatra was one of the sensations of the 1876 Philadelphia Centennial Exposition. She died in London on September 17, 1907.",
  sources: [
    "Blodgett, Geoffrey. \"John Mercer Langston and the Case of Edmonia Lewis: Oberlin, 1862.\" Journal of Negro History 53, no. 3 (1968).",
    "Buick, Kirsten Pai. Child of the Fire: Mary Edmonia Lewis and the Problem of Art History's Black and Indian Subject (Durham: Duke University Press, 2010).",
    "National Park Service, \"Edmonia Lewis\" biographical materials.",
    "Smithsonian American Art Museum, artist record for Edmonia Lewis and collection entry for The Death of Cleopatra (americanart.si.edu).",
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
        "The poisoning accusation; the night attack in a field by unknown assailants; injuries so severe she could not walk and the trial was postponed — all documented, rendered in two restrained sentences. Her exact age is uncertain because her birth year is contested, so the beat says seventeen or eighteen.",
      text: `Two classmates fell ill, and the story that went around was that she had poisoned them.

There was never any proof. The story didn't need any. It only needed to be about her — the orphan, the outsider, the one the town already resented. It went through that town like a dropped match.

Before she ever saw a courtroom, men came for her in the dark. They dragged her out to a field and beat her and left her lying there.

She was hurt so badly she could not walk. The court had to put the trial off. Still hurt, she had to get up and face it.

She was seventeen or eighteen. Everyone she loved was hundreds of miles away. The whole town had already decided about her. The men in that field had delivered their verdict, and the real court had not even started.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The trial: defended by John Mercer Langston, an Oberlin graduate and the first Black lawyer in Ohio; charges dismissed because the alleged poison was never analyzed; she resumed her studies while still recovering — documented. No source reached in this pass describes how she left the courtroom, so the beat does not say.",
      text: `She stood trial.

A lawyer took her case — a Black man who had come up the same road. He took the whole thing apart. Nobody had ever checked for poison. There was no evidence. There had never been any evidence. The charges were dismissed.

She had not been alone in that room. That mattered.

And then she did the hard, unglamorous thing. She went back to class.

Still healing. Still whispered about — a verdict doesn't stop whispers. She walked back into the same buildings, past the same faces, and picked her education back up. It was hers. Her brother had paid for it. She had done nothing wrong.

She thought the worst was over. The court had said so.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The 1863 artists'-materials accusation (dismissed for lack of evidence), the further charge that followed, and the college's refusal to let her register for her final term — documented. 'The verdict didn't matter to the door' is interpretive framing; the college's motive is not stated as fact.",
      text: `A year later, a new accusation. Supplies missing from the art room. Nothing was proven. Then another charge after that.

It didn't matter. The school had had enough of the trouble that kept finding her. As if she were the trouble, and not the one it kept happening to. When it came time to register for her final term, the answer was no. No hearing. No verdict. No appeal. She simply would not be allowed to finish.

She had won in court, and it made no difference to the door.

That was the lesson the place taught her in the end. Not the one in the catalog. Being cleared is not a key. Some doors stay shut no matter what a court says.

She could have spent years knocking on that one. She looked at it, and she turned around.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Boston in early 1864 with a letter of introduction to William Lloyd Garrison, who sent her to the sculptor Edward Brackett; the abolitionist medallions; the Shaw bust bought by his family and sold in about a hundred copies, which paid her passage to Europe — documented. Names and places are withheld for the bridge.",
      text: `She went east, to a big city. She carried one letter of introduction, to a famous man who had spent his life on her people's cause.

The letter worked. He read it and sent her to a sculptor — a real one, with a working studio. He asked him to see what she could do.

Clay first. Then stone. It turned out her hands had been waiting for stone her whole life.

She started small. Little carved portraits of the heroes of the cause, sold to people who admired them. Then a portrait of a young officer. His family bought it. Then other people wanted copies, and she sold copy after copy.

It was enough for the boldest move a sculptor could make. She got on a ship and crossed the ocean, to an old city where the marble comes out of the mountains. Nobody there was going to ask to see her degree.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The Rome studio; her insistence on carving her own marble because women sculptors were accused of not doing their own work; the studio as a tourist stop; the reception of her monumental Cleopatra — documented. The exhibition and the statue's subject are deliberately withheld so the reveal lands in the bridge.",
      text: `In the old city she opened her own studio. She cut the marble herself. Other sculptors hired men to do that part. She wouldn't. If she did, someone would say the work wasn't really hers, and she had heard enough of that.

People started coming to see her work. Buyers. Visitors. Strangers who had heard there was a young woman doing this.

She carved people her country had never thought to put in stone. She carved them standing up.

And then she made the big one. The most ambitious thing she had ever attempted, at full size. When it went on public view, people stopped in front of it and could not move on.

The school that wouldn't let her finish became a footnote in her story. Not the other way around.

That is what the orphan girl from the field became.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Edmonia Lewis.

She was the first sculptor of African-American and Native American heritage to win international fame. She carved her own marble, in her own studio. Women in her trade were so often accused of having someone else do the real work. Her masterpiece, The Death of Cleopatra, stands in the Smithsonian today. None of that had happened yet on the morning she was too hurt to stand up, waiting for a trial.

Your life is not theirs. But a piece of this story may still sit beside you.

She learned the hardest version of it. You can be cleared and still lose the place. Being right did not open the door. So she stopped standing at that door, and she went and built a room where the work spoke for her.

You don't have to be believed yet to keep going. She wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 15, 1850, Moscow, general's daughter; her childhood nursery at Palibino was
//    papered with lithographed pages of Ostrogradsky's calculus lectures (her own memoir); at ~14
//    she worked out trigonometry on her own to read the optics chapter of a physics text written by
//    a neighbour, Prof. Nikolai Tyrtov, who then urged her father to let her study further; Russian
//    universities barred women, and women could not travel abroad without a father's or husband's
//    permission; her father refused study abroad; 1868 (18) contracted a "fictitious marriage" with
//    Vladimir Kovalevsky (a practice in radical circles) to get free; Heidelberg 1869, auditing only
//    by special permission; Berlin 1870 — the university refused women entirely, and Karl
//    Weierstrass, convinced when she solved within a week the problems he set to send her away,
//    taught her privately most weeks for four years; 1874 (24) doctorate in absentia from Göttingen,
//    summa cum laude, on three papers incl. the Cauchy-Kovalevskaya theorem — the first woman in
//    modern Europe to earn a mathematics doctorate; Stockholm: arrived late 1883, lecturing as
//    privatdocent by early 1884, extraordinary (five-year) professor June 1884, full permanent
//    chair June 1889 — that chair, not the 1884 post, is the "first woman in modern Europe" one;
//    Prix Bordin 1888 (one MacTutor summary says 1886; 1888 is the standard account and is what
//    the facts state). d. Feb 10, 1891, influenza with pneumonia, at 41.
//  Interpretive: the marriage-as-a-key framing; the door made of paperwork. Grounded in her memoir
//    A Russian Childhood and standard biographies.
//  Avoid saying: don't name Kovalevskaya / Russia / Weierstrass / Berlin / Heidelberg / Göttingen /
//    the theorem / her husband's field before the bridge. The nursery-wallpaper anecdote is now
//    facts-only — it was cut from the beats because a reader can name her from it on sight; the
//    "first woman in modern Europe" superlatives belong to the bridge, not to beat 5; and don't
//    bill Weierstrass as the greatest mathematician of the age (that identifies him, and her). The
//    marriage is a documented arrangement, not a romance — keep it exactly that. Don't put the
//    prizes after the full chair: the Prix Bordin (1888) came before it (June 1889).
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
    "Sofia Kovalevskaya was born January 15, 1850, in Moscow, the daughter of General Vasily Korvin-Krukovsky. At the family estate at Palibino, her childhood nursery had been papered — by chance, when wallpaper ran short — with lithographed pages of Ostrogradsky's calculus lectures from her father's student days, and she later wrote of puzzling over the strange symbols for hours; at about fourteen she worked out trigonometry on her own in order to read the optics chapter of a physics textbook written by a neighbor, Professor Nikolai Tyrtov, who was impressed enough to urge her father to let her study mathematics seriously. Russian universities did not admit women, and by law a woman could not obtain the passport needed to study abroad without the permission of her father or husband. Her father refused. In September 1868, at eighteen, she contracted a \"fictitious marriage\" — an arrangement then known in Russian radical circles — with the young paleontology student Vladimir Kovalevsky, and the couple traveled to Germany. At Heidelberg in 1869 she could only audit lectures by special permission of each professor. In 1870 she moved to Berlin, where the university refused women entirely; she went to Karl Weierstrass, the most celebrated analyst in Europe, who set her a list of difficult problems to put her off — and, when she returned within the week with solutions that convinced him at once of her ability, agreed to teach her privately, which he did most weeks for the next four years. In 1874 she presented three papers — including the result now taught as the Cauchy-Kovalevskaya theorem on partial differential equations — and the University of Göttingen granted her a doctorate in absentia, summa cum laude, making her the first woman in modern Europe to receive a doctorate in mathematics. After years in which no university would employ her, she was invited to Stockholm University, where she began lecturing as a privatdocent and, in June 1884, was appointed an extraordinary professor on a five-year appointment; in June 1889 she was made a full professor with a permanent chair — the first woman in modern Europe to hold one. She won the French Academy of Sciences' Prix Bordin in 1888. She died on February 10, 1891, of influenza complicated by pneumonia, at forty-one.",
  sources: [
    "Kovalevskaya, Sofia. A Russian Childhood, trans. Beatrice Stillman (New York: Springer, 1978).",
    "Koblitz, Ann Hibner. A Convergence of Lives: Sofia Kovalevskaia — Scientist, Writer, Revolutionary (Boston: Birkhäuser, 1983), Chapters 3-6.",
    "Cooke, Roger. The Mathematics of Sonya Kovalevskaya (New York: Springer, 1984).",
    "O'Connor, J. J., and E. F. Robertson. Sofia Vasilyevna Kovalevskaya — MacTutor History of Mathematics Archive, University of St Andrews (mathshistory.st-andrews.ac.uk).",
    "Riddle, Larry. Sofia Kovalevskaya — Biographies of Women Mathematicians, Agnes Scott College (mathwomen.agnesscott.org).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Self-taught trigonometry at about fourteen from a neighbour's physics book, and his report to her father — documented. The family's plan for her life is documented in outline and compressed here. The nursery-wallpaper anecdote was cut from the beat because a reader can name her from it; it stays in the facts.",
      text: `There was a girl who loved numbers.

When she was fourteen, she picked up a science book she couldn't read. It used a kind of math nobody had taught her. So she worked that math out herself, page by page, until the book opened up. The man who wrote it lived nearby. When he heard, he told her father the girl had a rare mind.

Everyone agreed about the mind. Everyone also agreed about her life, and that had been settled long before she was born. A daughter of a family like hers marries well. She runs a house. She learns a little piano, a little French, and nothing more.

The universities of her country did not admit women. Not one. Not partway. Not ever.

She had the mind. There was nowhere to take it.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The legal travel bar (a father's or husband's permission for the papers) and her father's refusal — documented. His words are given as indirect speech, never quoted; the closing-over feeling at the end is interpretive.",
      text: `There were universities in other countries that had begun, slowly and partly, to let women in.

She might as well have been told about universities on the moon.

Her country had a second wall behind the first one. A woman could not get the papers to travel without a man's permission. Her father's, or a husband's. Her own signature meant nothing. Someone else had to sign for her life.

So she asked her father. He said no. Girls from families like theirs did not go off to foreign lecture halls. The subject was closed.

And that was supposed to be the end of it. A remarkable mind, everyone agreed — and a life already furnished for it down to the last chair. The house. The marriage waiting. The years of it.

She was eighteen. She could feel the whole thing closing over her like water.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The fictitious marriage at eighteen — a known arrangement in the radical circles of the time — and the move abroad are documented. His name and field are withheld; that the arrangement was agreed in advance is documented, not invented character.",
      text: `The law said she needed a husband's signature. The law did not say the marriage had to be real.

Among the young idealists she had started to know, there was a quiet practice for exactly this trap. A marriage on paper. A sympathetic young man lends his name, the papers get signed, and the woman gets her freedom to travel.

She found such a man. A student, decent, in on the plan from the start. They married. She got the one key that fit the one door.

She was eighteen, married to someone she barely knew, and free.

Then they left the country. On the other side of the border were the universities.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Audit-only status at the first university, granted professor by professor, and the second university's total refusal of women — documented. Going to the teacher's house is documented; the knock itself is texture.",
      text: `Freedom turned out to be smaller than she had pictured.

At the first university she could not enroll. She could only sit in on lectures, and only if each professor agreed to have a woman in his hall. Some did. Some didn't. She asked for those permissions one at a time. Then she outworked everyone in every room they let her into.

After that she moved to the city she really wanted, because the best teacher in her subject was there.

That university did not admit women at all. Not to enroll. Not to sit in. A flat no.

She had crossed a continent. She had married a stranger. She had given up her whole assigned life. And the door in front of her was locked exactly like the ones at home.

So she went around the university. She knocked on the teacher's front door instead.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The screening problem set, how fast she solved it, his being convinced at once of her ability, and four years of near-weekly private lessons — documented. He is left unnamed and his standing left general; no gesture and no dialogue are invented.",
      text: `He did what busy famous men do with visitors they don't want. He set her a test meant to end the conversation.

A list of problems. Hard ones, the kind he gave his most advanced students. The polite version of go away.

She came back with the answers.

Not just correct answers. Answers good enough to convince him on the spot that this was a rare mind. Whoever this young woman was, she was not a curiosity. She was the real thing.

The university still would not have her. That wall did not move.

So he moved instead.

Every week, in his own study, he taught her. The best teacher in the field, and the student his university would not seat. Just the two of them and the work. No enrollment. No hall. No permission from anyone.

For four years.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The in-absentia doctorate at twenty-four, summa cum laude, on three papers; the years afterward with no post; the prize and then the eventual full professorship — documented, and in that order. Names, dates and the 'first woman' claims are held back for the bridge.",
      text: `At twenty-four she handed in the work of those years. Three papers of new mathematics. One of them held a result students in her subject still learn today.

A university gave her the doctorate, with the highest honors, without ever once letting her sit in its lecture halls. She had never been allowed to be a student anywhere. She was a doctor of mathematics anyway.

Then the world went back to being the world. For years afterward, no university would hire her. The best-qualified woman in her field, and no job.

She kept going anyway. A prize committee honored work they could no longer pretend wasn't hers. Then one university finally made her a full professor, with her own chair and her own students.

The girl who taught herself the math to read one book had signed her own life after all. It only took a borrowed signature to get there.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Sofia Kovalevskaya.

She was the first woman in modern Europe to earn a doctorate in mathematics. She was also the first woman in modern Europe to hold a full university chair in it. The Cauchy-Kovalevskaya theorem is hers, and mathematics students still learn it today. On the day her father told her no, she was eighteen, in a life other people had already furnished for her. None of that had happened yet.

Your life is not theirs. But a piece of this story may still sit beside you.

Every proper door was locked, so she used the improper ones. A marriage on paper, for a signature she was not allowed to give herself. A private study instead of a lecture hall. She was never once let in the front way. She got the work done anyway, and the world caught up to it later.

You don't have to be let in to begin. She wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Feb 1 in Joplin MO — he gave 1902 (The Big Sea) and that year is still widely
//    printed, but newspaper evidence reported in 2018 points to 1901, so the beats state no exact
//    age; parents separated; father James moved to Mexico, scornful of Black Americans' prospects
//    and, by Langston's own account in The Big Sea, contemptuous of Black people and of his son's
//    poetry; he wrote "The Negro Speaks of Rivers" in 1920 on the train toward Mexico, published in
//    The Crisis June 1921; the father would fund only engineering study — compromise: Columbia
//    (1921-22), which he left amid racial hostility, and the father's support ended; jobs, then June
//    1923 shipped out to West Africa as a messman (S.S. West Hesseltine; "the Malone" in The Big
//    Sea) — off Sandy Hook he threw his books into the sea ("like throwing a million bricks out of
//    my heart," The Big Sea); Paris dishwashing 1924; Opportunity prize May 1925, Van Vechten took a
//    manuscript to Knopf, which ACCEPTED IT BEFORE the Dec 1925 Wardman Park night when he laid
//    three poems beside Vachel Lindsay's plate and woke up in papers nationwide; The Weary Blues
//    published mid-Jan 1926, weeks before his Feb 1 birthday. d. May 22, 1967.
//  Interpretive: "make something of yourself meant become someone else"; the books-overboard as
//    shedding an assigned life. Both grounded in The Big Sea.
//  Avoid saying: don't name Hughes / Columbia / Harlem / Mexico / Paris / Lindsay / poem or book
//    titles before the bridge; don't state his exact age (birth year unsettled); don't imply the
//    busboy night produced the book (Knopf had already said yes); the father's self-contempt handled
//    in one careful clause, no diagnosis; no "Harlem Renaissance" label before the bridge. A blind
//    reader named him from beats 0-5 (2026-08-27), so these stay out of the beats as well: the river
//    crossing at sunset (the river is the poem's subject; the envelope itself stays, since the bridge
//    calls back to it), the voyage down the West African coast, the million-bricks line, the
//    plate-and-tray staging of the hotel night, and blues/stoop wording for his voice.
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
    "The busboy who left three poems beside a famous man's plate woke up famous the next morning, and the first book a publisher had already accepted came out weeks later.",
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
    "Langston Hughes was born February 1 in Joplin, Missouri. He gave his birth year as 1902 in his autobiography The Big Sea and that year is still widely printed, but newspaper evidence reported in 2018 indicates 1901, so his exact age at each event below is uncertain by a year. His parents separated soon after his birth; his father, James Hughes, emigrated to Mexico, where he prospered — a man who, by Langston's account in The Big Sea, had come to despise the country that had blocked him, the Black Americans he had left behind, and, painfully, much of what his son was. In the summer of 1920, just out of high school, Langston rode the train toward Mexico hoping to persuade his father to pay for college; as the train crossed the Mississippi near St. Louis at sunset, he wrote \"The Negro Speaks of Rivers\" on the back of an envelope. The Crisis published it in June 1921 — his first poem in a national magazine. His father scorned poetry as a way to starve and would fund only an engineering education abroad; the compromise was engineering at Columbia University. Hughes enrolled in the fall of 1921, found the place hostile to Black students, spent more time in Harlem than in class, and left after the year — at which point, by his own account, his father's support ended. He worked odd jobs, and in June 1923 signed on as a messman on a freighter bound for West Africa (the S.S. West Hesseltine, which he called the Malone in The Big Sea); off Sandy Hook he threw his Columbia books into the sea, writing later that it was \"like throwing a million bricks out of my heart.\" He washed dishes at a Paris nightclub in 1924. In May 1925 his poem \"The Weary Blues\" won first prize in Opportunity magazine's literary contest; Carl Van Vechten carried a manuscript to Alfred A. Knopf, which accepted it that year — before the encounter that follows. In December 1925, working as a busboy at the Wardman Park Hotel in Washington, D.C., he wrote out three of his poems, carried them in his uniform pocket, and laid them beside the plate of Vachel Lindsay, one of the most famous poets in America, telling him he liked his poems and that these were his own; Lindsay read all three at his reading that night and told the press, and by the next morning reporters were waiting at the hotel, where he was photographed holding a tray. Knopf published The Weary Blues in mid-January 1926, weeks before his February 1 birthday. He became the defining poet of the Harlem Renaissance and one of the most beloved American poets of the century. He died May 22, 1967.",
  sources: [
    "Hughes, Langston. The Big Sea: An Autobiography (New York: Knopf, 1940), Parts I-II.",
    "Rampersad, Arnold. The Life of Langston Hughes, Volume I: 1902-1941 (New York: Oxford University Press, 1986).",
    "Academy of American Poets, \"Langston Hughes\" (poets.org).",
    "Schuessler, Jennifer. \"Langston Hughes Just Got a Year Older.\" The New York Times, August 9, 2018.",
    "Boundary Stones (WETA), \"Langston Hughes: D.C.'s Original Busboy-Poet\" (2024), citing the Washington Evening Star.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The train ride to the estranged father just out of high school, and the poem that arrived on that ride and was written on the back of an envelope — documented (The Big Sea). The river crossing at sunset is left out: the river is the subject of that famous poem, so naming it here gives the poem away. No age is stated: his birth year is unsettled (1902 by his own account, 1901 on 2018 evidence).",
      text: `There was a young man on a long train ride to meet his father — a father he barely knew.

His parents had split when he was a baby. The father had left the country years ago, bitter at everything it had refused him, and made money somewhere else. Now the son was out of school and full of words. He was going to ask the one rich man in his family to help pay for college.

Somewhere in the middle of that ride, a poem arrived. Most of it came at once. He wrote it on the back of an envelope.

He didn't know it yet. That envelope would outlive every plan his father had for him.

He rode on, hopeful. Hope was about to get complicated.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The father's documented contempt for poetry and for the people he had left, kept to one careful clause (The Big Sea), and the engineering-only funding condition — documented. The prosperous household is his own description; no age is stated, since his birth year is unsettled.",
      text: `His father, it turned out, had contempt to spare.

For the country he had left. For the people he had left — his own people, which the son could hardly bear to hear. And for poetry, which his father said was just a way to starve.

The deal came down flat and final. He would pay, and pay well, for an education in engineering. Something solid. Somewhere far from everything the son loved.

Poetry? No. Not one course of it. Not one dollar toward it.

The son sat in his father's fine house and understood the offer under the offer. Make something of yourself meant become someone else. The money was real. The door was open. All he had to do was walk through it and leave himself outside.

He was barely grown. The one man who was supposed to believe in him first plainly didn't.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The engineering compromise at a university in New York, the year there amid racial hostility, the end of his father's support, and the magazine publication of the poem from the train — documented. Where his heart actually was is his own account; the neighborhood, the school and the magazine stay unnamed, and the movement he was drawn to is no longer described.",
      text: `He tried the deal halfway.

A college in a big city, engineering courses, his father's money in his pocket and his father's plan on his desk. He lasted a year. The place was cold to students who looked like him. His heart was somewhere else anyway — the part of the city where he felt like himself.

The poem from that ride came out in a magazine read all over the country. His name, his words, in print. Nobody had paid him to write it. There it was anyway, one column wide.

He quit the college. His father cut him off.

Broke and lighter than he had felt in years, he went looking for work. Any work. Something that carried him toward the world instead of away from himself.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The ship work and the dishwashing job abroad — documented (The Big Sea); the books thrown into the sea at the start of that voyage, with his own line about the weight lifting given as a paraphrase, so no quotation is asserted. The route, the ports and the city are unnamed, and the small-magazine claim is dropped as unsupported by the facts.",
      text: `He signed onto a ship and worked in its kitchen, months at a time, oceans away from anyone who knew him. Later he washed dishes in a nightclub in a city where he knew nobody. He came home broke and shipped out broke again.

One night, at the start of a voyage, he carried his old schoolbooks up on deck. They were the books from the year his father paid for. He threw them into the sea.

He said later that it felt like setting down a weight he had carried for years.

Through all of it he kept the notebook. Poems about work. Poems about his people. Poems that moved the way the music moved. He kept sending them out. Nobody important was watching.

He was a workingman who wrote. No degree, no backer, no plan B. This was already plan B. It was his.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The job that kept him invisible; three of his own poems written out and carried in his pocket; left where a famous writer would find them, with a few shy words; read aloud at that writer's reading the same night; the story in the papers by morning — documented (The Big Sea; Washington papers, December 1925). The hotel, the city, the names, the poem titles, the dinner-plate staging and the photograph of him holding a tray are all withheld: this is the best-known anecdote about him, and the reveal belongs to the bridge.",
      text: `He was working a job that kept him invisible. Carrying things, cleaning up after people who never looked at him twice.

One evening a famous writer was there. One of the most celebrated in the country. He had no invitation and no standing to introduce himself. What he had was three of his own poems, folded in his pocket, and one short moment in the same room.

He left the poems where the man would find them. He said something quick and shy about liking his work, and that these were his own. Then he got out before he could take it back.

The man read all three that night, out loud, to a room full of people. He told them he had found a poet that day. Someone who had been working, in a uniform, a few hours earlier.

By morning the story was in the papers. Reporters were waiting when he came in to work.

The job's days were numbered.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Knopf had accepted his first collection earlier in the same year, before the hotel night (Opportunity prize, May 1925; Van Vechten carried the manuscript), so the beat does not claim the discovery produced the book. Publication mid-January 1926, weeks before his birthday; the decades of poems, plays, stories and columns that followed — documented. Names and titles withheld, and the voice is described without naming the music or the neighborhood behind it.",
      text: `A publisher had already said yes to a book of his poems, earlier that same year. The work had been quietly doing its job the whole time. The book came out that winter, a few weeks before his birthday.

It sounded like nothing else. Like the music he came up on. Like the way the people he loved actually talked. He had turned down the borrowed voice the way he turned down the borrowed life. You could hear it on every page.

He never stopped. Books of poems, plays, stories, columns, decade after decade. All of it built out of the real lives of the people he came from. He became not just a famous poet but a loved one. The kind whose lines people learn by heart.

The engineering money would have run out. The poems are still paying.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Langston Hughes.

He became the defining poet of the Harlem Renaissance and one of the best-loved American poets of the last century. "The Negro Speaks of Rivers" — the poem he wrote on the back of that envelope — is still read and taught everywhere. None of that had happened yet on the day we just sat with him, in his father's house, listening to the terms.

Your life is not theirs. But a piece of this story may still sit beside you.

The money came with one condition: be someone else. He said no and walked into years of ships and dish pits with almost nothing. He kept the notebook. The notebook turned out to be the whole thing.

You don't have to take the deal that asks you to stop being yourself. He didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Aug 30, 1797; Frankenstein published anonymously Jan 1818 (she was 20);
//    Clara (b. Sept 2, 1817) was already ill when the family travelled to Venice and died
//    there of dysentery Sept 24, 1818 (Mary 21); William ("Willmouse", b. Jan 24, 1816) died
//    June 7, 1819, Rome (malaria, age 3); her June 1819 letter to Marianne Hunt is the
//    documented record of the despair (lose two children in one year, left childless and
//    forever miserable) — this letter is the citable record for it; cite the letter, never a
//    journal entry; Matilda written through the grief; Percy Florence born Nov 12, 1819 (the
//    surviving child); she nearly died of a miscarriage June 16, 1822; Percy Bysshe Shelley
//    drowned July 8, 1822, in a storm off the Italian coast, body found ten days later (Mary
//    24); widowed with a two-year-old, nearly penniless; Sir Timothy Shelley offered support
//    only if she surrendered the boy to a guardian of his choosing — she refused; he later
//    allowed a small annuity and threatened to stop it if any biography of the poet appeared;
//    returned to England Aug 1823; lived by her pen (novels, stories, travel books, the
//    annotated editions of Percy's poems), raised her son alone, and built Percy's posthumous
//    reputation. Frankenstein's authorship was acknowledged on the 1823 second edition and the
//    book became one of the most famous novels ever written. d. Feb 1, 1851.
//  Interpretive: "she chose the pen and the child over the rescue with conditions." Grounded.
//  Avoid saying: don't name Shelley / Frankenstein / Percy / Italy / Byron before the bridge;
//    the anonymous-book detail stays but untitled, undescribed AND unglamorized — no
//    "science fiction", no monster, no themes of the novel, and (blind-reader fix 2026-08-27)
//    no "girl of twenty", no talk about the book, no astonished readers, no never-out-of-print
//    before the bridge; the fame and the creature are both bridge reveals; in beats 0-5 the
//    husband is "a writer", never "a poet", and his age at death is not given (a poet drowned
//    at twenty-nine names him on its own); the children's deaths rendered plainly, never
//    clinically; no elopement-scandal backstory (pre-episode); don't claim who was at her
//    deathbed (unverified).
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
      "Her one-year-old daughter fell ill and died far from home, her little son died nine months later, and then the sea took her husband — three deaths in four years, in a foreign country.",
    agencyState:
      "Widowed at twenty-four with a toddler, nearly penniless, far from home — owning almost nothing except a trained pen and the refusal to hand over her child.",
  },
  biographicalFacts:
    "Mary Shelley was born August 30, 1797, the daughter of the philosopher William Godwin and the feminist Mary Wollstonecraft, who died days after her birth. Her novel Frankenstein, begun at eighteen, was published anonymously in January 1818, shortly before she, her husband Percy Bysshe Shelley, and their two small children left for Italy — for his health, for cheaper living, and to be near friends. Her one-year-old daughter Clara was already unwell when the family travelled to Venice, and she died there of dysentery on September 24, 1818; nine months later, in June 1819, her three-year-old son William died of malaria in Rome. Writing that June to her friend Marianne Hunt, Mary said she hoped Marianne would never know what it was to lose two only and lovely children in one year, to watch their dying moments, and to be left at last childless and forever miserable. She worked through the grief by writing the novella Matilda. Her son Percy Florence was born on November 12, 1819. On June 16, 1822 she nearly died of a miscarriage, and on July 8, 1822, Percy Bysshe Shelley drowned when his boat sank in a storm off the Italian coast; his body was found ten days later. Mary was twenty-four. Widowed with a two-year-old and nearly penniless, she was offered support by her father-in-law, Sir Timothy Shelley, on the condition that she surrender the boy to be raised by a guardian of his choosing. She refused. She returned to England in August 1823 and lived by her pen — novels, stories, travel books, editions — while raising her son alone and assembling and annotating her husband's poetry with her own extensive notes, work that largely created his posthumous reputation; Sir Timothy later allowed her a small annuity and threatened to withdraw it if any biography of the poet were published. Frankenstein's authorship was acknowledged on the 1823 second edition, and the book became one of the most famous novels in the world, its creature among the most widely recognized figures in fiction. Percy Florence outlived her. She died February 1, 1851.",
  sources: [
    "Shelley, Mary. The Journals of Mary Shelley, 1814-1844, ed. Paula R. Feldman and Diana Scott-Kilvert (Oxford: Clarendon Press, 1987).",
    "Shelley, Mary. The Letters of Mary Wollstonecraft Shelley, ed. Betty T. Bennett (Baltimore: Johns Hopkins University Press, 1980-1988), Vol. 1.",
    "Seymour, Miranda. Mary Shelley (New York: Grove Press, 2000), Chapters 9-14.",
    "Sunstein, Emily W. Mary Shelley: Romance and Reality (Boston: Little, Brown, 1989).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The anonymous early book, and the move abroad with husband and two small children for his health and cheaper living — documented. The book stays untitled, undescribed and unglamorized, and the husband is 'a writer' here rather than 'a poet', to keep both unidentifiable before the bridge.",
      text: `There was a young woman living far from home, in a warm country that wasn't hers.

She had already written a book. It came out with no name on the cover, and almost nobody knew she was the one who had written it.

She had a husband she loved, a writer, and two small children. A baby girl. A little boy she loved past all sense.

They had come for his health and for cheaper rooms, and they kept moving from one town to the next, looking for both. Nothing about that life was settled.

It was a bright, unsteady life. She thought the unsteady part was money.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Clara's death (Sept 1818), William's death nine months later (June 1819), the June 1819 letter about losing two children in one year, the drowning (July 1822) and the body found days later — all documented. The summer heat is texture.",
      text: `Then the baby girl got sick. They were on the road, far from any home of their own. She died. She was one year old.

Nine months later, before she had begun to take in the first loss, the little boy took a fever in the summer heat. She sat by him for days. He died too. He was three.

She wrote to a friend that she had lost two children in one year. She said she expected to be miserable for the rest of her life.

A new baby came — one more boy — and she held herself together around him, because there was no one else to do it.

Three years passed. Then one summer her husband sailed down the coast to meet a friend. A storm came up and his boat went down. They found him days later. She was twenty-four.

A widow at twenty-four, in a country not her own, with one small son and almost nothing else left alive.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Sir Timothy's documented conditional offer (support in exchange for surrendering the boy) and her refusal.",
      text: `Rescue was offered. It came with one condition.

Her husband's father was rich, and disapproving, and willing to provide — for the boy. If she handed him over. Give the child to a guardian of the old man's choosing, step out of his upbringing, and there would be money.

She had buried two children. She had exactly one left.

She said no.

No to the money, no to the safety, no to the arrangement everyone else thought was sensible. She would keep her son, and she would feed them both the only way she knew how — with her pen.

She packed up the pieces of the life abroad and took the boy home.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The return to England (1823), the small allowance with conditions attached, living by her writing, and the copying and annotating of her husband's poems — documented. Which days of the year hit hardest is interpretive.",
      text: `Home was cold and expensive, and grief doesn't pay rent.

She wrote. Stories, articles, reviews, whatever sold. She started new books. Her husband's father sent a small allowance, and it came with strings and small humiliations. Her own work made up the difference, month by month.

At night she did the other work, the unpaid one. Her husband had left his writing behind unpublished, unfinished, unread. She gathered every page. She copied them, put them in order, added her notes. If the world was ever going to know what he had been, it would be because she made the case herself.

The grief did not keep to a schedule. Some days in the year flattened her. She wrote anyway. Not because writing healed it. Because the boy needed dinner, and because she was the only one left to speak for the dead.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The pen-earned independence and the annotated editions that built the poet's reputation — documented; several years compressed into one stretch.",
      text: `And it held.

The books came out and they sold. The volumes of her husband's writing came out too, one after another, with her notes running underneath. In his life most people had ignored him or laughed at him. Year by year, page by page, she argued him into place. By the end of her life he was widely read and admired, and that was largely her doing.

Somewhere in those years the ground under her changed. She was not a woman barely hanging on anymore. She was a working writer. She paid for the house out of her own pages. She was raising a boy who was growing up kind.

Nobody handed her that life. She had turned down the one that was handed to her, the one with a condition on it.

She made this one instead, and it stood.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Her name appearing on the book the same year she returned home, the son who outlived her, and the writing she lived by to the end — documented. The book stays untitled, undescribed and unglamorized; its fame is a bridge reveal.",
      text: `And the book — the one she wrote as a girl, the one that came out with no name on it?

It kept finding readers. Around the time she came home, her name went onto it at last, and she was not anonymous anymore.

She wrote to the end. Novels, stories, travel books, the volumes of her husband's writing, year after year. She paid for their lives with her own pages, and she never got to stop.

She raised her son by herself. He grew up steady and devoted, and he outlived her. He was the child she had refused to hand over.

She had lost almost everything before she was twenty-five. She never got any of it back. She made something else instead. What she made outlasted everyone who ever doubted her.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Mary Shelley.

The book was Frankenstein. She wrote it at eighteen and published it at twenty. It became one of the most famous novels ever written, and the creature in it is a figure almost everyone on earth can picture. She also, almost single-handedly, built the reputation of her husband, the poet Percy Bysshe Shelley. None of that had reached her yet in the years when she was burying her children and then her husband, far from home.

Your life is not theirs. But a piece of this story may still sit beside you.

Grief came for her again and again before she was twenty-five, faster than any heart can take it in. She did not rise above it. She just kept one small boy fed, one pen moving, one page turning.

You don't have to be done grieving to keep going. She never fully was, and she went anyway.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Elizabeth Cochran, May 5, 1864, Cochran's Mills PA; father died when she was 6,
//    leaving the family in hardship; Jan 1885 the Pittsburgh Dispatch ran Erasmus Wilson's "What
//    Girls Are Good For" (girls are for housekeeping and childbearing; a woman working outside the
//    home called a monstrosity); she wrote a furious rebuttal signed "Lonely Orphan Girl"; editor
//    George Madden advertised for the author, met her, hired her (pen name "Nellie Bly", from a
//    Stephen Foster song); her factory-girl investigative series drew advertiser complaints and she
//    was reassigned to fashion/society/gardening; ~Feb 1886 (21) went to Mexico as self-made
//    foreign correspondent for ~6 months (later Six Months in Mexico); back on the women's pages,
//    last arts piece Mar 20, 1887, then she quit, leaving the famous note "I am off for New York.
//    Look out for me. Bly."; ~4 months of closed doors and spent savings, then talked her way into
//    Pulitzer's World and took the madhouse assignment: practiced expressions at a mirror, a night
//    in a boarding house, feigned insanity, ten days inside the Blackwell's Island asylum, the
//    World's attorney got her out; report ran Oct 9 + 16, 1887 (age 23) and the book "Ten Days in a
//    Mad-House" → grand jury (took her testimony; she returned to the island with it), ~$850,000
//    more to the Dept. of Public Charities and Corrections, food/sanitation/interpreter reforms and
//    stricter examination before commitment; later undercover: paper-box factory, a night in jail;
//    1889-90 raced around the world in 72 days, beating Verne's fictional 80. d. Jan 27, 1922.
//  Interpretive: "the column read like a verdict on her own life"; the note as the hinge; "a small
//    life, politely enforced"; her state of mind on the day she read the column. Grounded.
//  Avoid saying: don't name Bly / Cochran / Pittsburgh / New York / Pulitzer / the World / Mexico
//    before the bridge; in beats 0-5 don't print the column's title or its "monstrosity" line, the
//    signature "Lonely Orphan Girl", the wording of the parting note, the asylum's island or the
//    number of days inside, or the race around the world (that belongs to the bridge); no "stunt
//    journalism" label; don't say she invented undercover reporting (Julius Chambers feigned
//    insanity into the Bloomingdale Asylum in 1872); asylum conditions stay in one restrained line.
//    Withheld for anonymity (2026-09-01, second pass — a blind reader still named her from
//    beats 0-5): beats 0-5 now also stay off HOW she got inside — no practiced madness, no
//    mirror, no examining doctors, no "committed", no "insane" — plus the words madhouse and
//    asylum, the number of days, the island, the grand jury and the city's new spending, the
//    night in a jail cell, the country she reported from, the wording of the parting note and
//    its "look out for me", the made-up signature on the letter, the working name the paper
//    printed over her stories, her father's mill and judgeship, and the superlatives ("the
//    biggest paper", "the biggest city"). What the beats keep: a locked place past the edge of
//    the city where women were sent when the city had given up on them, that the only way to
//    learn what happened there was to go in as one of them, and that she said yes. The method,
//    the standing she won for it, the fame and the race around the world belong to the bridge.
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
    "She left a short note on a colleague's desk, went to the biggest city in the country, and at twenty-three got herself committed to a madhouse to write the truth about it.",
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
    "Nellie Bly was born Elizabeth Cochran on May 5, 1864, in Cochran's Mills, Pennsylvania. Her father, a mill owner and judge, died when she was six, leaving the family in genteel poverty; her mother's remarriage ended in divorce, and Elizabeth grew up watching the family's options narrow. In January 1885 the Pittsburgh Dispatch published a column by Erasmus Wilson titled \"What Girls Are Good For,\" answering: keeping house and bearing children, and calling a woman who worked outside the home a monstrosity. Elizabeth, twenty and unemployed, wrote a furious rebuttal signed \"Lonely Orphan Girl.\" The editor, George Madden, was struck enough to run an advertisement asking the author to come forward; when she did, he hired her, giving her the pen name Nellie Bly, taken from a Stephen Foster song. Her early investigative series on the lives of factory girls drew complaints from manufacturers, and she was reassigned to the women's pages — fashion, society, gardening. In early 1886, at twenty-one, she went to Mexico for roughly six months as a self-appointed foreign correspondent, publishing dispatches later collected as Six Months in Mexico; on her return she was put back on the women's pages. In 1887, after her last arts assignment ran on March 20, she quit, leaving a note for her colleague Erasmus Wilson: \"I am off for New York. Look out for me. Bly.\" After about four months of closed doors, with her savings spent, she talked her way into Joseph Pulitzer's New York World and accepted an assignment no one else would take. She practiced deranged expressions in front of a mirror, took a room in a boarding house for working women, behaved strangely for a night, was declared insane by the examining doctors, and spent ten days inside the Women's Lunatic Asylum on Blackwell's Island until an attorney sent by the World secured her release. Her report ran in the World on October 9 and 16, 1887, when she was twenty-three, and appeared the same year as the book Ten Days in a Mad-House; it documented cruelty, cold, spoiled food, and sane women trapped there by poverty and by not speaking English. A grand jury took her testimony and she returned to the island with it; the city increased the budget of the Department of Public Charities and Corrections by roughly $850,000, and reforms followed — better food, better sanitation, interpreters for patients who spoke other languages, and stricter examination before commitment. She went on with undercover work for the World, including a paper-box factory that underpaid its women workers and a night in a jail cell after having herself arrested to report on how women prisoners were treated. In 1889-90 she circled the globe in seventy-two days, beating the eighty days of Jules Verne's novel. She was not the first American reporter to feign insanity to enter an asylum — Julius Chambers did so at the Bloomingdale Asylum in 1872 — but her report is what made the method famous. She died January 27, 1922.",
  sources: [
    "Kroeger, Brooke. Nellie Bly: Daredevil, Reporter, Feminist (New York: Times Books, 1994), Chapters 1-4.",
    "Bly, Nellie. Ten Days in a Mad-House (New York: Ian L. Munro, 1887).",
    "Library of Congress, \"Behind Asylum Bars: Nellie Bly Reporting from Blackwell's Island.\"",
    "Encyclopaedia Britannica, \"Nellie Bly\" and \"8 of Nellie Bly's Most Sensational Stories.\"",
    "New York University Libraries, Undercover Reporting archive (undercover.hosting.nyu.edu): Nellie Bly, \"The Girls Who Make Boxes\" (New York World); Julius Chambers, Bloomingdale Asylum (1872).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Her father's death when she was six, the family's slide from comfort into hardship, and her joblessness at twenty are documented, as is the column she read. Withheld for anonymity: the column's title and author, the paper, the town, and her father's mill and judgeship — a mill-owning judge in a mill town points straight at the place. The beat gives the place no size: by twenty the family had moved to a city, so calling it a small town would be wrong. Her quickness in an argument is interpretive.",
      text: `There was a young woman. She was twenty. She was out of work. The world had no place set for her.

Her father had died when she was six. While he lived there was money and standing. After that it was one widow and a houseful of children, sliding year by year from comfortable to cornered. She watched her mother's choices shrink to nothing. She learned early what happens to a woman with no money of her own.

She wanted to work. She was quick and sharp and fearless in an argument. It didn't matter. For a girl in her town there was factory work, kitchen work, or marriage.

She was sitting in that cornered life one morning when she opened the paper and found a column about women like her.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The column's argument — that girls were for keeping house and bearing children, and that a woman who worked outside the home had gone wrong — is documented, and is paraphrased here rather than quoted or titled. Withheld for anonymity: the title, the author, and the standing of the paper that printed it. Reading it cold and then hot, and the shame turning to anger, are interpretive; her state of mind that day is not recorded.",
      text: `A man had written it. Girls belonged at home, he said. Keeping house. Bearing children. A woman who went out and worked for herself had gone wrong somewhere. Better she stay home, quiet and decorative, until a husband collected her.

She read it, and went cold, and then hot.

Because the column was a joke, and her life wasn't. It was only saying out loud what every door in that town had already told her. No work for you. No wages for you. No name of your own. Wait to be chosen.

She was broke. And here it was in print: she was fit for nothing she actually wanted.

She could have folded the paper up and gone back to the kitchen. Plenty of women did. Instead the shame turned into anger.

She sat down and wrote the angriest letter of her life.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The unsigned rebuttal, the editor's public call for its author, the meeting, the hire, and her early series on the lives of factory girls are documented. Withheld for anonymity: the made-up name she signed, the working name the paper printed over her stories, and the term pen name — an invented byline is one of the best-known things about her. Expecting to be laughed at is interpretive; the day she came in is not recorded.",
      text: `She didn't sign her own name to it.

It wasn't polished. It was alive. It was about what actually happens to girls with no money, written by someone who obviously knew.

The editor read it and did something editors almost never do. He asked, in his own paper, for whoever wrote it to come in.

So she went in. She expected to be laughed at.

He gave her a story to write instead. Then a job.

Her early work was about the girls in the factories. The hours. The pay. She wrote it from the inside, where the men who wrote the news had never bothered to look.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The manufacturers' complaints, the reassignment to fashion, society and gardening, the half-year of reporting she arranged for herself far from home, the return to the same pages, and the note she left when she quit are documented. Withheld for anonymity: the country she went to, and what the note said — its wording is quoted everywhere. \"A small life, politely enforced\" is interpretive.",
      text: `The factory pieces were too good. That was the problem.

The owners complained to the paper. The paper needed those men more than it needed her. So it fixed the problem the easy way. She was moved. To fashion. To flower shows. To garden parties and afternoon teas.

She tried everything to get off that page. She went far from home for half a year, asking no one's permission, and sent back the real thing. Politics. Poverty. How people actually lived.

They printed all of it. Then they put her right back on the garden parties.

She could see the whole rest of it from there. Years of teas. A pat on the head. A small life, politely enforced.

One day she simply didn't come in. She left a note behind, and she went.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Four months of closed doors and spent savings, talking her way in to the editors of a large city paper, an assignment no one else would take, entering the locked institution as one of the women held there, the conditions she found, and the paper's lawyer getting her out are documented. That going in as one of them was the only way to learn what happened inside is the assignment's framing, not a separately checked claim. Withheld for anonymity: the city, the paper, the island, how many days she was inside, and above all how she got herself admitted — the manner of her entry is the single most recognizable thing about her life. Conditions kept to one restrained line.",
      text: `The city she went to didn't want her either. For four months she walked from paper to paper and every door stayed shut. No women. No exceptions.

Her savings ran out. She kept going back.

Then one paper let her past the door, and she talked her way to the editors. They had one job nobody would take. Out past the edge of the city there was a locked place. Women were sent there when the city had given up on them. The only way to find out what happened in there was to go in as one of them.

She said yes.

So she went in. Once she was inside she could not leave. The cold. The bad food. The cruelty. And the women who had nothing wrong with them, kept there because they were poor, or alone, or spoke the wrong language.

The paper had to send someone to get her out. Then she wrote it. All of it.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "That the report was read and acted on, her return to the institution with the officials who had the power to change it, and the reforms that followed — better food, better sanitation, someone to speak with the women who spoke other languages, stricter examination before a woman could be sent there — are documented, as is her later undercover work in a factory that underpaid its women. That the paper kept sending her on the hard stories is a fair reading of that later work. Withheld for anonymity: the grand jury, the size of the city's new spending, the night in a jail cell, and every billing of her fame — the standing she won here belongs to the bridge.",
      text: `People read it. And then people who had never once listened to her had to listen. She went back to that place one more time, with the men who had the power to change it. She showed them what she had seen.

Things changed. Better food. Cleaner rooms. Someone who could talk with the women nobody had bothered to understand. And a real look at a woman before anyone could send her there.

And the one they had parked on the flower shows was now the one they sent when a story was hard.

She kept going in. A factory where the women were paid almost nothing. Places nobody outside was meant to see. She kept coming back with what was in there.

Keep house, the column had said. Be quiet. She never did learn to stay in the room they put her in.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Nellie Bly.

Ten Days in a Mad-House made her famous and turned asylum reform into a national cause. Two years later she raced around the world in seventy-two days, beating the eighty days of Jules Verne's novel. She was one of the people who showed the world what undercover reporting could do. None of that had happened yet on the morning she read, in print, that girls like her were good for keeping house.

Your life is not theirs. But a piece of this story may still sit beside you.

She was twenty and out of work when she read it. She had no training and no money. What she had was one letter she was angry enough to write, and the nerve to say it was hers.

You don't have to accept the size of the life somebody else picked for you. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 22, 1791, blacksmith's son, Newington Butts; in the 1801 food shortage the
//    nine-year-old was allotted one loaf of bread a week; schooling was the bare rudiments of
//    reading, writing and arithmetic; errand boy then bookbinder's apprentice to George Riebau
//    1805-1812 (from ~14); read the books he bound (incl. the encyclopedia's electricity
//    article); 1812 (20) attended Humphry Davy's Royal Institution lectures, took and bound ~300
//    pages of notes, sent them to Davy asking for scientific work; hired as Chemical Assistant
//    March 1, 1813 (21) — partly bottle-washing; Oct 1813-April 1815 accompanied Davy's
//    Continental tour, forced into valet duties after Davy's valet dropped out (promise of a
//    replacement never kept); Lady Davy (Jane Apreece) treated him as a servant — riding outside
//    the coach, eating with servants — and he seriously considered abandoning science and
//    returning home; he stayed for the science (met Ampère, Volta; saw Europe's laboratories);
//    back home he rose at the Royal Institution, first published paper 1816 — the analysis of
//    caustic lime of Tuscany; he turned 25 that Sept and the month of publication is not
//    established, so do not print an age for it; went on to the motor, generator, field theory;
//    founded the Christmas Lectures for children (1825) and gave 19 series himself 1827-1860,
//    still running today (interrupted only by WWII); twice declined the presidency of the Royal
//    Society. d. Aug 25, 1867.
//  Interpretive: "the humiliation reframed as tuition." Grounded in his letters from the tour.
//  Disputed — do NOT assert: that a knighthood was offered and refused. Popular accounts say one
//    was offered and he turned it down; the Royal Institution's own materials say no evidence of
//    an offer has been found. Sources disagree, so beats and facts carry only the undisputed
//    part: he stated publicly, more than once, that he would never accept one and preferred to
//    remain plain Mr Faraday.
//  Avoid saying: don't name Faraday / Davy / Royal Institution / London before the bridge; no
//    electricity specifics before the bridge (became says only "the invisible force from that
//    article" — never motor, generator, induction or the candle); keep the bookbinding trade,
//    the one-loaf ration, the bound volume of lecture notes, the still-running children's lecture
//    series and the word "knighthood" out of beats 0-5 — each of them names him on its own;
//    class cruelty kept concrete but brief.
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
    "Michael Faraday was born September 22, 1791, in Newington Butts, south London, the son of an often-ill blacksmith. The family was poor: during the food shortage of 1801 the nine-year-old was allotted a single loaf of bread to last a week, and his schooling went no further than the rudiments of reading, writing, and arithmetic. At about fourteen he was apprenticed to the bookbinder George Riebau, serving from 1805 to 1812, and for seven years he read the books he bound — including the Encyclopaedia Britannica's article on electricity — and performed simple experiments. In 1812, at twenty, he was given tickets to Humphry Davy's celebrated lectures at the Royal Institution; he took careful notes, expanded and bound them into a roughly 300-page volume, and sent it to Davy with a request for scientific employment. On March 1, 1813, at twenty-one, Davy hired him as Chemical Assistant — work that included washing laboratory glassware. That October, Davy set out on an extended scientific tour of the Continent; his valet withdrew at the last moment, and Davy asked Faraday to fill the role temporarily, promising to hire a replacement abroad. He never did. For eighteen months Faraday served as assistant and unwilling valet while Lady Davy (Jane Apreece) treated him as a servant — he rode outside the coach and ate with the servants — and his letters home record that he was miserable enough to consider returning to England and abandoning science altogether. He stayed for what the tour offered: Europe's laboratories and its greatest scientists, Ampère in Paris and Volta in Milan among them. Back in London from April 1815, he rose at the Royal Institution, publishing his first scientific paper — an analysis of caustic lime from Tuscany, in the Quarterly Journal of Science — in 1816, the year he turned twenty-five. He went on to invent the electric motor and the generator, to discover electromagnetic induction and lay the foundations of field theory, and to found, in 1825, the Christmas Lectures for children; he delivered nineteen series of them himself between 1827 and 1860, and they continue today. He said publicly, more than once, that he would never accept a knighthood, preferring to remain plain Mr Faraday; sources disagree on whether one was ever formally offered him. He twice declined the presidency of the Royal Society. He died August 25, 1867.",
  sources: [
    "Hamilton, James. A Life of Discovery: Michael Faraday, Giant of the Scientific Revolution (New York: Random House, 2004), Chapters 2-4.",
    "Cantor, Geoffrey. Michael Faraday: Sandemanian and Scientist (London: Macmillan, 1991).",
    "The Royal Institution, \"Michael Faraday (1791-1867)\" biographical materials, rigb.org (on the honours he refused).",
    "Encyclopaedia Britannica, \"Michael Faraday\", britannica.com (on his childhood poverty and schooling).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Blacksmith's son, the childhood hunger (in the 1801 shortage he was rationed one loaf a week), the apprenticeship at fourteen to a bookseller-bookbinder, the electricity article he read, the lecture tickets at twenty, the notes sent with a job request, the bottle-washing hire — all documented. The trade, the exact ration and the binding of the notes are left vague here because each of them names him on its own. 'Set his mind on fire' is our phrasing, not his.",
      text: `There was a young man who learned science from books that were never his to keep.

His father was a blacksmith, often too sick to work. There were weeks of his childhood with almost nothing to eat. He learned early how to make a little food last. School taught him his letters and not much else. At fourteen he went to work in a book shop. It was a library with wages. One article, about an invisible force nobody understood yet, set his mind on fire.

At twenty, someone gave him tickets to hear the country's most famous scientist speak. He wrote down every word. Then he copied the notes out clean and sent them to the great man. Any work at all in science, he asked.

It worked. Sort of. He was hired as the laboratory assistant.

Which meant, much of the time, washing the bottles.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The tour, the servant's last-minute refusal to go, the never-kept promise of a replacement, the wife's treatment (riding outside the coach, eating with the servants), and his letters about nearly abandoning science are all documented. 'In the cold' is our texture.",
      text: `Then came the trip. The great man was going abroad for months, to every famous laboratory and every famous mind. The assistant would come with him. The chance of a lifetime.

At the last minute, the great man's personal servant refused to go. Would the assistant mind doing a servant's work? Just until they hired someone on the road.

Nobody was ever hired.

So for a year and a half he was two people. In the laboratory he was the scientific assistant. Everywhere else he was the help. The great man's wife made sure he knew which one he really was. He rode outside the coach in the cold. He ate downstairs with the servants.

His letters home stopped pretending. He wrote that he was close to giving the whole thing up — science included — and walking home to his old bench.

Dignity, or the work. It had come down to that.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "That he stayed, and what the tour gave him access to, are documented. The 'tuition' framing is our interpretation of his letters, not his words.",
      text: `He stayed.

Not because the humiliation stopped. It didn't. He stayed because he did the arithmetic on it.

Riding outside the coach was miserable, and the coach was going to every laboratory worth seeing. Eating downstairs stung. But in the daytime he was upstairs in the room where the best minds alive were working, and he was working with them.

Nobody born where he was born got into those rooms. That was the cruel joke of his whole country. The room was everything, and his birth said never.

Well. Here he was in the room. The price was a servant's seat.

He decided the seat was tuition. He paid it.

Then he watched everything and wrote everything down.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The length of the tour, the laboratories and the scientists he met (Ampère and Volta, unnamed here), and the double role throughout are documented. 'The cold seat' is our texture; no mountain crossings are counted, because the sources don't count them.",
      text: `The tour ground on, month after month. The double life didn't soften.

But the days. The days were an education no school on earth could have sold him. He stood in laboratories he had only read about in the shop's books. He met the men whose names were on the discoveries. He watched the best experimenters alive work with their own hands. He assisted. He asked. He remembered.

Downstairs, invisibly, he was turning into one of the best-trained scientific minds anywhere. Nobody had planned that. Nobody upstairs particularly noticed.

The cold seat on the outside of the coach carried him across a whole continent and back.

When the tour finally ended and he came home, he was the same blacksmith's son with no degree and no standing.

Except he wasn't. And the laboratory soon knew it.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "His post-tour rise at the institution, the first published paper (1816 — the month is not established, so no age is given here), and the decades of work that followed are documented. 'Results don't have an accent' is our line.",
      text: `Home again, everything shifted.

The institution promoted him. The bottle-washing gave way to real experimental work, and it turned out nobody in the building had better hands. Soon after he came home, he published his first scientific paper. The shop boy, in the journals now, under his own name.

His name started to travel. Not because anyone opened a door for him. The doors of that world stayed shut to men like him. It happened because results don't have an accent. When his experiments spoke, the gentlemen had to answer the experiments.

The man he had served stayed famous, celebrated, titled. The former servant just kept working. Steadily. Patiently. Decade after decade.

And somewhere in those decades the world came around to a fact nobody would have believed. The best experimental scientist alive had once eaten downstairs with the servants.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "His later work on electricity and magnetism, the children's lectures he founded and gave himself for years, and the twice-refused presidency are documented. He is on record saying in advance that he would never accept a knighthood; sources disagree on whether one was ever offered him, so the beat says only what he said. The discovery, the lecture series and the word for the title are kept vague here because each of them names him on its own. 'The most important audience alive' is our phrasing.",
      text: `What he found in that laboratory changed the world more than any king of his century.

He spent his life on the invisible force from that article. He was the one who worked out how it behaves. Most of the machinery people use now sits on top of what he did in that building. They use it all day without knowing his name.

He never forgot where he had started. He set up a run of science talks for children, in the same building where he had once washed bottles. He gave them himself for years. A great man of his field explaining plain things to twelve-year-olds, like they were the most important audience alive.

They asked him to lead the most important scientific body of his day. He said no. He said he would never take a title either. He meant to stay what he was born.

He had seen exactly what titles were worth, from the outside of the coach.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Michael Faraday.

He discovered electromagnetic induction, invented the electric motor and the generator, and worked out how electricity and magnetism actually behave. Almost everything that runs on power traces back to him. He did it with no degree and almost no mathematics, a blacksmith's son who learned science from the books he bound. None of that had happened yet on the cold nights he rode outside the coach, wondering if he should quit.

Your life is not theirs. But a piece of this story may still sit beside you.

The people above him never did decide he belonged. He got into the room at a humiliating price, and he paid it with his eyes open, and he kept working.

You don't have to be let in yet. He wasn't either.`,
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
//    gave the claim up at the end of the decade (sources differ: some have him borrowing against
//    the land and leaving in 1888; NPS has him proving it up Dec 1889 and selling in 1890);
//    boyhood reputation as "the plant doctor" (his own account, NPS); 1890 (~25) admitted to
//    Simpson College, Iowa (art + piano, laundry to pay his way); art teacher
//    Etta Budd saw his plant paintings and steered him to botany at Iowa State (1891, ~26) — its
//    first Black student, later its first Black faculty member; 1896 went to Tuskegee for 47 years;
//    the crop-rotation/soil work, the Jesup-wagon movable school, hundreds of uses from peanuts,
//    sweet potatoes and pecans; three presidents (T. Roosevelt, Coolidge, FDR) met with him.
//    d. Jan 5, 1943.
//  Interpretive: "no home to go back to, so he went forward"; the sod-house years as solitude.
//    Grounded.
//  Avoid saying: don't name Carver / Tuskegee / Kansas / Iowa / peanuts before the bridge — not
//    even obliquely as "one little legume" or "hundreds of uses from humble crops"; keep the three
//    presidents, "one of the most famous scientists in the country", and "a famous school far to the
//    south" teaching "the children of people who had been owned" out of beat 5 as well — a blind
//    reader named him from beats 0-5 while those were in (2026-08-27); keep the plant gift in beat 0
//    but not the neighbors bringing him their sick plants; no claim that the agricultural college named a building
//    for him (unverified; Simpson College did name buildings for him, in 1956 and 1993); no flat
//    "he was twenty" (birth date unrecorded — say "about twenty"); no scale claims about how much
//    of Southern agriculture he changed; the college-door rejection rendered plainly, no invented
//    dialogue; the kidnapping in facts only (pre-episode), not in beats.
//    Second anonymity pass (2026-09-01): a blind reader still named him from beats 0-5, so
//    these are withheld from the beats too (all remain in biographicalFacts) — "born owned by
//    other people, and freed as a baby" (beat 0 now says only "born unfree"), the plant gift
//    told as reviving a dying plant, both first-of-his-race claims (the student one in beat 4,
//    the faculty one in beat 5), "teach science to farm families no one else was teaching",
//    the soil work told as bringing worn-out land back to life, and the classroom on wheels
//    (beat 5 now says only that he taught poor families to get more out of tired ground and
//    carried the lessons out to people who could not reach him).
//    Third anonymity pass (2026-09-01, round 1): a blind reader named him again from beats 0-5,
//    quoting the born-enslaved-plus-plant-scientist combination, the accepted-by-letter /
//    turned-away-at-the-college-door anecdote in its famous form, the art teacher who said a
//    Black artist would starve and steered him into agriculture, the fifty years at a school in
//    the South, and the classroom taken out to farmers. All are now withheld from the beats and
//    kept only in biographicalFacts and the bridge: the beats no longer say he was born unfree,
//    never name plants as his gift or his subject (beat 3 says only that he studied the ground he
//    lived on and drew and painted; beat 4 never names art, piano or what the bigger school
//    taught), say "school" not "college" at the door, drop the letters-were-acceptable-he-was-not
//    phrasing, and in beat 5 give no number of years, no soil or crop teaching and no travelling
//    classroom — only that he taught people who had almost nothing to make more of what was in
//    their hands.
//    This supersedes the 2026-08-27 line above that said to keep the plant gift in beat 0.
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
    "He let the claim go, tried again at another school's door, and this time it opened — all the way.",
  ],
  facets: {
    emotionalCore:
      "Being welcomed on paper and refused in person — learning that his letters were acceptable and his face was not — with nowhere behind him to absorb the blow.",
    decisionShape:
      "Whether to stop asking schools to let him in, or to keep himself alive and learning by any means until some door somewhere would open on merit.",
    triggerEvent:
      "The college that had accepted him by mail withdrew the admission on sight, because he was Black.",
    agencyState:
      "No home of his own, no money, no school that would have him — but two skilled hands, a habit of studying everything that grew, and a patience that outlasted institutions.",
  },
  biographicalFacts:
    "George Washington Carver was born enslaved near Diamond, Missouri, around 1864 or 1865; his exact birth date was never recorded. As an infant, he and his mother were kidnapped by raiders; the baby was recovered and returned, but his mother was never found, and he was raised by Moses and Susan Carver, the couple who had owned her. Slavery ended in Missouri in January 1865, while he was still an infant, and the Carvers raised him afterward. He was frail and often sick, and drawn to growing things: by his own later account, plants thrived under his hands until he was styled the plant doctor, and people brought him ailing plants to treat. He was hungry for learning, and from about eleven he moved from town to town across Missouri and Kansas seeking schooling, supporting himself with laundry work, cooking, and farm labor. In 1885, at about twenty, he applied by mail to Highland College in Kansas and was accepted; when he arrived, the college discovered he was Black and withdrew the admission. In 1886 he went further west and homesteaded a quarter section in Ness County, Kansas, where he built a sod house, broke and farmed the dry land, collected plants, and painted — living largely alone on the open plains from 1886 to 1889. He gave the claim up at the end of the decade to pay for schooling; accounts differ on the exact year, some placing his departure in 1888 after he borrowed against the land, others recording that he proved the claim up in December 1889 and sold it in 1890. He made his way east to Iowa, and in 1890, at about twenty-five, he was admitted to Simpson College, where he studied art and piano and supported himself by taking in laundry. His art teacher, Etta Budd, recognizing both his gift for painting plants and the limits of an art career for a Black man, urged him toward botany at Iowa State Agricultural College. He enrolled in 1891 as its first Black student, earned bachelor's and master's degrees, and became its first Black faculty member. In 1896 Booker T. Washington recruited him to the Tuskegee Institute in Alabama, where he taught and researched for forty-seven years. He taught crop rotation and soil restoration to poor Southern farmers, drew hundreds of uses from peanuts, sweet potatoes, and pecans, and designed a horse-drawn movable school, the Jesup wagon, to carry demonstrations out to farmers who could not come to him. Three American presidents — Theodore Roosevelt, Calvin Coolidge, and Franklin D. Roosevelt — met with him. He died January 5, 1943.",
  sources: [
    "McMurry, Linda O. George Washington Carver: Scientist and Symbol (New York: Oxford University Press, 1981), Chapters 1-3.",
    "Vella, Christina. George Washington Carver: A Life (Baton Rouge: LSU Press, 2015).",
    "National Park Service, George Washington Carver National Monument, \"History & Culture\" (nps.gov/gwca), and NPS \"George Washington Carver\" biographical materials.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Documented: his mother was taken from him as an infant and never found; he was raised by the older couple on whose farm he was born; he was frail and often sick; from about eleven he moved from town to town looking for schooling, paying his way with laundry, cooking and farm work; at about twenty he applied by mail and was accepted. 'Walking toward school' and 'he noticed everything' are interpretive framing. Age is given as 'about twenty' because his birth date was never recorded. Withheld for anonymity: that he was born enslaved and freed as an infant, and his boyhood gift with plants and the drawing of them — both stay in biographicalFacts.",
      text: `There was a young man who had spent his whole youth walking toward school.

His mother was taken from him before he could remember her face. He was raised on a farm by the older couple who lived on it. He was frail, and sick more often than not. He was hungry to learn. Bottomlessly hungry.

From about eleven he drifted from town to town, wherever a school would take him. He paid his way with wash-work and farm labor, and slept where he could.

He noticed everything. Whatever was put in front of him, he studied until he understood it.

At about twenty, he did the boldest thing yet. He wrote to a real school and asked to be let in.

The letter that came back said yes. He sold what he had and went.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: the school withdrew the admission on his arrival, when it saw he was Black. No invented dialogue and no invented props. 'No family waiting, no room kept for him anywhere' is interpretive framing — the couple who raised him were still living, but he had been itinerant since about eleven and had no home of his own to return to. Age given as 'about twenty' because his birth date was never recorded. Withheld for anonymity: that the place was a college and which one, his race stated outright, and the letters-were-acceptable-he-was-not phrasing of the refusal — all stay in biographicalFacts.",
      text: `He arrived with everything he owned and presented himself at the school.

And they looked at him — at his face — and took the acceptance back.

They hadn't known, from the letters, what he was. Now they knew, and the answer changed. There was no appeal. There was no discussion worth having. They had said yes to a name on a page. They would not say it to the person standing in front of them.

Other people, turned away like that, had a home to absorb them. He had none. No family waiting. No room kept for him anywhere on earth. The walking-toward-school life had been aimed at this one door.

He was about twenty years old, standing in a town with no reason to be in it.

He had done everything right. It had not mattered at all.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: the 1886 move west, the homestead claim, the sod house he built himself, the land he broke and planted. 'There was no back' is interpretive framing.",
      text: `He did not go back. There was no back.

He went further out — west, to the emptiest land there was. The government would give a piece of it to anyone hard enough to hold on. He claimed a square of open plain.

He built his own house out of the ground itself. Bricks of cut sod, stacked into walls, a roof against the enormous sky. He broke the dry land and put in crops.

If no school would have him, fine. He would keep himself. He would feed himself. And he would study in the biggest classroom on earth: the open land, alone, in every direction.

It wasn't the plan. It was the plan he could reach.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: the homestead years from 1886 to about 1889 — hard dry farming, the studying, the drawing and painting — and giving the claim up to pay for school (sources differ on the exact year he left). The homemade brushes and colors are reported by his biographers rather than confirmed here. 'In the evenings' is minimal dramatized texture; the facts do not record when he painted. The loneliness framing is interpretive but grounded. Withheld for anonymity: that what he collected, studied and painted out there was plants — it stays in biographicalFacts.",
      text: `About three years on that claim.

The land fought him. Dry summers, killing winters, wind that never once stopped. He hauled water. He coaxed crops out of dirt that didn't want to give them.

The solitude was its own weather. Days without a voice. The nearest neighbors were miles off. The nearest person who looked like him was farther than that.

He filled the silence with the work of his heart. He studied the ground he was living on, and what it would and wouldn't grow. In the evenings he drew and painted, with brushes he made himself and whatever colors he could get.

He was keeping something alive out there, and it wasn't just the crops. It was the aim.

He saved what little he could. When the time came he let the claim go, turned back east toward the schools, and tried a door again.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the 1890 admission to a small college in the next state, the laundry he took in to pay his way, the teacher who saw his gift and, judging that a Black man could not make a living at it, steered him toward a practical course at the larger state college, where he enrolled in 1891. Her reasoning is reported by his biographers and is given here indirectly, never quoted. 'It cost him the thing he loved' is interpretive framing. Withheld for anonymity: that the subjects he enrolled in were art and piano, that the teacher was his art teacher, what the larger school actually taught him, and the first-Black-student-in-its-history framing — all stay in biographicalFacts.",
      text: `A small school in another state said yes — and this time the yes held when they saw him.

He signed up to study the things he loved most. He was older than his classmates, and poorer. He took in other people's washing to pay his way.

One of his teachers watched what he made and saw the gift in it. She also saw the world clearly, and she told him the truth as she understood it. He would not be allowed to earn a living that way. Not with his face. But the same eye, turned to something practical, could keep him — and a bigger school across the state taught exactly that.

It cost him the thing he loved. He went anyway.

That door held too. It did not just open a crack. It opened all the way, and he walked through it.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the two degrees he finished there and the teaching post at the college that trained him (he was close to thirty); the 1896 move to a school in another state, where he taught for the rest of his life; the teaching of people who had almost nothing. 'The lost years did not come back' is interpretive framing. Withheld for anonymity: that the faculty post was the first held by a Black teacher there, what he actually taught those families (crop rotation and the restoring of worn-out soil), the forty-seven years as a number, the movable school he carried out to people who could not reach him, the two degrees as a count (rare enough in that decade to narrow the field), the crops he is famous for, the presidents who met him, and his public fame — all stay in biographicalFacts and the bridge. A blind reader named him from beats 0-5 while any of them were in.",
      text: `He finished. Then the school that had trained him asked him to stay and teach.

Later a school far away asked him to come and teach there. He went, and he stayed the rest of his working life.

He taught people who had almost nothing and were expected to want nothing. He showed them how to make more out of what was already in their hands. He kept studying, the way he had as a sick boy on a farm and as a man alone on the plains. Only now what he learned went straight to people who needed it.

He was close to thirty when any of that started. The years the closed doors had cost him did not come back.

Decades of it. He never stopped teaching, and he never stopped learning.

The young man turned away from a door on sight spent the rest of his life standing inside one, letting other people in.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was George Washington Carver.

The peanut scientist, though that phrase sells him short. He spent forty-seven years teaching the children and grandchildren of enslaved people. He showed broke farmers how to bring dead land back. Three presidents met with him. None of that had happened yet on the day a college looked at his face and took back its yes.

Your life is not theirs. But a piece of this story may still sit beside you.

He was refused at the door with no home behind him. That is the kind of moment that ends most stories. His answer was years alone in a dirt house, keeping himself and his aim alive, until he could try another door.

A no at one door is one door. He kept knocking, and his name outlived every place that turned him away.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Dec 22, 1887, Erode; raised Kumbakonam (mother sang at a local temple, the
//    household took in student lodgers); consumed by mathematics from boyhood (Carr's Synopsis at
//    ~16); Government College scholarship 1904, lost the next year by failing every subject but
//    mathematics; Pachaiyappa's College — failed the First Arts (F.A.) exam twice; 1906-1912
//    the wilderness years: no degree, deep poverty, tutoring for pennies, filling notebooks
//    (worked on slate, chalk cheaper than paper); a serious illness and an operation in this
//    stretch (MacTutor dates the operation 1909, other accounts January 1910 — the beats give
//    no date); showed the notebooks to anyone who might help — R. Ramachandra Rao gave him a
//    small monthly allowance for a time; Mar 1, 1912 (24) clerk at the Madras Port Trust (30
//    rupees/month) under chief accountant S. Narayana Iyer, who encouraged the mathematics;
//    results sent to two English mathematicians (Hobson, Baker) brought no help (MacTutor: neither
//    replied; other accounts: the papers came back without comment — the beat says only that
//    neither took it up); Jan 16, 1913 (25) wrote G. H. Hardy enclosing nine pages, ~120 theorems
//    (the letter understated his age as about 23); Hardy weighed a hoax, then judged the results
//    "must be true, because, if they were not true, no one would have the imagination to invent
//    them"; Cambridge 1914; FRS May 2, 1918. d. 1920 (the beats do not dwell on the early death).
//  Interpretive: "genius or crank — with no one within a thousand miles able to check."
//    Grounded.
//  Avoid saying: don't name Ramanujan / India / Madras / Cambridge / Hardy / England before the
//    bridge; the 2026-08-27 anonymity pass also took out of beats 0-5 the temple town, Carr's
//    book described in all but its title, the port, the elbow-erasing habit, the nine pages /
//    ~120 theorems, the forger verdict in its quotable form, "one of its youngest fellows ever"
//    and the century-of-mined-notebooks line — a blind reader named him from those; keep them
//    out. Withheld for anonymity (2026-09-01), after a second blind reader named him again: the
//    borrowed-book-at-sixteen origin and the worked-out-every-result-from-nothing framing (beat 0
//    now says only that he taught himself out of what mathematics he could get hold of); how
//    eminent the third recipient was ("one of the most famous mathematicians alive", "the great
//    man"); the word hoax and the doubt-then-belief verdict in any quotable form; and "they are
//    still working through the pages" — beat 5 now says the notebooks were read at last, not
//    that they are still being mined. No equations; the religious dimension (Namagiri) and the
//    1909 marriage are left out of the beats; the death at 32 mentioned nowhere (bridge keeps to
//    the notebooks' living legacy). Withheld for anonymity (2026-09-01, round two, after a
//    third blind reader named him off beats 0-5): THE SUBJECT ITSELF. Beats 0-5 never say
//    mathematics or mathematician — not the boyhood obsession, not the one exam he passed,
//    not the men he carried the notebooks to, not his boss, not the strangers he wrote to, not
//    the society that elected him; it is the one subject, the work, the pages. Also out of beats
//    0-5: the port and the Trust, the nine pages and the ~120 theorems, the colleague at the
//    third reader's side that night and the three classes he sorted the results into, the
//    summons to a great university, the five-year burst of work, the society's standing and his
//    youth in it, and — for the notebooks — any claim that they held what nobody else
//    had found. The bridge still names everything. Do not write that he had no
//    degree when the society elected him: a Cambridge research degree was awarded
//    March 16, 1916, two years before the May 2, 1918 election.
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
    "Srinivasa Ramanujan was born December 22, 1887, in Erode, in southern India, and raised in the temple town of Kumbakonam in a poor Brahmin family; his mother sang at a local temple for a small income and the household took in student lodgers. Mathematics consumed him from boyhood; at about sixteen he obtained G. S. Carr's A Synopsis of Elementary Results in Pure Mathematics, a bare compendium of thousands of results, and began producing his own. In 1904 he won a scholarship to Government College, Kumbakonam, and lost it the next year by failing every subject except mathematics; at Pachaiyappa's College in Madras he twice failed the First Arts examination for the same reason. From about 1906 to 1912 — his late teens through his mid-twenties — he lived in poverty without a degree, tutoring students for small sums and filling large notebooks with original theorems, often working chalk-on-slate because paper was expensive, erasing with his elbow. He was seriously ill during these years and underwent an operation followed by a long recovery; accounts place it in 1909 or in January 1910. He showed the notebooks to anyone who might help; most could not read them, but R. Ramachandra Rao, a district collector and amateur mathematician, was persuaded enough to support him with a small monthly allowance for a time. On March 1, 1912, at twenty-four, he became a clerk at the Madras Port Trust on thirty rupees a month, where the chief accountant S. Narayana Iyer, himself a mathematician, encouraged the work. He sent his results to two English mathematicians, E. W. Hobson and H. F. Baker; neither took them up, one account saying that neither replied and another that his papers were returned without comment. On January 16, 1913, at twenty-five, he wrote to G. H. Hardy of Cambridge, enclosing nine pages of mathematics, roughly 120 theorems stated without proofs. Hardy set the letter aside at first and weighed the possibility of a hoax, then spent an evening studying it with J. E. Littlewood, judged a forger of such skill less likely than a great mathematician, and concluded that the results \"must be true, because, if they were not true, no one would have the imagination to invent them.\" Hardy brought him to Cambridge in 1914; on May 2, 1918, Ramanujan was elected a Fellow of the Royal Society, one of the youngest in its history. His notebooks — including the \"lost notebook\" rediscovered by George Andrews in 1976 — are still yielding new mathematics a century later.",
  sources: [
    "Kanigel, Robert. The Man Who Knew Infinity: A Life of the Genius Ramanujan (New York: Scribner's, 1991), Chapters 2-5.",
    "Hardy, G. H. Ramanujan: Twelve Lectures on Subjects Suggested by His Life and Work (Cambridge University Press, 1940).",
    "Berndt, Bruce C., and Robert A. Rankin. Ramanujan: Letters and Commentary (Providence: AMS, 1995).",
    "O'Connor, J. J., and E. F. Robertson. \"Srinivasa Aiyangar Ramanujan.\" MacTutor History of Mathematics Archive, University of St Andrews.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The poor small-town childhood, the mother's singing for a little money and the student lodgers, the self-teaching and the college scholarship — documented; nothing dramatized. The town's temple is left out so the place stays unidentifiable. Withheld for anonymity (round two): the subject itself is never named anywhere in beats 0-5, and neither is the one borrowed book at about sixteen nor the working-out-every-result-from-nothing framing — a poor self-taught prodigy in that one named field, failing every other exam, is the version of this life people already know.",
      text: `There was a young man in a small town a long way from any city.

His family was poor. His mother sang for a little money. They rented rooms to students to help make the rent. He was quiet, and from the time he was a boy one subject had hold of him and would not let go.

He taught himself. He worked through whatever he could get his hands on, then went past it into work that was his own. Nobody had taught him that. Nobody could tell him if he was right.

Everything else the school wanted — history, languages, the rest — was noise.

He won a college scholarship. It was about to go wrong in the most ordinary way there is.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The lost scholarship, the two First Arts failures, the degreeless years of poverty and tutoring, and the serious illness that needed an operation — documented; sources differ on the date of the illness, so the beat gives none. Withheld for anonymity: the name of the subject he failed everything else for — the beat says only the one subject.",
      text: `He failed everything except the one subject.

Not from laziness. He could not make himself care about anything else while the real work was burning in him. The scholarship was taken back. At a second college he sat the big qualifying exam and failed it. He tried again. Failed again.

No exam, no degree. No degree, no job — not even teaching school. Official life had one word for him now. Failure.

Then came years of nothing. Poverty. Tutoring boys for pennies. A long illness that needed an operation and took months out of him.

And through all of it the notebooks kept growing, page after page. Nobody he could reach could read a line of it.

That was the loneliest part. Not the poverty. The not knowing. Was this the work of a genius, or of a crank?

He believed he knew. But belief isn't proof, and there was no one within a thousand miles who could check.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The slate-and-chalk economy, the growing notebooks, carrying the work to anyone who might read it, and the small allowance from a well-placed amateur who did the same kind of work — documented. Withheld for anonymity: the field, so the men he showed the notebooks to are described only as people who had studied, and his benefactor only as a man who had kept up the subject for love of it. The elbow-erasing habit stays out.",
      text: `He kept working. Whatever else those years took, they did not get the notebooks.

Paper cost money. So he worked on a slate, chalk clicking for hours, then wiped it clean and started again. Only the finished results were worth ink.

And he would not let the work stay private. He carried the notebooks to every educated man who might understand. Officials, teachers, anyone who had studied. Most turned the pages politely and saw nothing they could read.

A few sensed something. One man had kept up the subject for love of it. He listened, and he was staggered. He paid a small allowance for a while so the work could go on.

It wasn't a living. It was holding on, waiting for one reader who could judge.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The clerkship at twenty-four under a chief accountant who did the same kind of work, and the two foreign scholars who did not take up his results — documented; accounts differ on whether they never replied or returned the papers, so the beat says only that neither took it up. Withheld for anonymity: the field, the port and the office that employed him, and how eminent the men he wrote to were — the beat says only that the people who could judge the notebooks lived in another country.",
      text: `At twenty-four he finally got a real job. A clerk's desk in an office, adding up accounts for a small wage.

It was a rescue of a small kind, and there was luck hidden in it. His boss cared about the same work he did, saw what the new clerk was scribbling, and made room for it. Finish the accounts, then work.

But the real problem had not moved. The only people alive who could judge the notebooks lived in another country, an ocean away.

So he wrote to them. Cold letters from an unknown clerk with no degree, with pages of his own work enclosed.

The first man did not take it up. The second did not either.

Men like that got letters from strangers all the time. He knew which pile his was landing in.

He wrote a third letter anyway.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The third letter of January 1913, the recipient's first doubt, the evening he spent working through the claims, and the reply that invited him — documented. The pages nagging at him through the day is dramatized texture over the documented gap between his setting the letter aside and taking it up that evening. Withheld for anonymity: the field, the nine pages and the count of theorems, how eminent the recipient was, the colleague who sat with him that night, the three classes he sorted the results into, the word hoax, and the forger-versus-genius verdict in any quotable form — the beat says only that a stranger with no reason to believe the letter went through it late into the night and stopped doubting.",
      text: `The third letter went out like the other two. Another stranger a long way off. Another chance at nothing.

He sent the results themselves, plainly written, without the working that got him there. The note with them said what he was. A clerk with no degree. He asked the man to look at the pages.

The stranger read it and set it aside. He had no reason to believe a word of it.

But the pages nagged at him all day. That evening he came back to them and went through the claims line by line, late into the night.

Some he could check. Some he could not. None of it was nonsense.

By the end of the night he had stopped doubting. The work was real.

Then the reply came, and it changed everything. After all those years of no one, someone wanted him to come.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The move abroad, the flood of work written up with the man who had answered, election to a learned society, and the notebooks being read at last by other people — documented; the early death is deliberately not dwelt on. He held a Cambridge research degree from March 1916, so the beat does not claim he was still without one when the society elected him in 1918. Withheld for anonymity: the field, the university and the society by name or standing, that he was unusually young for that honour, the five-year span of the burst of work, and that the notebooks are still being mined a century later — the beat says only that other people read them at last and that what he had put there held up.",
      text: `He crossed the world to a place where people gave their whole lives to this work. For years it poured out of him. He wrote it up with the man who had answered his letter. Results that startled the people who knew the subject.

The places that ran on exams and degrees had to make room for him. A society of men who had given their lives to this took him in as one of them. He had come to them from a clerk's desk.

And the notebooks. The notebooks stopped being something only he could read. Other people read them at last, and what he had put there held up.

He had been right about himself. In all the years when every measure said failure, the notebooks said otherwise. The notebooks were correct.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Srinivasa Ramanujan.

He is one of the greatest mathematicians who ever lived. He taught himself out of one old book, and his letter to G. H. Hardy at Cambridge is one of the most famous letters in the history of mathematics. His notebooks are still producing new mathematics today. None of that had happened yet in the years he was failing exams and filling slates, unsure whether any of it was worth anything.

Your life is not theirs. But a piece of this story may still sit beside you.

Every measure around him said worthless. Failed. No degree. Unemployable. He had no way to prove those measures wrong, because no one near him could even read the evidence. So he kept making the evidence, and kept mailing it, until it reached the one reader who could.

You don't have to prove the measures wrong today. He couldn't either, not for years.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. May 21, 1799, Lyme Regis, poor cabinetmaker's family (Dissenters, doubly
//    outsider); only formal schooling was a Congregationalist Sunday school; father died 1810
//    leaving debts — the children sold fossil "curiosities" to survive; her brother Joseph found
//    the ichthyosaur skull in 1811 and Mary excavated the rest of the skeleton in 1812 (age ~12);
//    by her twenties she was the most skilled fossil hunter on the coast (dangerous cliff work);
//    Dec 10, 1823 (age 24) found the first complete Plesiosaurus; Georges Cuvier — the world's
//    leading anatomist — suspected it was a fake/composite because of the ~35 neck vertebrae; the
//    Geological Society of London took it up at a special meeting in Feb 1824 where Conybeare
//    presented HER find (from her drawing, without naming her) — she was not invited and could not
//    be a member or even a guest (the Society admitted no women in her lifetime — Associates only
//    from 1907, Fellows from 1919); Cuvier conceded the specimen was genuine;
//    gentlemen geologists routinely published her finds without credit; Lady Harriet Silvester's
//    1824 diary records that the professors admitted she understood the science better than anyone
//    in the kingdom; she taught herself anatomy and French (to read Cuvier), dissected modern
//    animals to compare; opened Anning's Fossil Depot 1826 (27) in a house with a glass storefront
//    and an ichthyosaur in the window; Dec 1828 found the first pterosaur outside Germany, i.e.
//    Britain's first; small pension from ~1838 (Buckland's doing) and money raised for her by the
//    Geological Society; honorary member of the DORSET COUNTY MUSEUM 1846 — never of the Geological
//    Society; d. March 9, 1847, breast cancer, age 47; De la Beche read the Society's first eulogy
//    for a woman after her death.
//  Interpretive: "the science was built on her finds while the doors stayed shut"; the
//    being-proved-right framing of the Cuvier episode. Grounded.
//  Avoid saying: don't name Anning / Lyme Regis / Cuvier / plesiosaur / the Geological Society by
//    name before the bridge, and in beats 0-5 don't describe the finds in identifying detail either:
//    no long neck, no "sea creature" / "sea dragon" / "flying reptile", no "at twelve", no "first
//    flying reptile found in her country" (a blind reader named her from exactly those, 2026-08-27);
//    NO "she sells seashells" (the tongue-twister link is apocryphal);
//    and, after two further blind readers named her off beats 0-5 (2026-09-01), beats 0-5 no
//    longer say what she dug up at all: no "monsters", no bones, no skeleton, no animal or
//    creature, no fossils, no sea, no seaside town, no beach, no cliffs (the danger is "ground
//    that slid"), no tourist buyers, no skeleton in the shop window, no long neck or extra
//    vertebrae for the doubted find, no naming of anatomy or French as what she taught herself,
//    no dissections, no "understands more of the science than anyone else in this kingdom"
//    phrasing for the 1824 diary line, no "first of its kind found in her country" for the 1828
//    find, and no statement of what her finds proved about the age of the earth or about whole
//    kinds of animals dying out — the beats say only that she dug curious things out of the rock
//    and sold them; the poverty, the father's death and debts, the winter danger, the find called
//    a join of two things, the closed society, the self-teaching, the shop at twenty-seven, the
//    yearly sum, the money raised in her illness and the tribute after her death all stay,
//    because they are the episode itself, and the bridge names everything;
//    don't say she personally argued her case to Cuvier (not documented — fuller drawings and the
//    society's own men settled it); don't attribute "the greatest fossilist the world ever knew"
//    to a named contemporary (it is Torrens's 1995 article title and its origin is not established;
//    the 1865 All the Year Round piece often quoted about her is plagiarized and unreliable);
//    don't overstate — she was paid and had scientific friends; the sting is credit and standing,
//    not total obscurity.
const anning: FigureStageRow = {
  figureKey: "anning",
  displayName: "Mary Anning",
  birthYear: 1799,
  deathYear: 1847,
  stageId: "1823-1828-the-doubted-sea-dragon",
  stageLabel: "The doubted find: the plesiosaur, the closed society, the credit taken",
  ageMin: 24,
  ageMax: 29,
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
      "Whether to swallow the credit-taking and keep supplying the gentlemen, or to insist on her own expertise — teaching herself the anatomy, and the French of the man who doubted her — until they had to deal with her as a mind and not a shovel.",
    triggerEvent:
      "The world's leading anatomist declared her strangest find a probable fake, and the learned society weighed her discovery at a meeting she was not allowed to attend.",
    agencyState:
      "Poor, unschooled, unadmittable to any scientific body — but the best eye and hands in the field lived in her, and the cliffs kept giving her proof.",
  },
  biographicalFacts:
    "Mary Anning was born May 21, 1799, in Lyme Regis on England's south coast, into a poor cabinetmaker's family who were also religious Dissenters — outsiders twice over. Her only formal schooling was at a Congregationalist Sunday school, where she learned to read and write; the science she learned afterward she taught herself. Her father took the children fossil-hunting on the dangerous coastal cliffs to sell \"curiosities\" to tourists; when he died in 1810 leaving debts, the children's fossil money helped keep the family fed. In 1811, when Mary was twelve, her brother Joseph found a four-foot skull in the cliffs; a few months later, in 1812, Mary excavated the rest of the skeleton of the animal later named Ichthyosaurus. By her twenties she was the most skilled fossil hunter on the coast, working landslide-prone cliffs in winter when fresh falls exposed new bone. On December 10, 1823, at twenty-four, she found the first complete skeleton of Plesiosaurus — a marine reptile so strange, with about thirty-five vertebrae in its neck, that Georges Cuvier of Paris, the world's most celebrated anatomist, suspected the specimen was a fake or a composite of two animals. The Geological Society of London took up the find at a special meeting in February 1824, where William Conybeare presented it using her drawing and did not name her; Anning was not invited and could not have joined the society in any case — it admitted no women at all in her lifetime, neither as members nor as guests. Cuvier, shown fuller drawings and detail, conceded the animal was genuine, and the affair established her reputation among working geologists even as the formal credit went elsewhere; throughout her career, gentlemen of science published descriptions of her finds with little or no mention of her. She taught herself geology and comparative anatomy, learned enough French to read Cuvier, and dissected modern fish and squid to compare with her fossils. Lady Harriet Silvester, visiting Lyme in 1824, wrote in her diary that Anning \"has arrived to that degree of knowledge as to be in the habit of writing and talking with professors and other clever men on the subject, and they all acknowledge that she understands more of the science than anyone else in this kingdom.\" She grew resentful of the uncredited publishing: her friend Anna Maria Pinney recorded that \"these men of learning have sucked her brains, and made a great deal of publishing works, of which she furnished the contents, while she derived none of the advantages,\" and Anning herself wrote, \"The world has used me so unkindly, I fear it has made me suspicious of everyone.\" In 1826, at twenty-seven, she bought a house with a glass storefront and opened her own shop, Anning's Fossil Depot, with an ichthyosaur skeleton in the window; collectors and savants from across Europe made a point of visiting. In December 1828 she found the first pterosaur skeleton discovered outside Germany — the first found in Britain. Her marine reptiles were central evidence for the then-new and disturbing idea that whole kinds of animals had lived and gone extinct long before human beings. From about 1838 she received a small annual pension, arranged with William Buckland's help, from the British Association for the Advancement of Science and other supporters; the Geological Society of London separately raised money from its members for her when she was ill. In 1846 the Dorset County Museum made her an honorary member. The Geological Society never admitted her. She died of breast cancer on March 9, 1847, at forty-seven; afterward its president, Henry De la Beche, read the members a eulogy for her — the first the Geological Society had given for a woman. Her specimens are held today by the Natural History Museum in London.",
  sources: [
    "Emling, Shelley. The Fossil Hunter: Dinosaurs, Evolution, and the Woman Whose Discoveries Changed the World (New York: Palgrave Macmillan, 2009).",
    "Torrens, Hugh. \"Mary Anning (1799-1847) of Lyme; 'The Greatest Fossilist the World Ever Knew'.\" British Journal for the History of Science 28, no. 3 (1995).",
    "Natural History Museum, London, \"Mary Anning: the unsung hero of fossil discovery.\"",
    "Silvester, Lady Harriet. Diary, 1824, quoted in Torrens (1995).",
    "De la Beche, Henry T. Anniversary address of the President, Quarterly Journal of the Geological Society of London (1848) — contains the eulogy for Anning.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The poor childhood, the Dissenter family, the father's trade and his death in 1810 leaving debts, most of the strange thing she dug out before she was grown (her brother found the first piece), and the winter work on dangerous ground are documented. \"She had the eye\" is editorial framing, not a quoted judgment. Withheld for anonymity: the sea, the seaside town, the cliffs, the tourists the family sold to, and every word for what she actually dug up - the beat says only that she dug curious things out of the rock and sold them.",
      text: `There was a young woman who dug curious things out of the rock and sold them.

She grew up poor in a small town. Her family was looked down on twice over — for being poor, and for praying in the wrong building. Her father made furniture, and he taught the children his side trade: getting curious things out of the ground to sell.

Then he died and left debts. After that, what the children dug up was the difference between eating and not.

She had the eye. Before she was grown she dug most of something strange out of the ground. It was years before anyone could say what it was.

The ground there slid without warning, worst in winter. It gave up the most then, so winter was when she went.

She was in her twenties now. What she found was getting stranger.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: the strange complete find of December 1823, the leading anatomist's suspicion that it was a fake or two animals joined, the special meeting the learned society held on it, the gentleman who presented it there from her own drawing without naming her, and the total exclusion of women. Her fear of being ruined is inference from the family's dependence on what she sold. Withheld for anonymity: what the find was, its long neck and its extra vertebrae, the word skeleton, and the names of the expert and the society.",
      text: `One winter she got out the strangest thing yet. Whole, end to end, and shaped like nothing anybody knew.

The shape was the problem. There was too much of it, and in the wrong places. A famous man in another country was the highest authority there was, and his word settled arguments. He said it was probably a fake. He thought she had joined two finds together and sold the join as one.

A cheat. Her.

Everything her family ate came from her name for honest work. If his verdict stood, she wasn't just wrong. She was finished.

A society of learned men in the capital called a special meeting about her find. A gentleman presented it there, using her own drawing. He did not say her name.

She was not in the room. That society did not let women in at all.

They argued about her find and her honesty without her.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: fuller drawings and detail went to the doubting expert, he conceded the find was genuine, her name stayed out of the official account, and her standing among working men of science rose. That she personally argued her case is not documented; \"she stood by what she had dug\" is editorial framing of her position, not a recorded act or speech. Withheld for anonymity: the field, what the find was, and both men's names.",
      text: `She stood by what she had dug.

She had lifted every piece of it out of the rock herself. There was no seam. The find was simply true, and the great man's imagination had not stretched that far yet.

So she kept working, and the proof went across the water. Better drawings. Fuller detail. The whole of it laid out piece by piece.

He looked again. And the most powerful voice in the field took it back. The find was real. It was one thing, not two. She had been right and he had been wrong, and every gentleman in that closed room knew it.

Her name did not appear in the official account.

But in the letters those men wrote each other, it started appearing.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: the years of uncredited publishing, the small income and money worries, the science she taught herself out of borrowed books, and the foreign language she learned so she could read the man who doubted her. The visitor's line is a diary entry from 1824, given as indirect speech. The kitchen table is dramatized texture. Withheld for anonymity: which science and which language she taught herself, the dissections she compared her finds against, and the diary's \"understands more of the science than anyone else in this kingdom\" phrasing.",
      text: `Being right paid nothing and changed less.

The pattern held for years. She found; gentlemen published. Her finds filled the halls of great collections and made careers under other men's names. She bargained over small change and worried about the rent.

She refused to stay a pair of hands. At her kitchen table she taught herself the science behind her own work, out of borrowed books. She learned the language the doubting expert wrote in, so she could read him with nobody in between.

She had made herself an expert, alone, with no door opening to help.

A visitor wrote it down in her diary. The learned men all admitted it: this young woman knew more about the subject than they did.

The rooms stayed shut anyway. She kept digging.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the house with the shop she bought and opened at twenty-seven, her name over it and one of her finds in the window, the collectors and men of science who traveled from across Europe to visit, and the second remarkable find two years later. \"Her doorway had become the room\" is editorial framing. Withheld for anonymity: the town, the fact that the piece in the window was a mounted skeleton, and that the 1828 find was the first of its kind ever discovered in her country.",
      text: `So the world started coming to her instead.

At twenty-seven she opened her own shop. Her name over the door. One of her best finds in the front window, facing the street.

And the shop turned things around. Collectors, professors and famous men from other countries began making the trip to a shop run by a furniture-maker's daughter. They came to buy from her. They also came to ask her.

There was no substitute for her. She knew that ground, and what lay in it, better than any member of any society did.

Two years after the shop opened, she got another remarkable thing out of the rock. Another sensation. More papers written by men who had not been there.

The rooms in the capital never did open to her.

Her doorway had become the room.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: her specimens ending up in the great collections, the men of science who wrote to her and visited her, the small yearly sum arranged for her from about 1838 with Buckland's help, the money the Geological Society raised for her when she was ill in 1846, her death at forty-seven, and the president's tribute afterward - the first that society read for a woman. She is never named here. Withheld for anonymity: what her finds proved about the age of the earth and about whole kinds of animals dying out, which is the single most identifying fact about her - the beat says only that the men who ran the field learned to come to her door.",
      text: `She kept at it for the rest of her life.

What she pulled out of the rock ended up in the great collections. The men who ran that field learned to travel to her door and take her word. Men who had studied for years wrote to ask her what she thought.

She stayed in the same small town, working the same dangerous ground, and money stayed tight for years. Later, men of science arranged a small yearly sum for her.

Near the end, the society that had never let her in raised money to keep her cared for.

Then she got sick, and she died at forty-seven.

And the head of that society stood up in the room she had never been allowed to enter. He read out a tribute to her. They had never done that for a woman before.

The rooms stayed shut. What was inside them was hers anyway.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Mary Anning.

She found the first complete plesiosaur, the first pterosaur ever dug out of British rock, and the great ichthyosaurs before that. Her fossils are in the national museum in London, and the science she helped start counts her among its founders. None of that had happened yet in the winter the most famous expert alive was calling her a probable fraud.

Your life is not theirs. But a piece of this story may still sit beside you.

She did the work and watched the credit walk off in other people's coats, over and over, for years. She never did get the room. She got so good at the work that the room had to come to her.

You don't have to be let in to do the work. She never was.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 12, 1913, Oakville, Alabama, sharecropper's son, raised Cleveland; married
//    Minnie Ruth Solomon 1935, daughter Gloria b. 1932 (two more 1937, 1940); Berlin Aug 1936
//    (age 22): four gold medals; left the unpaid European exhibition tour that followed and AAU
//    chief Avery Brundage had him suspended from amateur competition — his track career ended
//    within weeks of his triumph; New York ticker-tape parade Sept 3, 1936; promised endorsements
//    evaporated; no White House invitation from FDR; 1936-1940: raced against horses, motorcycles
//    and cars at exhibitions ("I had four gold medals, but you can't eat four gold medals" — his
//    words), gas-station attendant, playground janitor, signed as a professional entertainer 1937
//    (tap-dancing with Bill Robinson, jazz-band tour), a dry-cleaning chain that carried his name
//    and failed (personal bankruptcy 1939); later rebuilt as a speaker and goodwill ambassador,
//    Eisenhower's "Ambassador of Sports" 1955 and US representative at the 1956 Games;
//    Presidential Medal of Freedom from Ford, Aug 5, 1976. d. Mar 31, 1980.
//  Interpretive: "the fastest man on earth with nowhere to run" framing. Grounded.
//  Avoid saying: don't name Owens / Berlin / Hitler / the Olympics before the bridge, don't
//    gesture at the host regime, and keep the fame markers out of beats 0-5 entirely: no medal
//    count, no use of the word "medals" at all, no "he won everything he entered", no version
//    of the "you can't eat four gold medals" line, no racing against horses, motorcycles or
//    cars, no president named by office, no named award, no "the biggest games in the world",
//    and no fame superlatives ("the most celebrated athlete alive", "the fastest runner in the
//    world", "the fastest legs alive"). Blind readers named him at 0.97 confidence off two
//    successively softer drafts, so those forms were cut too. Withheld for anonymity (third
//    pass, 2026-09-01), after a blind reader named him again: the SPORT itself. Beats 0-5 no
//    longer say he ran, raced or was fast — a poor boy who becomes the fastest man alive
//    and wins everything in one summer far from home is him and nobody else. What the beats now
//    say: he was better at his sport than anyone they put him against, and he won the biggest
//    contest he had ever been in, far from home. Also cut in that pass: "he raced the best
//    there was"; the silence from his country's leaders (the offers simply going quiet now
//    carries the abandonment, and no head of state appears in beats 0-5 at all); the fairs and
//    "whatever the promoters lined up beside him" (now paid shows where he put on a display);
//    the "what he won fed nobody" answer (now only "what else was he supposed to do"); the
//    ambassador years and the return to the games as his country's official guest; and the
//    forty-year gap before the honor. The medal count, the games, the horses and the award
//    appear only in the bridge; the quote, the vehicles and any president as its giver stay
//    out of all seven beats. Why the cleaning chain failed is disputed across sources, so the
//    beats leave the cause unstated; the exhibition work is rendered with his own
//    dignity-forward framing, never as minstrelsy; no dollar figures; no "telegram" (era word).
const owens: FigureStageRow = {
  figureKey: "owens",
  displayName: "Jesse Owens",
  birthYear: 1913,
  deathYear: 1980,
  stageId: "1936-1940-after-the-gold",
  stageLabel: "You can't eat four gold medals: the suspension and the lean years",
  ageMin: 22,
  ageMax: 27,
  themes: ["dispossession", "worthlessness", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "Weeks after the greatest triumph an athlete can have, he said no to the men who ran his sport, and they banned him for life — the fastest man on earth, forbidden to race, at twenty-two.",
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
    "Jesse Owens was born September 12, 1913, in Oakville, Alabama, the son of a sharecropper, and raised in Cleveland, Ohio. He married Minnie Ruth Solomon on July 5, 1935; their daughter Gloria had been born in 1932, and two more daughters followed in 1937 and 1940. At the Berlin Olympic Games in August 1936, at twenty-two, he won four gold medals — the 100 meters, 200 meters, long jump, and 4x100 relay — the most celebrated athletic performance of his era, achieved in front of Hitler's regime. Immediately afterward, exhausted and unpaid, he declined to continue a grueling exhibition tour of Europe arranged by athletics officials; Avery Brundage's Amateur Athletic Union responded by suspending him from amateur competition permanently, ending his track career within weeks of his triumph. New York gave him a ticker-tape parade on September 3, 1936, but the commercial offers that had been dangled evaporated within months. President Roosevelt sent no invitation and no telegram. Over the following years Owens raced against horses, motorcycles and cars at fairs and exhibitions — \"People say it was degrading for an Olympic champion to run against a horse, but what was I supposed to do? I had four gold medals, but you can't eat four gold medals,\" he said — worked as a gas-station attendant and playground janitor, signed in 1937 as a professional entertainer, tap-dancing with Bill \"Bojangles\" Robinson and touring with a jazz band, and lent his name to a chain of dry-cleaning shops that failed; he filed for personal bankruptcy in 1939. Accounts of why the chain collapsed differ and no single cause is established. In the 1950s and after, he rebuilt his life as a public speaker and goodwill ambassador, becoming one of the most sought-after inspirational speakers in America; President Eisenhower named him \"Ambassador of Sports\" in 1955 and asked him to represent the United States at the 1956 Olympic Games in Melbourne. President Ford presented him the Presidential Medal of Freedom on August 5, 1976. He died March 31, 1980.",
  sources: [
    "Baker, William J. Jesse Owens: An American Life (New York: Free Press, 1986), Chapters 7-10.",
    "Schaap, Jeremy. Triumph: The Untold Story of Jesse Owens and Hitler's Olympics (Boston: Houghton Mifflin, 2007).",
    "Olympics.com, \"From horse-racer to speech writer: Jesse Owens' life after the Olympic Games.\"",
    "Encyclopedia of Cleveland History, Case Western Reserve University, \"Owens, Jesse.\"",
    "White House Historical Association, \"President Ford Awards Presidential Medal of Freedom to Jesse Owens\" (August 5, 1976).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The poor farming family, the northern childhood, the win at twenty-two, the homecoming crowds and the promised offers — all documented. Withheld for anonymity: the host city, the host regime, the name and the scale of the games, the events he entered, the medal count, every fame superlative, and now the sport itself. Beats 0-5 no longer say he ran or was fast, because a poor boy who becomes the fastest man alive is him and nobody else. The beat says only that he was better at his sport than anyone they put him against, and that he won the biggest contest he had ever been in, far from home. No dramatized detail added.",
      text: `There was a young man, and for one summer everything went right.

He was born poor, in a family that worked another man's land. He grew up in a big city up north. From the time he was small, he was better at his sport than anyone they put him against.

That summer he went far from home, into the biggest contest he had ever been in. He won it.

Then he came home. He was twenty-two. Strangers cheered him in the street. Businessmen promised him the moon.

He had done the thing nobody thought a poor boy could do. He had earned every bit of it. Now, surely, came the reward.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The unpaid tour abroad he refused, the permanent suspension from competition, the endorsements that never came, and the wife and small daughter at home — all documented. Withheld for anonymity: the sport, the words race and fast, the medals, and the silence from his own country's leadership after he had made it proud, which is one of the most retold details about him. The offers going quiet now carries the whole abandonment; no head of state appears in the beats, by name or by office. Where the tour money went is not claimed.",
      text: `First came a bill.

The men who ran his sport had arranged a long tour abroad. More appearances. More crowds. No pay for the athletes. He was worn out and homesick, and his family needed him earning. He said no.

The officials answered with a ruling. He was suspended from competition. Permanently.

Just like that, he was finished. Not injured. Not beaten. Banned. By men in offices, weeks after the best summer of his life.

Then the promised moon evaporated. The businessmen who had made him offers went quiet. Inside a few months there was nothing left of any of it.

He was twenty-three and broke. He had a wife and a small daughter. And no way to earn a living from the one thing he was great at.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The paid exhibition appearances, the gas-station and playground jobs, and the 1937 entertainment contract and band tour are documented. Withheld for anonymity: that the exhibitions were races at fairs against horses, motorcycles and cars, which is the single most retold image of him, and any version of his line about what his medals could not buy. His answer survives only as plain indirect speech — what else was he supposed to do — never as quotation and never in his famous phrasing. The dignity framing is his, from his later accounts.",
      text: `So he worked. Whatever there was.

The strangest work was this. Promoters paid him to turn up at their shows and put on a display. Not a real contest. People told him it was beneath him.

He had an answer, and he gave it for the rest of his life. What else was he supposed to do? Nobody was offering him better.

So he took the pay. He kept his head up doing it.

Between those jobs he pumped gas. He swept a playground. He danced and toured with a band for a season.

None of it was the plan. All of it was food on his family's table, earned in daylight.

Shame, he decided, belonged to the men who had banned him. Not to the man doing honest work.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The chain of cleaning shops that carried his name, its failure, the debts and the personal bankruptcy — documented. Sources disagree on why the chain collapsed, so no cause is stated. Withheld for anonymity: the fame superlatives this beat used to carry, and the legs that were named here as the best thing he had, which handed the sport back to the reader. That people listened when he spoke is drawn from his later speaking career, not from any documented room.",
      text: `He tried to build something of his own. A chain of shops that cleaned people's clothes, with his name over the door.

It failed. The debts landed on him. Within a couple of years he had to declare himself bankrupt.

Those were long years. The cheering had stopped. People had moved on to whoever was new.

He was still a young man. His body was still the best thing he owned, and there was nowhere left he was allowed to use it.

He kept working the small jobs and the paid appearances. He kept his name clean even when it wasn't worth much on a storefront.

And slowly he noticed the one thing the officials could not ban. When he stood up in a room and told his own story, people listened all the way to the end.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The rebuild as a public speaker and his standing among the most sought-after speakers in the country are documented, but compressed: that growth ran across the 1940s and 1950s, past the lean years of this episode. The kinds of rooms he spoke in are given only in general terms, since biographicalFacts establishes the speaking career and not particular audiences. Withheld for anonymity: the running that the old opening line leaned on, and the exhibition detail, kept here only as the shows. The quiet room is dramatized texture.",
      text: `The talking became the new work.

People started asking him to come and speak. Schools. Churches. Companies. Anywhere people would gather to listen.

He would stand up, plain and warm, and tell them the whole thing. The dirt-poor start. The summer everything went right. The shows and the gas pumps after.

And then the part he cared about most. Getting up anyway.

He was good at it. Better than good. A room would go quiet, and he would give it something true, and people carried it home.

The invitations kept coming, and then they kept multiplying. The man the officials had silenced ended up with more rooms wanting him than he could reach. Paid, at last. Wanted, at last. For exactly what he was.

Nobody handed him that second life. There was no committee for it. He built it out of the wreckage, by hand.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The years of constant speaking and travel, and the public national honor late in his life, are documented and kept anonymous here. Withheld for anonymity: the medal count and the word medals, the name of the award, the office that presented it, the ambassador title, the return to the same games as his country's official representative, and the forty-year gap — each of which names him. The becoming is given in human terms: rooms, travel, children, and a thank-you that came late. The stripped-but-not-emptied line is editorial framing, not a sourced claim.",
      text: `He spent the rest of his life in front of people. Room after room, year after year, saying the same true thing.

He traveled a great deal for it. He spoke to children most of all. He had gone from banned to trusted, and he had made the crossing on his own.

Late in his life, in public, his country said thank you. It had taken most of his life to arrive.

The men who banned him were long gone by then. He had outlasted them.

What he built by hand lasted longer than what was taken from him. Being stripped of a thing is not the same as being emptied out. He was still in there. He always had been.

What he won that summer was never the treasure. It turned out the man was.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Jesse Owens.

He won four gold medals at the 1936 Berlin Olympics, in front of Hitler. It is still one of the most famous weeks in sport. What most people never learn is what came after. Banned from his sport within weeks. Dropped by the sponsors. Racing horses at fairs to feed his family. The Presidential Medal of Freedom came forty years later. None of that was visible yet on the morning we just sat with him.

Your life is not theirs. But a piece of this story may still sit beside you.

He did everything right, better than anyone on earth had ever done it, and the reward was taken away by men with pens. What he kept was the part no ruling could reach. How he carried himself while he built the next thing.

You don't have to know what you're building yet. He didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. June 13, 1865; met Maud Gonne at his family's London house Jan 30, 1889 (23),
//    on an introduction from John O'Leary — she stayed about nine days, he dined with her most
//    evenings, and he was, by his own account, transformed ("the troubling of my life began");
//    first marriage proposal Aug 1891 (26), refused; at least four refusals across 1891, 1899,
//    1900 and 1901, and a final proposal in 1916 (51); her documented reply that he made
//    beautiful poetry out of his unhappiness and marriage would be "a dull affair"; ~50 poems
//    written to or about her; "When You Are Old" (written 1891, in the 1892 volume whose lyrics
//    Yeats later grouped as The Rose), "He wishes for the Cloths of Heaven" (1899, "tread softly
//    because you tread on my dreams"); Irish Literary Theatre 1899, which became the Abbey
//    Theatre 1904; married Georgie Hyde-Lees Oct 20, 1917 (52), two children; Nobel Prize in
//    Literature Nov 1923 (58). d. Jan 28, 1939.
//  Interpretive: the arc's discipline — the love was real and unreturned, and the LIFE grew large
//    anyway; the poems as what he built, not as a strategy that "won" anything. Grounded.
//  Avoid saying: don't name Yeats / Maud Gonne / Ireland / poem titles before the bridge, and do
//    NOT quote OR closely paraphrase either poem before the bridge — the cloths poem identifies
//    him on sight (one draft quoted its closing line and told the reader they could finish it; a
//    later draft retold the poem image by image, and a blind reader named him from beat 4 alone);
//    keep the theatre and the prize unnamed AND unlabelled before the bridge — "a national
//    theater" plus "the highest honor in literature" is the same tell in slower motion; do NOT
//    romanticize persistence-after-no as courtship advice — the beats render the no as final and
//    the work as where the feeling went; do NOT say she predicted his LIFE would be dull, she
//    said marriage would be; the later marriage kept to one line (and NOT the Iseult episode);
//    no politics; no invented gestures — an earlier draft had her smiling as she refused him.
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
    "William Butler Yeats was born June 13, 1865, near Dublin. On January 30, 1889, at twenty-three, he met Maud Gonne at his family's house in London, where she had called with an introduction from the nationalist John O'Leary — a moment he later described with the sentence \"the troubling of my life began.\" Gonne, then twenty-two, was a tall and much-admired political activist working for Irish nationalist causes. She stayed about nine days, dining with him most evenings, and left him transformed. In August 1891, at twenty-six, he proposed marriage; she refused. She refused again, and again: at least four proposals across 1891, 1899, 1900 and 1901, and a final proposal in 1916, when he was fifty-one. She told him on one occasion that he would not be happy with her: \"You make beautiful poetry out of what you call your unhappiness and you are happy in that. Marriage would be such a dull affair.\" The love remained, by every account including his own, the central emotional fact of his young manhood, and it went into the work: at least fifty of his poems were written to or about her, including \"When You Are Old\" (written 1891; published in The Countess Kathleen and Various Legends and Lyrics, 1892, among the lyrics Yeats later grouped under the title The Rose) and \"He wishes for the Cloths of Heaven\" (The Wind Among the Reeds, 1899), whose closing lines read \"I have spread my dreams under your feet; / Tread softly because you tread on my dreams.\" He was still writing poems about her in his seventies. The no never became a yes. Yeats co-founded the Irish Literary Theatre in 1899, which became the Abbey Theatre in 1904, and led the Irish Literary Revival. He married Georgie Hyde-Lees on October 20, 1917, at fifty-two, and they had two children, Anne and Michael. In November 1923, at fifty-eight, he was awarded the Nobel Prize in Literature; his later collections, among them The Tower (1928), are widely counted among his finest work, and he is generally regarded as one of the foremost English-language poets of the twentieth century. He died January 28, 1939.",
  sources: [
    "Foster, R. F. W. B. Yeats: A Life, Volume I: The Apprentice Mage, 1865-1914 (Oxford: Oxford University Press, 1997), Chapters 4-6.",
    "Yeats, W. B. Memoirs, ed. Denis Donoghue (London: Macmillan, 1972).",
    "Yeats, W. B. The Countess Kathleen and Various Legends and Lyrics (London, 1892) and The Wind Among the Reeds (London, 1899).",
    "The Nobel Prize in Literature 1923: W. B. Yeats — Biographical (nobelprize.org).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The 1889 meeting at his family's house, her nine-day stay, and his own later phrase about the troubling of his life — documented; her height and her looks are in the record. Nothing dramatized.",
      text: `There was a young man of twenty-three. He wrote poems. Nobody much had heard of him yet.

One winter day a young woman came to his family's house. She was there on business — causes, politics, the state of the world. She was tall and fierce and beautiful. She talked about the world like it was hers to fix.

She stayed in the city nine days. Nine.

He wrote later that this was the day the troubling of his life began.

He was not a casual person. He did not fall casually. Something in him decided, all at once, that this was the person. It never fully un-decided.

She left after nine days. He started writing.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The 1891 proposal and refusal, the later refusals, and her reply about his unhappiness and a dull marriage — documented, and given here as indirect speech, not quoted. No expression or gesture is described; none is documented.",
      text: `For two years he loved her from the edge of her life. Letters. Visits when she passed through. A friendship that was everything to him and pleasant to her.

At twenty-six he finally asked her. Marry me.

She said no.

Kindly, but no. He asked again in the years that followed, more than once. The answer had a terrible steadiness to it. No, and no, and no.

Once she explained it to him. He made beautiful poetry out of what he called his unhappiness, she said, and he was happy in that. Marriage would be a dull affair.

There it was. The person he loved most had looked straight at the center of him and declined it.

He was young. He was unknown. The feeling had nowhere to land, and it was not going away.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The poems written to her from 1891 on, and the one written at twenty-six that sets the many who loved her beauty against the one who loved the whole of her — documented. The 'somewhere to go' framing is interpretive. No poem is named, quoted, or described closely enough to identify it.",
      text: `A feeling that size, refused, can rot a person. It turns into bitterness, or begging, or a locked room you live in.

He found another door.

He could not make her love him. Nobody can make that, and the trying only shrinks a person. What he could do was give the feeling somewhere to go.

So he put it in the work. Not as complaint. As craft. He took the ache and made lines out of it. Lines about her face. About time. About loving someone whose eyes are on the horizon and not on you.

One poem told her that many people loved her beauty, and one person had loved something else — the restless whole of her.

He was twenty-six when he wrote it.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The continued closeness, the continued refusals, and the roughly fifty poems written to or about her — documented; the years are compressed. Nothing invented.",
      text: `The years did not tidy it up.

She stayed in his life. Friend, ally, always near, never his. Each time he had half healed, a letter or a visit would open it again. Whenever he tested the answer, it was still no.

He did not handle it perfectly. Real people don't. There were years he hovered. Years he swore off. Years he tried to be done with it and wasn't.

But the important part held. The feeling kept going onto the page instead of into ruin. Poem after poem, dozens of them over the years, all of it written to a woman who was never going to say yes.

And meanwhile, almost without his noticing, the poems were making his name.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "His poems in print by his late twenties, and the dozens written to her across these years — documented. No poem is named, quoted, or described. That he was young and not yet established is documented; the 'not to change the answer' framing is interpretive.",
      text: `By his late twenties the poems were in books, and strangers were reading them.

The ones written to her kept coming, and they kept getting truer. He was young and still mostly unknown. He could not give her anything she was looking for. What he had was what he could make.

So he gave her that. Not as a trade. Not to change the answer — the answer was set. He wrote her the truest things he could write, and let them be true whether or not she wanted them.

Poem after poem, handed to a woman who had already said no.

That is what he did with the no. Not revenge. Not forgetting. He took a love that was never going to be returned and refused to let that make it worthless. He turned it into something strangers would carry around for a hundred years.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The marriage at fifty-two, the two children, the theatre he helped found, the honor that came in his late fifties, and the poems he was still writing about her in old age — documented; names, places, titles and the names of the honors withheld.",
      text: `And his life got large.

He became a great poet, and then one of the great ones of his century. He helped start a theater, and a whole generation of writers grew up around him. In time he married. He was fifty-two. A real marriage, a house, children. His work kept deepening decade after decade. Some of his best poems came when he was well past fifty.

Late in his life the big honors came.

And the woman? They stayed in each other's lives, complicated to the end. The no never changed. He never pretended it hadn't mattered. He was still writing poems to her when he was an old man.

Here is the part worth keeping. An unreturned love did not get to decide how big his life would be. He decided that.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was W. B. Yeats.

He won the Nobel Prize in Literature and is counted among the greatest poets of the last century. The woman was Maud Gonne. He proposed to her the first time at twenty-six and the last time at fifty-one, and she said no every time. "When You Are Old" and "He wishes for the Cloths of Heaven" came out of exactly the heartbreak we just walked through. None of that existed yet on the day he was twenty-six and freshly refused.

Your life is not theirs. But a piece of this story may still sit beside you.

The person he wanted most never wanted him back, and being brilliant did not change it. What he could choose was what the love turned into. He chose to build with it.

A no can end a hope without ending you. What you do with the feeling is still yours.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 26, 1892, Atlanta TX, one of thirteen children of sharecroppers (sources
//    differ on birth order — Rich and the Smithsonian say tenth, the Handbook of Texas says
//    twelfth, so the beats say only "one of thirteen"); her father was part Cherokee and left the
//    family; cotton fields as a child, one term of college money; Chicago ~1915 (23), manicurist
//    at the White Sox Barber Shop, later manager of a chili parlor to save faster; brothers back
//    from WWI teased her that women over there could fly planes and she couldn't; every American
//    flight school refused her (Black AND a woman) and no aviator would train her privately;
//    Chicago Defender publisher Robert Abbott urged France; Berlitz night classes in French;
//    sailed Nov 20, 1920 (28); a French school rejected her as a woman; the Caudron Brothers'
//    School at Le Crotoy accepted her; roughly nine miles' walk each way to the field, a
//    wood-and-fabric biplane that failed often, a fellow student killed in a crash during her
//    training, the ten-month course finished in seven; license from the Fédération
//    Aéronautique Internationale June 15, 1921 (29) — first Black woman and first Native
//    American woman licensed to fly, and the earliest known Black person to hold an international
//    license; an advanced course, then home to press attention in Sept 1921; barnstormed as
//    "Queen Bess" (loops, figure eights), lectured in churches, schools and theaters, hoped to
//    found a flying school (never opened), refused segregated gates (Waxahachie TX: same entrance
//    or no show); Old Mannheim Rd at O'Hare renamed Bessie Coleman Drive in 1990. d. 1926 (air
//    accident — not in beats).
//  Interpretive: "she changed countries rather than change her mind." Grounded.
//  NOT claimed: that she was first among American women pilots — Harriet Quimby was licensed in
//    1911. The firsts here are Black woman / Native American woman / international license.
//  Avoid saying: don't name Coleman / Chicago / France / French / the Defender / Abbott / the
//    chili parlor before the bridge (the "country across the ocean" phrasing keeps it soft); her
//    death is NOT in the beats or bridge; no "Queen Bess" and no royal-nickname wording
//    before the bridge; beats 0-5 state NO "first" claim at all (both firsts are saved for
//    the bridge). Second anonymity pass (a blind reader still named her from beats 0-5): beats
//    0-5 now name her race nowhere — no "Black", no "her people", no "skin" or "color", no
//    cotton, no "deep South", no northward migration, no Black audiences, and no "segregated",
//    "gate" or "entrance" in the stand she took (the beat says only that she would not fly if
//    the crowd was split). Also withheld now, because the blind reader quoted each one:
//    "barbershop" and "manicurist" (she has a small table in a shop and works on people's
//    hands); "night school" and the phrase that she learned a language in order to be taught to
//    fly (evening classes, and the beat gives the reason as living there); the nine-mile walk
//    ("a long walk"); the ten-month course finished in seven ("most of a year", "months
//    early"); the seven-months-ago framing of the license ("a year before"); the word
//    "international" and the federation that issued the license; and the named war (her
//    brothers were "soldiers overseas"). Every one of these stays in biographicalFacts, and the
//    bridge still names her race, both firsts and the segregated gate.
//  Left inferable on purpose (do not describe beats 0-5 as fully race-free): beat 1 says the
//    second refusal was about something she could not go home and fix, beat 3 says the school
//    abroad had "only one reason this time", and beat 5 has promoters wanting the crowd split.
//    A reader can infer her race from those three. They stay because the double refusal and
//    the stand she took ARE the episode. Do not add another implicit marker, and do not let
//    any of the explicit words back in.
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
    "Bessie Coleman was born January 26, 1892, in Atlanta, Texas, one of thirteen children of sharecroppers (sources differ on her birth order); her father, who was part Cherokee, left the family when she was a girl, and she picked cotton and took in laundry through childhood. She managed one term of college before the money ran out. Around 1915, at twenty-three, she joined the Great Migration to Chicago, where she worked as a manicurist at the White Sox Barber Shop. Her brothers came home from the First World War with stories of France; one teased that women there could fly airplanes and she never would. She resolved to fly. Every American flight school she approached refused her — aviation schools admitted neither women nor Black students — and no American aviator would teach her privately. Robert S. Abbott, publisher of the Chicago Defender, urged her to train in France, where attitudes toward women in aviation were less closed. She took night classes in French at a Berlitz school while working, moved to a better-paying job managing a chili parlor at Thirty-fifth and Indiana to save faster, attracted modest backing from Abbott and the banker Jesse Binga, and sailed for France on November 20, 1920, at twenty-eight. One French school rejected her because she was a woman; the Caudron Brothers' School of Aviation at Le Crotoy accepted her. She trained through the winter on a fragile biplane of wood and fabric that failed often, walked roughly nine miles to the airfield and nine miles back each day because that was the only lodging she could afford, saw a fellow student killed in a crash during her training, and completed the ten-month course in seven months, learning in a language she had studied expressly for the purpose. On June 15, 1921, at twenty-nine, she received her license from the Fédération Aéronautique Internationale — the first Black woman and the first woman of Native American descent ever licensed to fly, and the earliest known Black person to earn an international pilot's license. She took a further advanced course in France and returned to the United States in September 1921 to press attention. She barnstormed to huge crowds as \"Queen Bess,\" flying loops, figure eights and near-ground dips; she lectured on aviation to Black audiences in churches, schools and theaters; and she hoped to found a flying school for Black aviators, which never opened. She refused to perform at events with segregated entrances — in Waxahachie, Texas, she would not fly until the promoters agreed that Black and white spectators would enter through the same gate. In 1990 Chicago renamed Old Mannheim Road at O'Hare International Airport in her honor as Bessie Coleman Drive. She died in an air accident on April 30, 1926, while preparing for a show.",
  sources: [
    "Rich, Doris L. Queen Bess: Daredevil Aviator (Washington: Smithsonian Institution Press, 1993), Chapters 1-3.",
    "Smithsonian National Air and Space Museum, \"Bessie Coleman\" biographical materials.",
    "Borden, Louise, and Mary Kay Kroeger. Fly High! The Story of Bessie Coleman (New York: Margaret K. McElderry Books, 2001).",
    "Texas State Historical Association, Handbook of Texas Online, \"Coleman, Bessie\" (tshaonline.org).",
    "Chicago Department of Aviation, \"Chicago Department of Aviation Honors Aviation Pioneer Bessie Coleman\" (chicago.gov, July 30, 2021).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The field-work childhood, the move to the city, the shop table where she worked on people's hands, and a brother's teasing that women overseas could fly are documented; sources differ on her birth order among thirteen children, so the beat says only one of thirteen. Her reaction to the teasing is interpretive, not a sourced moment. The table's place in the corner of the shop and the age at which the field work started are minimal staging around documented facts, not sourced details. Withheld for anonymity (second pass, after a blind reader named her): her race, the region, the cotton, the northward migration, the barbershop and the word manicurist, and the war her brothers served in — all kept in biographicalFacts, and the bridge names her race.",
      text: `There was a young woman with a small table in the corner of a shop. She worked on people's hands all day.

She had grown up a long way from that city, in a poor farming family, one of thirteen children. She was out in the fields as soon as she was big enough to be useful. She got herself to the city on her own, and this was the work she found.

Her brothers had been soldiers overseas. They came home with stories. One of them liked to tease her with a particular one. Over there, he said, women flew. She never would.

He meant it as a joke.

Something in her stood up and never sat back down. That. That was the thing. She was going to fly.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The blanket refusals by American flight schools — for her sex and for her race — and the fact that no aviator would train her privately are documented. She was twenty-seven or twenty-eight when the refusals came. Withheld for anonymity: that the second refusal was racial, and that the schools were her own country's; the beat says only that there were reasons under the first one that nobody wrote down.",
      text: `Finding a flight school turned out to be easy. There were plenty.

Getting into one was another matter. She wrote. She asked. She showed up in person. The answer came back the same from every direction, sometimes politely, sometimes not.

No women.

And under that, other reasons. Nobody put those in writing. Nobody had to. They were about her, about what she was, and there was nothing she could go home and fix. She could not even hire a teacher privately. No pilot would take her money.

It wasn't one closed door. It was worse than that. There were no doors at all. Everyone had agreed, long before she was born, that a woman like her did not fly.

She was in her late twenties, working on people's hands ten hours a day, in love with a thing she had never once touched.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The newspaperman's advice to train abroad, the language classes she took in the evenings, the better-paying restaurant job taken to save faster, and the saved wages are documented. His advice is paraphrased here, not quoted. Withheld for anonymity: the country, the language, the paper he published and the readers he spoke for; the beat also stops short of the exact phrase that named her — that she learned a foreign language at night school in order to be taught to fly.",
      text: `A man she knew, who ran a newspaper, told her the plain thing. The schools here would never take her. The schools over there might.

Over there. Across the ocean. Where women flew.

There was one problem. Over there they did not speak her language, and she did not speak theirs.

So she found classes in the evenings. After ten hours at the table she sat down and studied, night after night, month after month.

She saved every wage she could. She took a better-paying job running a small restaurant so the money would come faster.

If nobody here would teach her, fine. She would change countries. She was not going to change her mind.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The crossing at twenty-eight, the first school abroad refusing her for being a woman, the acceptance at the second, the long daily walk to the airfield, the wood-and-fabric biplane that failed often, a fellow student killed in a crash during her training, and finishing the ten-month course in seven — all documented. Withheld for anonymity: the country, the school names, the nine-mile figure and the ten-in-seven figure, given here as a long walk and a course finished months early; that she flew again the very next morning after the crash is dramatized continuation, not a dated record.",
      text: `At twenty-eight she boarded a ship alone and crossed the ocean.

The first school she asked over there turned her down too. Only one reason this time. She was a woman. Even that country had its locks.

The second school said yes.

Then came the hard part. Months of training, through the winter, in a language that was not hers. A long walk out to the field in the morning and the same walk back. Machines of wood and cloth that quit in the air. One day another student went down and died. She went up the next morning, and every morning after.

The course was meant to take most of a year. She finished it months early.

Nobody was cheering. It was just her, a cold field, a language she was still learning, and the one thing she had crossed an ocean to get.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The June 1921 license, the advanced course she took afterward, and the press attention when she returned home that September are documented, as are the evening language classes and the November 1920 crossing this beat looks back on. Withheld for anonymity: the firsts the license represented and the body that issued it, the word international, the seven-months figure (given here as a year before), and the manicure table — the firsts are stated only in the bridge.",
      text: `On a June day the license came through.

Hers. With her name on it.

She had asked at home and been told no by everyone she asked. Every school. Every pilot who might have taught her privately. So she went where the answer was different, and she came back with the thing itself.

A year before, she had never been off the ground. She had learned all of it in a language she studied at night, in a country she had reached only that winter.

She stayed on a while and took a harder course. Then she sailed home.

This time the newspapers wanted to talk to her. The years at that little table were over. The young woman nobody at home would teach came off that ship a pilot, with the papers to prove it.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The show flying before large crowds (loops, figure eights and near-ground dips), the lectures recruiting her people into aviation, the flying school she hoped to found, and her refusal to fly where the audience was segregated (including the Texas standoff she won) are documented; her death is deliberately excluded. Withheld for anonymity: the crowd nickname and the fame wording; that the audiences she spoke to and the spectators the promoters wanted separated were Black; and the words segregated, gate and entrance — the beat says only that she would not fly if the crowd was split. All of it is in the bridge.",
      text: `She started flying in shows.

Crowds came out to watch her. She turned the plane through circles and figures in the air, then dropped low over the field. People looked up, and there she was.

She used the attention. She spoke wherever anyone would have her. Churches, schoolrooms, halls. She told young people who had been told no that the air was open to them too. She talked about starting a flying school of her own, so nobody would ever have to cross an ocean the way she had.

And she set terms. When the people running a show wanted to split the crowd up, she would not fly. All of them together, or no show. In one town they gave in.

She knew what a locked door cost. She would not have one standing in front of her own show.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Bessie Coleman.

She was the first Black woman ever licensed to fly. The first Native American woman too. Not one flight school in her own country would teach her. Crowds called her Queen Bess. She would not perform for a segregated gate. A road at Chicago's biggest airport carries her name today. None of that existed yet in the years when every school she wrote to said no.

Your life is not theirs. But a piece of this story may still sit beside you.

The wall around her wasn't just discouraging. It was unanimous. Her answer wasn't to argue with it. It was to study at night after ten-hour days and go find a door on the other side of the world.

You don't have to be let in yet to keep going. She wasn't, for a long time.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Hedwig Kiesler, Nov 9, 1914, Vienna; took machines apart from childhood; fled
//    a controlling marriage to an arms dealer, reinvented in Hollywood as "the most beautiful
//    woman in the world"; self-taught inventor (a drafting table in her house; inventing was her
//    evening hobby); 1940-41, with composer George Antheil, devised a frequency-hopping "Secret
//    Communication System" to make radio-guided torpedoes unjammable (player-piano-roll
//    synchronization concept); application filed Jun 10, 1941 under Hedy Kiesler Markey, US Pat.
//    2,292,387 granted Aug 11, 1942 (27); offered to the U.S. Navy free — rejected/shelved (the
//    jibe "What do you want to do, put a player piano in a torpedo?" comes through Antheil's
//    account, not a Navy record), and she was told her celebrity would serve the war better — she
//    sold war bonds (famously including a kisses-for-bonds drive; that stunt and the sums are
//    both deliberately kept out of the beats); the patent expired unused by her (the pre-1995
//    seventeen-year term ran out in 1959); film career declined through the 1950s,
//    last picture 1958; spread-spectrum concepts surfaced in Navy systems from the early 1960s
//    and underlie modern wireless (Wi-Fi, Bluetooth, GPS lineage — stated as ancestry, not sole
//    invention); recognition came late: EFF Pioneer Award 1997 ("It's about time" is widely
//    reported as her answer, secondary sources only), National Inventors Hall of Fame
//    posthumously 2014. d. Jan 19, 2000.
//  Interpretive: "they could not see the mind past the face." Grounded, and still the
//    engine of this stage, though the face itself is now kept out of beats 0-5 entirely. Also
//    interpretive: that the questions put to her always stayed small (a fair summary of her
//    press, not one documented exchange), and that she used the one door they left open on
//    purpose, knowing what it cost.
//  Avoid saying: don't name Lamarr / Vienna / Hollywood / the Navy / Antheil / the EFF / the
//    Inventors Hall of Fame before the bridge; no years, sums or organization names anywhere in
//    beats 0-5. A blind reader named her twice, so beats 0-5 now withhold BOTH halves of the
//    famous pairing, since either half plus the other is her. (a) The looks-based public career:
//    no face, no beauty, no movie star, no studio, no tagline, no fame superlative, and not the
//    interviewers asking about looks, husbands and clothes. The public life is given only as
//    work that used nothing of her mind. (b) The invention as a technical object: no radio, no
//    signal, no jamming, no torpedo, no frequency, not the words patent or invention, no account
//    of how it worked, no later spread into everyday machines, no idea that kept spreading. Also
//    withheld: her first husband's own trade in arms (in beat 0 he is only a rich man with
//    powerful friends whose guests talked about what armies needed); the free offer named as
//    such to a named service; war bonds, the kisses-for-bonds stunt and the sums; the
//    seventeen-year term; the collaborator's trade; the award-giver and the posthumous hall of
//    fame; and the three-word reply, left out entirely rather than paraphrased. What beats 0-5
//    keep: the two lives, the marriage she ran from and the dinners where the talk was of what
//    armies needed, the joint filing offered for nothing and refused with a joke, the redirect
//    to public appearances for the war, the drawer, the paper running out with no payment and no
//    use, the work falling away, the twenty-year lag, other people arriving at the same problem
//    later, the old paper reread with two names on it, and recognition half a century late with
//    more after her death. Do NOT claim she "invented Wi-Fi" (ancestry framing only); do NOT
//    claim the Navy's later frequency-hopping systems were taken from her patent; the beauty
//    stays out of the beats entirely and belongs to the bridge.
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
    "Hedy Lamarr was born Hedwig Eva Maria Kiesler on November 9, 1914, in Vienna. She had been taking machines apart since childhood. She escaped a stifling marriage to an Austrian arms dealer — dinner-table talk of weapons systems gave her an incidental education in munitions problems — and reinvented herself in Hollywood, where studio publicity crowned her \"the most beautiful woman in the world.\" Inventing was her private life: she kept a drafting table at home and worked on ideas in the evenings, from improved traffic lights to a bouillon-cube soft drink. In 1940-41, with the avant-garde composer George Antheil, she developed a \"Secret Communication System\": a radio guidance signal for torpedoes that hopped rapidly among frequencies in a pattern synchronized between transmitter and receiver — inspired partly by player-piano rolls — making the signal effectively impossible to jam. The application was filed on June 10, 1941 under her legal name Hedy Kiesler Markey; U.S. Patent 2,292,387 was granted on August 11, 1942, when she was twenty-seven, and the pair offered it to the U.S. Navy without payment. The Navy rejected and shelved it — the rejection is remembered through Antheil's account rather than any Navy record, as an evaluating officer asking, \"What do you want to do, put a player piano in a torpedo?\" — and Lamarr was told her celebrity would serve the war better in other ways; she threw herself into war-bond drives, in one famously selling kisses to raise millions. Under the seventeen-year patent term then in force, it expired in 1959 before she earned a cent from it, and it saw no use in the war. Her film career declined through the 1950s; her last picture was released in 1958. Frequency-hopping and related spread-spectrum techniques surfaced in Navy systems beginning in the early 1960s, developed by engineers who worked the problem independently, and became foundational to modern wireless communication — the lineage behind Wi-Fi, Bluetooth, and GPS. Recognition arrived a half-century late: the Electronic Frontier Foundation's Pioneer Award in 1997, which she is widely reported to have answered with \"It's about time,\" and posthumous induction into the National Inventors Hall of Fame in 2014. She died January 19, 2000.",
  sources: [
    "Rhodes, Richard. Hedy's Folly: The Life and Breakthrough Inventions of Hedy Lamarr (New York: Doubleday, 2011).",
    "U.S. Patent 2,292,387, \"Secret Communication System\" (Markey and Antheil; filed June 10, 1941, granted August 11, 1942).",
    "National Inventors Hall of Fame, \"Hedy Lamarr\" inductee materials (inducted 2014).",
    "The National WWII Museum, \"Hedy Lamarr's WWII Invention Helped Shape Modern Tech\" (New Orleans).",
    "Encyclopaedia Britannica, \"Hedy Lamarr.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The two lives, the work table at home, the habit of taking machines apart since childhood, and the first marriage to a rich man whose dinner guests talked about weapons are all documented. Withheld for anonymity: what her public work actually was, that she was paid for how she looked, and her husband's own trade in arms. A blind reader named her twice from the famous-face-plus-inventor pairing, so both halves of it now wait for the bridge, and the public life is given only as work that used nothing of her mind. No invented room detail and no invented dialogue.",
      text: `There was a woman with two lives.

In the public one, people knew who she was. What they paid her for had nothing to do with her mind. Strangers decided what she was the moment they saw her, and never revised it.

In the private one, she kept a work table in her house. After the day's work she sat at it and made things. She had been taking machines apart since she was small. Nobody paid her for that.

Years earlier she had been married to a rich man with powerful friends. She ran from that marriage. But she had sat through years of his dinners, listening to his guests talk about what armies needed and what kept going wrong.

She listened. She remembered.

Then the war came, and both lives met on one idea.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: the idea she worked out during the war, the friend who worked on it with her, both names on the filing, the offer made to the government for no payment, the refusal, and the redirect to public appearances for the war effort. The remembered joke at her expense survives only through her collaborator's later account, so it is summarized, never quoted. Withheld for anonymity: what the idea was, what it was for, the field it belonged to, how it worked, the word for the document they filed, which service turned it down, and the collaborator's trade. Any one of those, said plainly, hands the reader her name.",
      text: `Then she had an idea.

It came from both halves of her life. The years of listening at his table, and the years at her own. She saw a way around a problem the war had not solved. A friend worked on it with her. On paper, it worked.

They wrote it up, put both their names on it, and took it to the men who decided what got built. They asked for nothing in return. It was a gift.

Those men looked at the paper. Then they looked at the woman who had brought it.

A woman like her, in a room like that, talking about machines. Somebody made a joke. The joke is the part that got remembered.

It went into a drawer. And she was told where a woman like her could really help. Not with that. With her name.

The best thing her mind had ever made, waved off without a real reading.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: she threw herself into the war-effort tour they sent her on, appearing city after city in front of crowds. Withheld for anonymity: what she was raising, the famous stunt she used to raise it, and the sums, which are repeated often enough that any of them names her. That she used the one door they left open on purpose, and knew what it cost, is interpretive.",
      text: `She did the job they would give her, and she did it at full speed.

If her name was the only part of her they would take, she would use her name like a crowbar. Night after night she stood in front of rooms full of strangers and asked them to give what the war needed. They gave. It was the same war effort that had just decided her mind was not worth reading.

There was steel in that, and she knew it.

The paper stayed in its drawer. She did not beg anyone to look again. Some walls you do not argue with. You outlive them.

At her table, on the quiet nights, she kept making things. That part of her had never needed permission.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: the protection on the idea ran out with no payment to her and no use she ever learned of, and the work that had made her known thinned out and ended in her forties. Withheld for anonymity: how long that protection lasted, what the work was, and the three subjects interviewers actually pressed her on - her looks, her husbands, her clothes - since that list alone gives away the kind of fame she had. The line about small questions is a fair summary of her press, not one documented exchange.",
      text: `The war ended. The drawer stayed shut.

The paper ran out, the way those papers do. Not one payment. Not one use she ever heard about. The work she was paid for went on a while, then thinned out, then stopped. The world had one file for her, and the label on it never changed.

That was the long grind of it. Not one big rejection. Decades of a mind nobody looked at.

When people wanted to talk to her, they asked the same small questions they had always asked. Nobody asked what she thought about. Nobody asked what she had built.

She knew what she had made. That knowledge does not pay you, and it does not get printed anywhere. It also does not go away.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: about twenty years on, the same approach turned up in use and was built on, and later researchers went back to the filing and read her name there. Reputable sources disagree about whether those engineers reached it on their own or through a chain of contractor work that led back to the filing, so the beat claims neither copying nor credit - only that others arrived at it, built on it, and never asked her. Withheld for anonymity: the name of the method, how it works, what it is used for now, and the ordinary machines it ended up inside. That last picture is the most repeated version of her story and names her by itself. The beat deliberately makes no claim that her filing was copied or credited at the time.",
      text: `The world caught up to her about twenty years late.

Other people came at the same problem from their own direction and arrived where she had already been. They built on it. Other people built on that. Nobody asked her about any of it.

She lived to see it happen. She also lived to see that almost nobody knew where it had started.

Her work was out in the world. Her name was not.

That is a strange thing to carry. You are right in private and nowhere else.

Then somebody went back and read the old paper. There were two names on it. One of them belonged to a woman nobody had ever thought to ask. It had been sitting in the record the whole time. Nobody had thought to check.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: an honor from inside the technical world when she was in her eighties, roughly half a century late, and a further honor after her death. Withheld for anonymity: who gave the award, what the later honor was, and her famous short answer to it - that answer is quoted everywhere and names her on its own, so it is left out entirely rather than paraphrased. That she kept working through all of it is documented; the reading of what the waiting cost her is interpretive.",
      text: `The honors arrived when she was in her eighties.

People who did the kind of work she had done said in public, at last, that she had been right. It came far too late. It did not give her back the years she had spent being told she was wrong.

More came after she died. She never saw that part.

Here is what she was by then. A woman who had been right for fifty years with nobody agreeing, and who kept making things anyway. She did not stop when they put her idea in a drawer. She did not stop when the paper ran out. She did not stop when the questions stayed small.

That is not a happy ending. It is a real one.

She knew what she had made. She held on to that alone, for as long as it took.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Hedy Lamarr.

She was the movie star her studio sold as the most beautiful woman in the world. She was also an inventor. With the composer George Antheil, she worked out frequency hopping. Wi-Fi, Bluetooth and GPS all grew out of that idea. The Navy shelved it and told her to sell war bonds instead. The National Inventors Hall of Fame added her name fourteen years after she died. None of that had happened yet on the nights we just sat with her at her drafting table.

Your life is not theirs. But a piece of this story may still sit beside you.

The people with the power to say yes had already decided what she was. No good idea on paper was going to change that. She could not make them see her. She kept building anyway.

Being seen wrongly does not make you what they see. She wasn't what they saw either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Jan 7, 1891, Notasulga AL, raised in Eatonville FL — one of the first
//    incorporated all-Black towns, NOT provably the first (Brooklyn IL, inc. 1873, is older) —
//    her father John Hurston a mayor there (1897-99, 1912-16); mother Lucy died 1904 (Zora 13);
//    "jump at de sun" was her standing exhortation to her children in Dust Tracks, not a
//    deathbed charge; father remarried quickly, bitter conflict with stepmother, shuffled among
//    relatives; a decade of domestic work and drifting ("lost decade" 1904-1917), incl. maid to
//    the lead singer of a traveling Gilbert and Sullivan troupe; 1917 (26), Baltimore: Maryland
//    offered free public schooling to Black youth aged 6-20 (Boyd), so she declared herself born
//    in 1901 — sixteen — and enrolled at Morgan Academy; graduated 1918; Howard University,
//    paying her way as an evening manicurist (co-founded The Hilltop, first story "John Redding
//    Goes to Sea" in Stylus 1921, age 30); New York 1925, Barnard that autumn (34, its only
//    Black student and the first African American admitted, anthropology under Boas, B.A. 1928);
//    Southern folklore trips 1927-1932; Their Eyes Were Watching God 1937 (46), written in seven
//    weeks, divided first reception. She kept the ten-year deduction her whole life. d. Jan 28,
//    1960 (the late poverty, the unmarked grave, Alice Walker's 1973 grave-marking — the stone
//    reads "A GENIUS OF THE SOUTH" — and her March 1975 Ms. essay are bridge material, used
//    gently). No magazine contest brought her to New York; she was living there before the 1925
//    awards dinner, so that causal line was cut.
//  Interpretive: "she refused the arithmetic that said too late." Grounded.
//  Avoid saying: don't name Hurston / Eatonville / Baltimore / Howard / Barnard / Boas / Harlem
//    / Alice Walker / any book title before the bridge; never use "jump at de sun" in the beats
//    — it is her most famous line and hands the reveal away (indirect paraphrase only); don't
//    describe Their Eyes Were Watching God by its plot in beat 5 (a book described in all but
//    its title is still a reveal); no superlatives that name one institution ("the most famous
//    women's college in the country"); the age-shaving rendered as audacity, not fraud-shame;
//    the bleak ending handled in one honest, gentle bridge line (rediscovery is the point).
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
    "Zora Neale Hurston was born January 7, 1891, in Notasulga, Alabama, and raised in Eatonville, Florida, one of the first incorporated all-Black towns in America, where her father, John Hurston, served as mayor; she remembered her childhood there as a kingdom. Her mother, Lucy, who told her children to \"jump at de sun,\" died in 1904, when Zora was thirteen; her father remarried within months, and Zora's relationship with her stepmother collapsed into open conflict. She was passed among relatives, in and out of school, and spent more than a decade — roughly 1904 to 1917 — in domestic service and drifting jobs, including a stint as maid to the lead singer of a traveling Gilbert and Sullivan theater troupe. In 1917, at twenty-six, she was in Baltimore, where Maryland law provided free public schooling to Black youth aged six to twenty. She declared her birth year to be 1901 — making herself sixteen — and enrolled at Morgan Academy, the high-school division of Morgan College, graduating in 1918. She went on to Howard University, paying her way as a manicurist in the evenings; there she co-founded the student newspaper, The Hilltop, and published her first story, \"John Redding Goes to Sea,\" in the campus literary magazine Stylus in 1921, at thirty. She moved to New York City in 1925, at the height of the Harlem Renaissance, and that autumn entered Barnard College on a scholarship — its only Black student at the time, and the first African American admitted — studying anthropology under Franz Boas; she took her B.A. in 1928. She kept the ten-year deduction for the rest of her life. She became one of the central figures of the Harlem Renaissance, and from 1927 to 1932 she traveled the American South collecting Black folklore — tales, songs, sermons and sayings — which became the material of her books. Their Eyes Were Watching God, written in seven weeks in Haiti and published in 1937, when she was forty-six, drew a divided reception: many white reviewers praised it, while Richard Wright dismissed it and Alain Locke faulted it, and it later went out of print. She died January 28, 1960, in Fort Pierce, Florida, impoverished and dependent on public assistance, and was buried in an unmarked grave; in 1973 the writer Alice Walker found the grave and paid for a headstone naming her \"A Genius of the South,\" and her essay about the search, published in Ms. magazine in March 1975, began the revival that returned her books to print and made the novel one of the most widely read and taught in America.",
  sources: [
    "Boyd, Valerie. Wrapped in Rainbows: The Life of Zora Neale Hurston (New York: Scribner, 2003), Chapters 3-6.",
    "Hurston, Zora Neale. Dust Tracks on a Road (Philadelphia: J. B. Lippincott, 1942).",
    "Hemenway, Robert E. Zora Neale Hurston: A Literary Biography (Urbana: University of Illinois Press, 1977).",
    "Walker, Alice. \"In Search of Zora Neale Hurston,\" Ms. magazine, March 1975.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "Documented: her father's place in the town's leadership, her mother's death when she was thirteen, the fight with her stepmother, being passed among relatives and out of school, and the domestic work that followed. Her mother's advice is given in indirect speech only — the actual wording is her most famous line and would hand the reveal away.",
      text: `There was a girl who grew up in a small Southern town where the people in charge were Black, like her. Her father was one of them. She grew up loud and certain, because in that town there was no reason not to be.

Her mother believed in her past all reason. She told her children to reach for more than they could hold.

When the girl was thirteen, her mother died.

Her father remarried within months. The new wife and the fierce daughter could not be in a room together. The girl lost that fight. She was sent away and passed from one relative to the next, in and out of school and then just out.

That childhood was over. At the age when the other kids were finishing school, she was cleaning other people's houses.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Documented: roughly a decade of maid, cook and service work after she left school, including a traveling job mending costumes for a theater company, and her age when that decade ended. Her mother died when she was thirteen, so by twenty-six she had lived half her life without her. The year-by-year counting is a compression of those years, not a dated scene.",
      text: `The cleaning lasted ten years.

Maid work, cook work, waiting tables. Whatever a young Black woman with no diploma could get, which was not much. For a while she traveled with a theater company, mending costumes. Every night the performers got to be somebody. Every night she pressed their clothes.

The work was not the worst part. The counting was.

Twenty-two. Twenty-four. Twenty-six. Every year the number went up. Every year the life she was built for moved further out of reach. She wanted school. She wanted books. She had wanted them since she was small.

School was for the young. She was running out of young, with nothing to show for it.

A woman of twenty-six with no schooling did not start over. Everyone knew that.

Her mother had believed she would be somebody. Her mother had been dead for half her life.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Documented: the move to the city at twenty-six, the rule that made high school free for young people under twenty, the ten-year change to her stated birth year, and her enrollment. Her reasoning about who would check is inference from the thinness of small-town birth records, not a recorded thought.",
      text: `In the city where she had ended up, she learned one useful fact. The state paid for high school for any young person under twenty.

She was twenty-six.

Who was going to check? She had been born in a small town where records were thin. No piece of paper was going to call her a liar.

So she walked in and gave her birth year, minus ten. Sixteen, she said, with a straight face.

Then she sat down in a high school classroom, a grown woman among teenagers, too hungry to care how it looked.

She never gave the ten years back. For the rest of her life she was a decade younger on paper. The decade had been taken from her, so she took it back.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Documented: she finished high school in a year, paid her way through the next school by cleaning, waiting tables and doing nails in the evenings, and published her first story at thirty. That she stood out in the classroom is drawn from her biographers' accounts rather than one recorded scene.",
      text: `Starting school over as a grown woman is humbling. Paying your own way while you do it is grinding.

She worked while she studied. Cleaning. Waiting tables. Doing nails in the evenings. And she studied like someone eating after a famine.

The classroom that was supposed to be past her fit her exactly. She was quicker than the teenagers around her. Her teachers noticed fast.

One year, and she had her diploma. Then a university, still broke, still working nights.

And now writing. It had been under everything else the whole time. Stories. Her town, her people, the talk on the porches she grew up on. She started setting it down.

Her first story was printed when she was thirty. By her own count, she was just getting started.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Documented: the move north at thirty-four, the scholarship place at a college where she was the only Black student (sources also call her its first), the professor who took her on, and the subject she studied. The magazine contest that older tellings attach to the move is left out — she was already living in the city before it.",
      text: `The writing carried her north, to the city where the writers were. She arrived the way she arrived everywhere, like a parade of one.

Within the year a college took her in on a scholarship. She was the only Black student in the place. One of the professors took her on as his own student.

Think about the distance. Ten years of other people's floors. Sixteen again at twenty-six. Now she sat in classrooms at the top of the country. She studied the thing she had actually lived. The talk, the songs, the people of small towns like the one that raised her.

She was in her thirties by then. On paper she was still in her twenties.

Everyone else in those rooms had taken the normal road. She had made hers up, including the dates.

And the books were still ahead of her.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Documented: the years of collecting trips through the South, the books built out of them, her use of her own people's speech in her fiction, the novel published when she was forty-six, and its divided first reception. No title, place or person is named here; the reveal belongs to the bridge.",
      text: `She spent years on the road in the South, writing down what she heard.

The stories people told on porches. The songs. The jokes, the sermons, the sayings nobody thought to keep. She put them into books, and a whole world was saved that way.

Then she wrote her own books. She wrote them the way the people she came from actually talked. At the time, the fashion said clean it up or leave it out.

Her best one came out when she was in her forties. Plenty of the people who reviewed it did not understand what she had done. Some said so loudly.

They were wrong. It is read in classrooms all over the country now.

The woman who was too old for high school wrote a book people still hand to each other. She did it on the calendar she made up, out of the years she took back.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Zora Neale Hurston.

She wrote Their Eyes Were Watching God. She was one of the central figures of the Harlem Renaissance. She saved a great deal of Black Southern folklore that would otherwise be gone. She died poor, with her books out of print, and was buried in an unmarked grave. In 1973 the writer Alice Walker went looking for that grave. She paid for a stone naming her "A Genius of the South," and wrote about the search. The books came back into print. None of that had happened yet on the morning we just sat with her.

Your life is not theirs. But a piece of this story may still sit beside you.

The calendar said she had missed it. A decade gone, every door already shut. She decided the calendar was the thing that was wrong.

Behind is a number, not a verdict. She crossed hers out.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 21, 1838, Dunbar, Scotland; harsh religious father; Wisconsin farm from
//    11; self-taught inventor (early-rising machine etc., exhibited 1860); by 1866 a rising
//    industrial machinist/efficiency man at an Indianapolis carriage-parts works, on a management
//    track; early March 1867 (28) a tool slipped and pierced his right eye at the workbench; by
//    his own account the aqueous humor dripped on his hand, the sight failed within minutes, and
//    he murmured that the eye was gone, closed forever on all God's beauty; the left eye failed
//    in sympathy; weeks in a darkened room, uncertain he would ever see -- sources vary (~4 weeks
//    per the Indiana Historical Bureau marker and the Sierra Club biography, "weeks of agony" in
//    the Sierra Club chronology, ~6 in other tellings), so the prose says "weeks" and never a
//    number; friends, many of them children, read to him and brought him flowers; sight returned;
//    he resolved to "store my mind with the Lord's beauty" and quit industry; Sept 1, 1867 (29)
//    went by rail to Jeffersonville and began the ~1,000-mile walk, crossing the Ohio at
//    Louisville, to the Gulf of Mexico with a plant press, Burns, Milton and a New Testament;
//    several nights in a Savannah cemetery; malaria at the Gulf turned him from South America to
//    California; landed San Francisco late March 1868 and asked the quickest way out of town,
//    answering that he wanted to go anywhere that is wild; first entered Yosemite in 1868 (30),
//    returned 1869 and made his home there. Later: the wilderness essays, the Sierra Club (1892,
//    president until his death), three nights camping with Roosevelt in Yosemite (May 1903).
//    d. Dec 24, 1914.
//  Interpretive: "the darkness clarified what the daylight had been postponing." Grounded in his
//    own account ("God has to nearly kill us sometimes, to teach us lessons").
//  Avoid saying: don't name Muir / Yosemite / Indianapolis / the Sierra Club before the bridge;
//    keep the famous markers out of beats 0-5 as well -- no "thousand miles", no journal
//    inscription ("Earth-planet, Universe"), no granite-and-waterfall portrait of the valley or
//    its wall height, no answer of "anywhere that is wild", no fair exhibiting the boyhood
//    inventions, no club, no camping trip with a president (the club and the valley's name are
//    revealed in the bridge; the rest stays out of the entry); a blind-reader pass (2026-09-01)
//    softened five more signature lines -- the question he asked a stranger on landing ("the
//    quickest way out of the city"), the compass direction of the passage (no "far coast", no
//    "west"), and beat 5's fame markers (no "voice nobody had heard before", no "raw material"
//    or "treasure" phrasing of the argument, no founding of the organization, no country "kept
//    whole instead of cut"); those belong to the bridge now. A second blind pass (2026-09-02)
//    still named him from beats 0-5 -- the popular sketch was legible in the arc itself (a
//    self-taught mechanic blinded at work becomes a naturalist, walks an enormous distance,
//    lives for years in a western range, writes the books, organizes the movement), so the
//    whole shape is now told at the level of a human life: no trade named (a shop, his hands,
//    a bench), no tool and no eye named, no fluid in the palm and no sympathetic blindness,
//    no frontier, no boyhood inventions, no distance or direction or coast for the walk, no
//    plant press, no "high country" used as a place name, and beat 5 carrying only that he
//    learned the mountains, wrote what people read, asked that some land be left as it was,
//    and was still asking when he was old. The reach of the writing, the organization, the
//    rooms of power, the land that was saved and his own religious register now live in the
//    bridge only.
//    Don't claim the exact tool
//    (sources vary awl/file -- "a tool slipped"); don't claim the valley was read to him in the
//    darkened room (his own account names the readers, never what they read); don't say the 1903
//    camping trip caused Roosevelt's conservation record; don't give a week-count for the dark
//    room; don't assert what he taught himself, or who admired his machines, beyond "self-taught"
//    and "won notice" (the maths-from-borrowed-books detail is true but is not carried in
//    biographicalFacts); the religion kept light (one line of his own register at most).
const muir: FigureStageRow = {
  figureKey: "muir",
  displayName: "John Muir",
  birthYear: 1838,
  deathYear: 1914,
  stageId: "1867-1868-the-darkened-room",
  stageLabel: "The darkened room: the eye, the weeks in the dark, and the thousand-mile walk",
  ageMin: 28,
  ageMax: 30,
  themes: ["illness", "solitude", "self_invention"],
  antiThemes: [],
  shapeSentences: [
    "A tool slipped at his workbench and pierced his eye, and within hours he was blind in both — a man built on his hands and his sight, sitting in a darkened room not knowing if either would come back.",
    "For weeks in the dark he took inventory of his one life, and found that the successful path he'd been walking was not the one he wanted back.",
    "When his sight returned he quit the factory, shouldered a plant press, and walked a thousand miles toward the wild — into the life he actually meant.",
  ],
  facets: {
    emotionalCore:
      "Lying in the dark bargaining with fate — realizing that what he grieved losing wasn't the career everyone praised, but the wild world he'd kept postponing.",
    decisionShape:
      "Whether to return, sight restored, to the promising industrial path — or to treat the accident as the last warning and spend his eyes on what he actually loved.",
    triggerEvent:
      "A slipped tool pierced his right eye at the workbench, and his left eye went dark in sympathy — weeks in a blackened room, with no promise of recovery.",
    agencyState:
      "Blind and helpless for weeks, everything out of his control except the one decision that mattered: what he would do with his eyes if he ever got them back.",
  },
  biographicalFacts:
    "John Muir was born April 21, 1838, in Dunbar, Scotland, and raised from age eleven on a Wisconsin frontier farm under a harshly religious father. A gifted self-taught mechanic — his whittled inventions, including an \"early-rising machine\" that tipped the sleeper out of bed, won notice at the 1860 state fair — he seemed destined for industry, and by 1866 he was a rising machinist and efficiency expert at a carriage-parts factory in Indianapolis, on track for a partnership. In early March 1867, at twenty-eight, a tool he was using slipped and pierced his right eye at the workbench; by his own account the aqueous humor dripped on his hand, the sight failed within minutes, and he murmured that his right eye was gone, closed forever on all God's beauty. Within hours his left eye went blind in sympathetic reaction. He was confined to a darkened room, uncertain he would ever see again, while friends — many of them children — read to him and brought him handfuls of the flowers he liked best; sources put the confinement at roughly four to six weeks. As his sight gradually returned he resolved to be true to himself and, in his own later words, to \"store my mind with the Lord's beauty\"; he wrote to a friend that \"God has to nearly kill us sometimes, to teach us lessons.\" He quit industry for good. On September 1, 1867, at twenty-nine, he left Indianapolis by rail for Jeffersonville, crossed the Ohio River at Louisville and set out on a roughly thousand-mile walk to the Gulf of Mexico, carrying little more than a plant press, a change of underclothes, a New Testament, Burns's poems and Milton's Paradise Lost, with a journal inscribed \"John Muir, Earth-planet, Universe.\" He travelled with almost no money and slept rough, including several nights in a Savannah cemetery. A bout of malaria on the Gulf coast turned his plans from South America to California. Landing in San Francisco in late March 1868, he asked a passerby for the quickest way out of town and, asked where he wanted to go, answered that he wanted to go anywhere that is wild; he walked south and east across the state and first entered the Yosemite Valley — a glacier-cut trench whose granite walls stand some three thousand feet above its floor — that spring, returned in 1869, and made his home there. He became America's most influential voice for wilderness: the essays, the co-founding of the Sierra Club in 1892, which he led as president until his death, and the three nights he camped with President Theodore Roosevelt in Yosemite in May 1903, after which Roosevelt greatly expanded federal land protection. He died December 24, 1914.",
  sources: [
    "Muir, John. A Thousand-Mile Walk to the Gulf (Boston: Houghton Mifflin, 1916), ed. William Frederic Badé, Introduction and Chapter I.",
    "Badé, William Frederic. The Life and Letters of John Muir (Boston: Houghton Mifflin, 1923), Chapter V.",
    "Worster, Donald. A Passion for Nature: The Life of John Muir (New York: Oxford University Press, 2008), Chapters 4-5.",
    "Sierra Club, \"John Muir: A Brief Biography\" and \"John Muir Chronology.\"",
    "Indiana Historical Bureau, state historical marker: \"John Muir in Indianapolis.\"",
    "National Park Service, John Muir National Historic Site, \"John Muir and President Roosevelt.\"",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The hard farm childhood under a strict father, the self-teaching, his rise at the works and the partnership talk are documented; the someday framing of his postponed journey is editorial compression, not a plan he wrote down. Withheld for anonymity: the trade itself (the machinist, the efficiency man), the boyhood inventions that won him notice, and the frontier setting of the farm.",
      text: `There was a young man who was good with his hands. So good that it was becoming his whole life.

He'd grown up hard on a farm a long way from any town, worked dark to dark under a strict father. Whatever he wanted to know, he taught himself.

Now, at twenty-eight, he was doing well at a shop in a city. He was quick, and useful, and the owners had begun talking about making him a partner. A comfortable indoor life was building itself around him.

There was one other thing in him. A pull toward open country. Hills, water, growing things.

Someday he would go out into all of it, properly, for a long time. Someday. The work came first.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The early-spring injury at the bench, his own account that he believed the sight was gone for good and with it everything beautiful he had wanted to look at, the loss of the second eye within hours, and the weeks in a dark room with no promised recovery are documented; the evening hour and the question he turns over are dramatized texture. Withheld for anonymity: the tool and which eye it struck (sources differ on the tool), the fluid that ran into his hand, and the sympathetic mechanism that took the second eye.",
      text: `One evening in early spring he was working late when he was hurt at the bench. It took a second. It took the sight in one eye.

He knew straight away how bad it was. He thought of every beautiful thing he had ever wanted to look at. He believed he had looked at all of it for the last time.

Before the night was out, the other eye had gone dark too. He could not see at all.

He was put in a dark room. Nobody could promise him the light would come back.

He was twenty-eight. He was a man who had lived by his hands and his eyes. Week after week he lay there doing the only arithmetic he had left. If the light never comes back, what did I do with it while I had it?

The answer made him sicker than the injury. He had spent it indoors. The thing he loved most, he had kept for someday.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The friends — many of them children — who read to him in the dark and brought him flowers, his resolve while still blind to leave the trade and fill his mind with beauty, and his own later line about being nearly killed in order to learn a lesson are documented; his account never records what was read to him, so nothing he heard is named here. Withheld for anonymity: the religious register of his own two lines, which are paraphrased plainly here.",
      text: `Friends came and read to him in the dark. Some of them were children. They brought him handfuls of the flowers he liked best.

He lay there with his eyes covered and listened.

Somewhere in those weeks the decision quietly finished itself. If the light came back — if — he was not going to spend it indoors. He would go out into the country he loved and fill himself up with it. Then no darkness could ever empty him again.

He wrote later that sometimes a man has to be nearly killed before he learns the lesson. He had heard his.

Then the light started coming back, week by week.

He did not go back to the bench.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The autumn start on foot, the pack with a few books, the months of walking, the near-total lack of money, sleeping rough, the several nights in a graveyard and the hunger are documented; the one-sentence plan is editorial compression. Withheld for anonymity: the distance, the direction he walked, the coast the walk ended at, and the plant press he carried.",
      text: `That autumn he put a few things in a pack and left on foot. A few books, and not much else. No route, and no date to be back. He would go where the country was emptiest and keep going.

It was no stroll. He had almost no money. He slept in the open, in barns, once for several nights in a graveyard because it was the safest place around. He went hungry.

And he was happy. A kind of happy the shop had never once paid him.

He spent his days looking at everything that grew.

Week after week of walking, on faith that the accident had told him the truth.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The fever at the end of the walk that turned him away from the journey he had planned, the passage by boat, his leaving the port on foot as soon as he landed, the weeks of walking inland into the mountains that spring and the return the following year are documented; the line about the country he had been postponing is this entry's interpretation, not his words. Withheld for anonymity: the direction he sailed, the country and the range he walked into, and the question he asked a stranger on the street when he landed.",
      text: `At the end of the walk a hard fever caught him. And it bent the plan in the best possible direction.

The far-off rivers he had meant to reach were too much now for a body wrung out like that. But there was other empty country he could still get to. He went the rest of the way by boat.

He came ashore in a town and did not stay in it. He walked out and kept going.

For weeks he went inland. Then the ground began to climb, and he came up into mountains.

The man who had nearly lost the light was standing in the kind of country he had been postponing his whole life. Every step since the dark room had been correct.

He went back the next year, and then he stayed. Not just in that country. In the life.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The years living in the mountains, the writing that people read, and the rest of his life spent asking that wild land be left alone — said to people who decided its fate, and still being said when he was old — are documented; nothing here is claimed as caused by him. Names withheld. Withheld for anonymity: the reach and standing of the writing, the organization he helped found and led until his death, the men in power he made the case to, and the land that ended up protected — all of that is told in the bridge instead.",
      text: `He stayed up there for years. He came to know those mountains the way a scholar knows a subject — the water, the weather, the rock, the seasons.

Then he began writing down what he was seeing, and people read it. The man who had been good with his hands had turned into a man who was listened to.

He spent the rest of his life speaking up for that country. He asked people who had never seen it to leave some of it alone, and to hurry, because it was going fast. He was still asking when he was an old man.

He never got the safe indoor life back. He got a harder one, out in the weather, and it was his own.

None of that was in the plan he had at twenty-eight. It goes back to a dark room, and a man who finally heard what his own heart had been saying the whole time.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was John Muir.

People call him the father of the national parks. He wrote the books that taught America to protect wild country. He helped start the Sierra Club and led it until the day he died. The high country he walked into was Yosemite. None of it had happened yet on the evening a tool slipped and took the light.

Your life is not theirs. But a piece of this story may still sit beside you.

It took losing the light for him to see what he had been doing with it. He had been spending it on a life that was impressive and wasn't his. The dark didn't hand him anything new. It just made him stop postponing what was already true.

You don't have to know yet what this stretch is for. He didn't either, not while he was lying in it.`
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Nov 14, 1891, Alliston Ontario farm; WWI surgeon (Military Cross, for
//    attending the wounded under fire while wounded himself); July 1920 (28) opened a
//    practice in London, Ontario — 28 days before the first patient; first month's
//    earnings ~$4 (Bliss; not independently reachable online, so the beats say "wouldn't
//    have covered a pair of boots" rather than a figure); taught part-time at Western to
//    survive; engaged to Edith Roach (engaged before he went overseas — NO year is
//    established, so don't put one in; Bliss has the engagement strained through this
//    period and eventually broken); the night of Oct 30-31, 1920, preparing a pancreas
//    lecture, woke ~2am and wrote the famous 25-word idea note ("Diabetus" and
//    "glycosurea" both misspelled); took it to Prof. J. J. R. Macleod in Toronto, who was
//    openly skeptical of the unknown surgeon but eventually granted lab space, ten dogs,
//    and a student assistant — Charles Best, who won a coin toss with Clark Noble — for
//    summer 1921; Banting gave up the London practice for it (it ran July 1920 to May
//    1921); the experiments worked; Leonard Thompson (14) got the first injection Jan 11,
//    1922 (little effect) and Collip's purified extract Jan 23, 1922 (it worked); 1923
//    Nobel Prize — Banting was 32 at the award and is STILL the youngest
//    Physiology/Medicine laureate; he split his prize money with Best. d. Feb 21, 1941.
//  Interpretive: "the empty waiting room gave him the idea time" framing. Grounded.
//  Avoid saying: don't name Banting / insulin / diabetes / Toronto / the pancreas before the
//    bridge; keep the misspelled-note detail (unnamed disease); no dollar figures in beats
//    0-5, and the two most identifying facts — the youngest-laureate record and the
//    one-dollar patent — belong in the bridge only. A blind-reader pass (2026-08-27) cut
//    three textbook-recognizable details from the beats: the pre-insulin starvation diet, the
//    first patient's stated age, and the patent give-away framing ("no company could own it").
//    A second blind pass (2026-09-01) still named him from beats 0-5, so five more signature
//    lines were softened: the disease nickname ("the sugar sickness"), the wards of wasting
//    children, the blood-sugar readings (now "the numbers on its chart"), "its highest honor"
//    for the prize (now "honors"), and the last trace of the give-it-away line. Beats 0-5 now
//    say only that the disease had no treatment and that children died. A third blind pass
//    (2026-09-02) named him again, so that line went too: beat 1 now says only that nobody
//    could treat the illness, that the people who got it did not get better, and that many of
//    them were young. Beats 0-5 also now withhold: the number and species of the research
//    animals (was ten dogs; the beat says only "some animals"); the coin toss that picked
//    the assistant; the twenty-five-word length of the 2am note; the claim that nobody had
//    ever isolated the substance; the thirty-years-of-failed-experts line; the count of years
//    to the honors; the ward of children waking and asking for food; and the splitting of the
//    prize money with the assistant (only his documented anger that the young man was left
//    off stays). Don't put any of it back. What STAYS is the documented episode itself: the
//    empty practice, the 2am note with the misspelled disease name, the professor's refusals,
//    the one borrowed summer, the thing in the lab that recovered, the first patient who was
//    tried twice, and the people who lived after — the arc needs them.
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
    "Frederick Banting was born November 14, 1891, on a farm near Alliston, Ontario. He served as a battalion medical officer in the First World War and was awarded the Military Cross for attending wounded men under fire while wounded himself. He was engaged to Edith Roach. In July 1920, at twenty-eight, he opened a surgical practice in London, Ontario, on borrowed money; twenty-eight days passed before his first patient arrived, and his first month's earnings amounted to about four dollars. He took part-time work demonstrating at the University of Western Ontario to survive; the engagement was strained through this period and was eventually broken. On the night of October 30-31, 1920, preparing a lecture on the pancreas — reading recent journal articles on the subject — he woke around two in the morning and wrote a twenty-five-word idea note, misspelling as he went both the name of the disease and the word for sugar in the urine: ligate the pancreatic ducts of dogs so the digestive tissue degenerates, then isolate the internal secretion that controls sugar. Diabetes was then a death sentence; diagnosed children survived on starvation diets, rarely for long. Banting took the idea to J. J. R. Macleod, professor of physiology at the University of Toronto and an authority on carbohydrate metabolism. Macleod was openly skeptical — Banting was an unknown surgeon with no research training who had read little of the literature — but after repeated approaches granted him laboratory space for the summer of 1921, ten dogs, and a student assistant, Charles Best, who won a coin toss with a fellow student, Clark Noble, for the first stretch of the work. Banting gave up the London practice, which had run from July 1920 to May 1921, for it. The experiments succeeded, and the biochemist James Collip purified the extract for human use. Fourteen-year-old Leonard Thompson received the first injection on January 11, 1922, with little effect; a second injection of Collip's purified extract on January 23, 1922 worked, and over the months that followed the sugar-wasted children in the diabetic wards began to wake and live. Banting and Macleod received the 1923 Nobel Prize in Medicine — Banting was thirty-two at the award and remains the youngest laureate in Physiology or Medicine; furious that Best was passed over, he gave Best half his prize money. The patent for insulin was assigned to the University of Toronto for a symbolic dollar. Banting died of injuries after a plane crash on war service, February 21, 1941.",
  sources: [
    "Bliss, Michael. The Discovery of Insulin (Toronto: McClelland & Stewart, 1982), Chapters 2-5.",
    "Bliss, Michael. Banting: A Biography (Toronto: McClelland & Stewart, 1984).",
    "University of Toronto Libraries, \"The Discovery and Early Development of Insulin\" digital collection.",
    "The Nobel Foundation, \"The Nobel Prize in Physiology or Medicine 1923: Frederick G. Banting\" (nobelprize.org).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The war record and Military Cross, the July 1920 practice, the twenty-eight patient-less days, the near-zero first month, and the part-time demonstrating at the university are documented. The bell, the instruments and the neighbors noticing are ordinary-office texture.",
      text: `There was a young doctor sitting in an office nobody visited.

He had done everything right. Farm boy, medical school, then the war. He was decorated there for staying with wounded men under fire while wounded himself. He came home, borrowed money, and hung his name on a door in a new city.

And nobody came.

Day after day he sat among his instruments, listening for the bell. Twenty-eight days passed before his first patient. His first month's pay wouldn't have covered a pair of boots.

The neighbors could see the door nobody entered. He picked up part-time work at the local university, demonstrating for medical classes, so he could eat.

A decorated surgeon, not yet thirty, paid almost nothing to fill an hour of other men's lectures. That was the whole life, and it was getting worse by the month.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The failed practice, the borrowed money, the strained engagement, the assigned lecture he had to cram for, and the state of care for that illness are documented in Bliss. Calling that autumn the low point is editorial framing. Withheld for anonymity: the organ and the illness stay unnamed, and the beat no longer leads with children dying — it says only that there was no treatment and that many of the sick were young.",
      text: `The autumn was the low point. The practice was a confirmed failure — not slow, failed. He was living on borrowed money. The engagement he had come home to was under strain.

The part-time lecturing rubbed salt in it. He was handed topics he barely knew. He crammed journals the night before, like a student, so he could teach students.

One of those topics was a part of the body he barely understood, and an illness tied to it. Nobody could treat it. The people who got it did not get better, and many of them were young. Doctors could only watch.

He sat up late with the journals. A failed doctor, reading about an illness nobody could solve, for a lecture nobody would remember.

He went to bed defeated. At two in the morning his mind — still working the problem in the dark — woke him.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The 2am note, written in his own notebook with the name of the illness misspelled, and his decision to take it to a professor with a laboratory are documented. The weighing in the dark is editorial framing, not a recorded thought. Withheld for anonymity: the organ, the illness, the twenty-five-word length of the note, and the claim that the substance was one nobody had ever managed to isolate.",
      text: `He got up and wrote the idea down in his notebook. A few lines, no more.

A way — maybe — to get hold of the thing that could hold the illness back, and get it clean enough to use. He misspelled the name of the illness as he scribbled. He was not an expert. That was exactly the objection everyone would make.

But lying there in the dark he knew two things. The idea could be tested. And he had — this was the strange gift of failure — nothing else. No thriving practice to protect. No reputation to risk. An empty waiting room and a written-down idea.

So he took it to a man with a laboratory and a name that carried weight.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The professor's skepticism of the untrained unknown, the repeated approaches, the grudging grant of one summer with borrowed lab space, research animals and a single student assistant, and Banting giving up the London practice are all documented. The fly line is the narrator's, not a quote. Withheld for anonymity: the number and species of the research animals, the coin toss that picked the assistant, and how many years and how many better-trained men the problem had already defeated.",
      text: `The professor was not impressed.

Here was an unknown small-town surgeon proposing to solve a problem in one summer. No research training. Thin knowledge of the literature. Better-trained men had worked at this for years and gotten nowhere, and the professor knew every one of their failures. He explained, with the patience of a man swatting a fly, why this would likely be another.

The young doctor came back. And came back again. He had no standing, no polish, and no other plan. Under the farm-boy manner was a stubbornness the professor finally found easier to allow than to keep refusing.

Fine. One summer, while the professor traveled. Borrowed lab space. Some animals. One student to help.

It was scraps from the table. He gave up the practice and took the scraps.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The summer 1921 experiments and the first working extract, the chemist joining to purify it, the first patient's two January 1922 injections (the first with little effect, the second successful), and the recovery of other patients over the following months are documented. Withheld for anonymity: the species of the animal that recovered, the first patient's age, and the ward of children waking and asking for food; the beat keeps the sequence and drops the pictures that name the discovery.",
      text: `The summer was brutal. Heat, failed attempts, long days, two young men teaching themselves research by doing it.

And then, late in the summer, it worked. Something in that lab that had been dying got up and stayed up. The numbers on its chart came down. They tried it again. It held.

The failed doctor stood in the borrowed room, looking at numbers every expert had told him he would never see.

Months of careful work followed. A chemist joined them to get it clean enough for a person.

Then, that winter, a hospital, and a patient who had run out of time. The first try barely helped. They purified it further and tried again.

This time it took. Strength came back. In the months that followed, others who had been given up on began to come back.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The honors that came a few years later, his documented fury that his young assistant was passed over, and the lives saved afterward are documented. Not being thanked alone is editorial framing of that fury. Withheld for anonymity: the prize by name, the youngest-laureate record, the university, the patent handed over for a dollar, the count of years between the empty practice and the honors, and the splitting of the prize money with his assistant, which is a widely retold gesture.",
      text: `A few years after the empty waiting room, the same profession that had no use for him was handing him honors.

He stayed exactly who he was. The young man who had worked beside him all summer was left off, and he was angry about it, and he said so. He would not be thanked alone.

People who would have died from that illness grew up instead. They got whole lives out of one borrowed summer. And that summer came out of one bad autumn, one failed practice, and an idea written down at two in the morning. The man who wrote it down was someone the experts had seen no reason to take seriously.

He had sat in that room thinking his life was over. It was the room where it started.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Frederick Banting.

He discovered insulin — with Charles Best, in one borrowed summer — and turned diabetes from a childhood death sentence into something people live with. The Nobel came at thirty-two, and he is still the youngest person ever to win it in medicine. The patent went to the university for a single dollar, so the medicine would belong to everyone. None of that existed yet during the twenty-eight days he sat by the door, waiting for one patient.

Your life is not theirs. But a piece of this story may still sit beside you.

By every visible measure he was failing. The empty room. The debts. The shrugs from the people who mattered. But the failure had left him with open hours and nothing to protect, and the idea came to him in that stretch. He had to be stubborn enough to keep carrying it after he was told it would come to nothing.

You don't have to know what the empty stretch is for. He didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. April 21, 1816, Haworth parsonage; under five feet tall and severely short-
//    sighted; at 20 sent poems to poet laureate Robert Southey, whose March 1837 reply included
//    "Literature cannot be the business of a woman's life: & it ought not to be" (backstory to
//    this stage); years of governess/teaching work she hated; 1846 (30): the sisters'
//    pseudonymous Poems by Currer, Ellis and Acton Bell sold TWO copies; her first novel The
//    Professor was rejected by publisher after publisher through 1846-47; her father's cataract
//    operation in Manchester Aug 28, 1846 — she stayed about a month and began Jane Eyre while
//    he recovered in a darkened room; Emily's and Anne's novels were taken in 1847 on
//    unfavourable terms while hers kept coming back; in Aug 1847 Smith, Elder — rejecting The
//    Professor yet again — added an encouraging note asking for a longer work; she sent Jane
//    Eyre; published October 1847 (31) within weeks of acceptance; immediate sensation.
//    (Branwell's decline was in the house throughout — one soft line max; the Heger episode
//    excluded.) d. March 31, 1855.
//  Interpretive: "she kept writing into a unanimous no." Grounded.
//  Unsettled: reputable sources give both Oct 16 and Oct 19, 1847 for the publication day, so
//    the entry says only "October 1847" and no beat carries a date. George Smith's story of
//    reading the book through in a single Sunday could not be verified this pass and was cut
//    from beat 4.
//  Avoid saying: don't name Brontë / Jane Eyre / Currer Bell / Haworth / Southey before the
//    bridge; keep "the moors", "the hills" and "parsonage" out of beats 0-5 (parson's daughter
//    + moors + writing sisters identifies her instantly); never quote Jane Eyre itself in a
//    beat, and never describe its story (a governess book about a small, plain, poor girl who
//    asks to be treated as an equal names it as surely as the title does); don't say the other
//    writers were her sisters, don't number them, don't say the pen names were men's names;
//    leave the childhood miniature books out; don't give the number of copies the poems sold
//    (two) — that figure is the most quoted fact about this family; don't call the drinker her
//    brother or the family's great hope; don't say the father's operation was on his eyes and
//    don't name the city; don't put the crossed-out addresses of earlier publishers on the
//    parcel; no poet-laureate label, and no paraphrase of the "business of a woman's life"
//    sentence.
//  Withheld for anonymity (2026-09-02, blind-reader round 2): a blind reader still named her
//    from beats 0-5, so each identifying leg was blurred rather than the episode cut. Now
//    withheld: the sisters (they are "the others she wrote with"), the two-copies figure ("you
//    could have counted the copies sold on one hand"), the brother (an unnamed someone in the
//    house), the eye operation ("an operation"), the crossed-out-addresses parcel (a package
//    that had "obviously been somewhere else first"), the famous poet (an older writer everyone
//    had heard of) and his sentence, and beat 5's fame framing (biggest book of the year, in
//    print ever since). Kept: the printed book of poems almost nobody bought, the year of
//    refusals, the others being taken while hers came back, the drinking in the house, the
//    father's failing sight and the month in the darkened room, the letter that asked for a
//    longer book, the yes, and the two later novels.
//  Earlier pass (2026-09-01): beats 0-5 no longer say she was a clergyman's daughter, that the
//    poems went out under invented names to get around the treatment of women writers, what the
//    second novel was about, or that the publisher believed it was corresponding with a man.
const bronte_c: FigureStageRow = {
  figureKey: "bronte_c",
  displayName: "Charlotte Brontë",
  birthYear: 1816,
  deathYear: 1855,
  stageId: "1846-1847-two-copies",
  stageLabel: "Two copies sold: the flopped poems and the novel every publisher refused",
  ageMin: 29,
  ageMax: 31,
  themes: ["creative_dismissal", "social_constraint", "keep_going"],
  antiThemes: [],
  shapeSentences: [
    "The poet laureate had told her at twenty that literature could never be a woman's business, and at thirty the evidence agreed: the book of poems she and her sisters scraped to publish sold exactly two copies.",
    "Her first novel was refused by publisher after publisher for a year while she nursed her father and kept house in a parsonage full of trouble.",
    "She was thirty-one, rejected over and over and unknown to anyone, when one rejection arrived with a sentence of encouragement — and she answered it with the novel that made her immortal.",
  ],
  facets: {
    emotionalCore:
      "The compounding weight of a unanimous no — the great man's verdict, the two sold copies, the novel that kept coming back — pressing on a woman who had already given her twenties to work she hated and had nothing left but the writing.",
    decisionShape:
      "Whether to accept the world's repeated verdict on her writing and settle into governessing, or to finish the next book with the last one still homeless.",
    triggerEvent:
      "The poems she and her sisters paid to publish sold two copies, and her first novel began collecting rejections from publisher after publisher in the capital.",
    agencyState:
      "Poor, small and short-sighted, shut up in a remote parsonage nursing a father whose sight was failing — but she wrote every day, and postage for one more submission could always be found.",
  },
  biographicalFacts:
    "Charlotte Brontë was born April 21, 1816, and raised in the parsonage at Haworth on the Yorkshire moors, the eldest surviving daughter of the curate Patrick Brontë. Those who met her described her as very small — under five feet — and severely short-sighted. At twenty she sent samples of her poetry to Robert Southey, the poet laureate, whose reply of March 1837 contained the era's verdict in one sentence: \"Literature cannot be the business of a woman's life: & it ought not to be.\" She spent her twenties in work she hated — teaching and governessing in other people's houses — and wrote in the evenings at the family dining table after the household had gone quiet. In 1846, at thirty, she and her sisters Emily and Anne paid from their small legacies to publish Poems by Currer, Ellis and Acton Bell, under androgynous pseudonyms to dodge the prejudice against women writers. The book sold two copies. Undeterred, each sister wrote a novel; Charlotte's, The Professor, was rejected by publisher after publisher through 1846 and 1847, the parcel re-wrapped and re-sent so many times the brown paper carried the crossed-out addresses of previous refusals. Emily's Wuthering Heights and Anne's Agnes Grey were accepted in 1847 by the publisher Thomas Cautley Newby on distinctly unfavourable terms, while Charlotte's novel kept coming back. Her father was operated on for cataracts in Manchester on August 28, 1846; she stayed with him in rented lodgings for about a month while he recovered in a darkened room, and began Jane Eyre there. At home her brother Branwell was disintegrating into alcohol and opium. In August 1847 the firm of Smith, Elder returned The Professor with yet another no — but appended a note saying a longer, more vivid novel would receive careful attention. Jane Eyre was in their hands within weeks and published in October 1847, when she was thirty-one; the firm still believed it was corresponding with a man. It was an immediate sensation — the pseudonymous \"Currer Bell\" became the most talked-about author in England — and it has remained in print ever since. She published two more novels, Shirley and Villette, before her death on March 31, 1855.",
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
        "The remote household, the teaching and governess years she hated, her small stature and very poor eyesight, and the older writer's verdict at twenty (kept unnamed) are documented; the evening writing at the family table follows Gaskell's account of the household. Withheld for anonymity: her father's calling; that the writer she wrote to was the poet laureate — he is now only an older writer everyone had heard of; and the wording of his refusal, which names her even in paraphrase.",
      text: `There was a woman of thirty in a cold house at the end of a village road.

She was small, short-sighted and poor. She had spent her twenties teaching other people's children in other people's houses. She did the work well. She hated it.

She had been writing since she was a child. Poems and stories, in every hour she could steal. At the table at night, after the house went quiet.

Once, when she was twenty, she sent some of her poems to an older writer everyone had heard of. She asked him honestly. Is this any good? Should I try to live by it?

He wrote back kindly. He also told her the answer was no. Not as a living, and not for a woman.

She kept the letter. She kept writing.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The book of poems paid for out of their own small savings, its near-total failure to sell, the first novel's rejection round beginning, her father's failing sight and the drinking in the house — all documented. Withheld for anonymity: that the other writers were her sisters, that the book went out under invented names, and the exact number of copies sold; three writing sisters and the two-copies figure are the two most quoted facts about this family.",
      text: `At thirty she made her real bid.

She and the others she wrote with paid, out of their own small savings, to have a book of poems printed. Then they waited to see what the world would do with it.

Almost nothing happened.

In a whole year, in the whole country, you could have counted the copies sold on one hand. They'd have done better burying the money in the yard.

She took that in and doubled the bet. A novel. She wrote it, she polished it, she sent it to a publisher in the city.

It came back.

She sent it to the next one. It came back. And the next.

At home her father's sight was failing. Someone else in that house was drinking himself to pieces upstairs.

The letter. The book nobody bought. The novel that kept coming home. The verdict on her writing was unanimous. It was no.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Beginning the second novel in rented rooms in another town, during her father's month-long recovery in a darkened room, with the first novel still unsold — documented. Withheld for anonymity: what the operation was, what town it was in, and what the new book was about; describing that book names it as surely as the title would.",
      text: `Here is what she did while the first novel was still coming back. She started the second one.

Not after the first found a home. Not after somebody encouraged her. In the middle of the noes.

She wrote it in rented rooms in another town. She had taken her father there for an operation. She sat with him in a darkened room for a month while he healed.

That is where the new book started. She was writing it in the middle of everything. A father who could not see. A house going wrong. A first book nobody wanted.

If the world was going to keep saying no, it would have to say it to new work.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The year-plus rejection round, the re-used wrapper she could not afford to replace (Gaskell), the other writers' novels accepted on poor terms while hers came back, and the drinking at home — all documented; a quotation from the novel itself was removed in an earlier pass as unsupported. Withheld for anonymity: that the other writers were her sisters, that the drinker was her brother and the family's great hope, and the crossed-out addresses of earlier publishers on the parcel — that image is one of the best-known anecdotes about her.",
      text: `The first novel kept coming home.

Publisher after publisher, for more than a year. She could not afford new wrapping paper, so she used the same parcel again. Every new publisher opened a package that had obviously been somewhere else first.

Think about that for a second. She had to hand them the proof that other people had already said no.

At home things got worse. The drinking upstairs was past fixing now, and the house lived around it.

The others she wrote with found a publisher for their books, slowly and on bad terms. Hers alone kept coming back.

She finished the second novel with the first one still homeless. Two whole books now. Not one yes.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The letter that declined the first novel but said a longer work by the same hand would receive careful attention, the second novel posted within weeks, and the quick acceptance and publication that autumn — documented; the publisher's own Sunday-reading anecdote was cut in an earlier pass as unverified. Withheld for anonymity: the firm's name and city, that it believed it was corresponding with a man, and what the new novel was made of.",
      text: `Then came the rejection that changed everything.

A publishing house sent the first novel back with the usual no. But whoever wrote the letter had actually read the book. The letter said it was too short and too quiet for them. It also said the writing had real quality. It said a longer, fuller novel by the same hand would get careful attention.

Careful attention. After years of flat noes, someone had left a door open an inch.

She put the second novel in the post within weeks. The one she had started in that darkened room.

This time the answer was yes. They took it almost at once, and it was in shops soon after. They still had no idea who she was.

Years of no. It had only ever needed one yes.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The book's immediate success, the public guessing at who had written it, her reveal to the publisher, and the two later novels — documented, names withheld; the closing two lines are editorial. Withheld for anonymity: that the name on the cover read as a man's, the number of copies the poems sold, and the fame framing — the beat no longer says it was the biggest book of the year or that it has stayed in print ever since.",
      text: `The book landed hard.

Within weeks it was the thing people were reading and fighting about. Some loved it. Some were shocked by it. What nobody could do was ignore it. Strangers wanted to know who had written it, and nobody could tell them.

The person who wrote it was a woman in a cold house at the end of a village road.

When she finally told them who she was, they could hardly believe it. She was small and short-sighted. She had come from a village nobody had heard of. She had written the book everyone was arguing about.

She wrote two more books after that one. People kept reading her.

The poems had sold almost nothing. The novel was read everywhere. The same woman wrote both.

The difference was never her.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Charlotte Brontë.

The book was Jane Eyre. It was a sensation within weeks, under a made-up name, and it has stayed in print ever since. She published two more novels before she died at thirty-eight. None of that had happened yet in the year her poems sold two copies and her first novel kept coming home.

Your life is not theirs. But a piece of this story may still sit beside you.

The verdict on her work was unanimous for years. It came from important people, it was repeated often, and it sounded reasonable. It was also wrong. What carried her through wasn't a thicker skin. It was that she kept making the next thing while the last thing was still being refused. So when a door finally opened an inch, she had something ready to put through it.

You don't have to know how it ends to keep going. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 25, 1906, St. Petersburg; at 29 the USSR's most celebrated young composer;
//    Stalin attended his hit opera at the Bolshoi Jan 26, 1936, watching from the government box,
//    and left before the last act; Pravda's unsigned "Muddle Instead of Music" followed Jan 28 —
//    condemning the opera and warning it was "a game of clever ingenuity that may end very badly";
//    the opera was banned, critics recanted in print, denunciation meetings were held, his income
//    collapsed, acquaintances avoided him in public; he completed his Fourth Symphony anyway
//    (May 1936) but withdrew it before its Dec 11 premiere under pressure from the orchestra's
//    management and party officials — it waited until 1961; the Terror closed in — his patron
//    Marshal Tukhachevsky was shot June 12, 1937, relatives and colleagues vanished; Fifth Symphony
//    premiered Leningrad Nov 21, 1937 (31), Mravinsky conducting, weeping reported in the Largo and
//    an ovation well over half an hour; the "a Soviet artist's creative reply to just criticism"
//    formula appeared in the press under his name and restored him officially. d. Aug 9, 1975.
//  Interpretive: the double-speak reading of the Fifth (grief inside obedience) is the standard
//    scholarly reading but contested in degree — the beats state it as what audiences heard, which
//    is documented (the weeping), not as decoded intent.
//  Uncertain (hedged in facts and beats): whether he wrote the "creative reply" formula himself is
//    disputed, so beat 4 says only that he let the words stand; the packed-case / waiting-by-the-lift
//    image comes from his circle, but its best-attested telling (Lyubimov, via Wilson) belongs to the
//    1948 denunciation — so the beats keep it as waiting for a knock, never dated to a given night.
//  Avoid saying: don't name Shostakovich / Stalin / Pravda / the USSR explicitly before the
//    bridge ("the newspaper that spoke for the state," "the leader" keep it soft); no symphony
//    numbers or work counts before the bridge; the Terror rendered plainly, without atrocity detail.
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
      "Whether to fall silent, write only what the state asked for, or find a way to satisfy its demands on the surface while keeping the truth alive underneath.",
    triggerEvent:
      "The leader attended his opera, and two days later the state's newspaper condemned it — with a sentence warning that his games could end very badly.",
    agencyState:
      "He could not answer, could not leave, could not even premiere what he'd written — but the notes themselves could still carry more than the censors could parse.",
  },
  biographicalFacts:
    "Dmitri Shostakovich was born September 25, 1906, in St. Petersburg. By his late twenties he was the Soviet Union's most celebrated young composer; his opera Lady Macbeth of the Mtsensk District had run for two years to acclaim at home and abroad. On January 26, 1936, Stalin attended a performance at the Bolshoi Theatre, watching from the government box, and left before the final act. Two days later Pravda published an unsigned editorial, \"Muddle Instead of Music\" (later attributed to David Zaslavsky), condemning the opera as coarse, formalist noise and warning that it was \"a game of clever ingenuity that may end very badly.\" Performances fell away and the opera was banned; critics who had praised it recanted in print; composers' meetings were called at which colleagues denounced the opera and its composer; his commissions and performances collapsed, and his monthly earnings fell from as much as 12,000 rubles to as little as 2,000. Accounts collected from his circle describe friends and acquaintances avoiding him in public, some crossing the street rather than be seen greeting him. He completed his Fourth Symphony in May 1936 but withdrew it before its planned December 11 premiere in Leningrad, after pressure on him and on the orchestra from its management and from party officials; it was not performed until 1961, twenty-five years later. His daughter Galina was born in 1936; his wife was Nina Varzar, and his mother Sofia was still living. The Great Terror closed around him: his patron Marshal Mikhail Tukhachevsky was arrested and shot on June 12, 1937, and relatives, colleagues, and friends were imprisoned or executed. Members of his circle describe him living in expectation of arrest, with a case kept packed; the often-repeated image of him waiting at night on the landing by the lift so that an arrest would not wake his family is recorded by Yuri Lyubimov about the later 1948 denunciation, and the dating of these accounts is not firm. His Fifth Symphony premiered in Leningrad on November 21, 1937, conducted by Yevgeny Mravinsky, when he was thirty-one: listeners were reported to have wept during the Largo, and the ovation lasted well over half an hour. The work was framed publicly by the formula \"a Soviet artist's creative reply to just criticism\" — which appeared in the press under his name and which he did not disown, though whether he wrote it is disputed — and it officially rehabilitated him, while listeners then and since have heard in it the grief and fear of the years it came from. He remained in the Soviet Union, was denounced again in the Zhdanov decree of 1948, wrote fifteen symphonies and fifteen string quartets, and died August 9, 1975. Stalin died in 1953, twenty-two years before him.",
  sources: [
    "Fay, Laurel E. Shostakovich: A Life (New York: Oxford University Press, 2000), Chapters 5-6.",
    "Wilson, Elizabeth. Shostakovich: A Life Remembered, 2nd ed. (Princeton: Princeton University Press, 2006) — the collected first-hand accounts of his circle, including the packed case and the vigil by the lift.",
    "\"Muddle Instead of Music.\" Pravda, January 28, 1936.",
    "Volkov, Solomon, ed. Testimony: The Memoirs of Dmitri Shostakovich (New York: Harper & Row, 1979) — used with the standard caveats about its contested provenance.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "His standing at twenty-nine, the opera's two-year run at home and abroad, the leader's attendance from the government box and his exit before the last act, and the editorial two days later — all documented. Him watching the box more than the stage is dramatized texture.",
      text: `There was a young composer at the top of his world.

He was twenty-nine. In his huge country he was the young genius. His opera had been playing to full houses for two years. Prizes, photographs, the future of the nation's music: him.

It was a country where art mattered enormously, and where everything that mattered was watched. Music was expected to serve the state and please its leader. So far, his had.

One January evening the leader himself came to hear the famous opera. He sat in the box kept for the government. The composer was in the hall, watching that box more than the stage.

Partway through, the leader got up and left.

Two days later, the newspaper that spoke for the state printed its opinion of him.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The unsigned editorial and its \"may end very badly\" warning, the ban within weeks, the denunciation meetings, the collapse of his performances and income, and the accounts of acquaintances avoiding him in public — all documented. Nothing here is dated to a specific night.",
      text: `The article was short, unsigned, and everyone in the country understood exactly what it was.

His celebrated opera was muddle, it said. Coarse noise. Deliberate ugliness. A game — and here came the sentence that mattered — a game that may end very badly.

May end very badly. In his country, in those years, everyone knew what those words meant. People were beginning to vanish. A knock at the door, and gone.

The opera was banned within weeks. Colleagues who had toasted him stood up at meetings and denounced him, one by one, because refusing was dangerous. Friends stopped calling. Some crossed the street rather than be seen saying hello.

His work stopped being performed. His income collapsed.

He was twenty-nine, and in forty-eight hours he had become a man it was dangerous to know.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The Fourth completed in the spring of 1936, rehearsed, then withdrawn before its December premiere under pressure from the orchestra's management and party officials; the twenty-five-year wait; his wife, infant daughter and mother — all documented. That he worked every day is inference from the finished score.",
      text: `He kept composing. That was the first answer. Terrified, disgraced, he sat down every day and worked.

The symphony he finished that spring was enormous, wild, modern — everything the article had condemned. Rehearsals began.

Then it was suggested — in the way that country made suggestions — that he withdraw the work. Voluntarily, of course.

He withdrew it. He put the best thing he had ever made in a drawer, not knowing if anyone would ever hear it. It waited twenty-five years.

Cowardice? He had a wife, a baby daughter, a mother. Every artist he knew was doing the same math. The ones who refused it were disappearing.

He chose to live, and to find another way to tell the truth.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Tukhachevsky's arrest and execution in June 1937, the disappearance of relatives, colleagues and friends, and the composition of the Fifth inside that year — documented. Reading the work as obedient on its surface and grieving underneath is the standard scholarly account of what listeners heard, not a claim about his private intent.",
      text: `The terrible year deepened. His greatest protector — a marshal of the nation, a man of enormous power — was arrested and shot. Every knock could be the knock.

Inside that fear, he wrote a new symphony.

The state wanted simple, heroic, hopeful music — proof that he had corrected himself. Anything else could kill him. But he was a man drowning in grief and dread. Music that lied all the way through would be its own kind of death.

So he wrote a work that could hold both. Clear, strong, traditional on the surface: the obedient answer. And underneath, especially in the long slow movement, all the sorrow of that year. The vanished friends. The waiting. A whole country that officially had nothing to weep about.

Words can be checked. Notes keep a secret in plain sight.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The November 21 premiere in Leningrad, listeners weeping during the slow movement, the ovation of well over half an hour, and the official framing of the work as the artist's answer to criticism — documented. Saying the hall was full of people with their own vanished friends generalizes from the record of those years; it is not an account of that audience. Whether the 'creative reply to just criticism' formula was his own wording is disputed, so the beat says only that he let it stand.",
      text: `The premiere came on a November night, in the great hall of his home city. His career was on the program, and possibly his life.

The symphony began. The hall was full of people with their own vanished friends. They listened.

In the slow movement, people began to weep. Openly, in their seats, in a country where public grief about the times was itself dangerous. The music had said the thing nobody could say out loud. Everyone there understood it at once, and understood it could never be proven.

When it ended, the ovation would not stop. A quarter hour. A half hour, by most accounts. People stood and would not leave.

Officially, the evening went down as the artist correcting himself — his proper answer to fair criticism. He let the words stand. Let them have the words.

The hall had heard what the music actually said.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The Fifth's official rehabilitation of him, the second denunciation in 1948 and his survival of it, the fifteen symphonies and fifteen string quartets, his decision to remain in the Soviet Union, and outliving Stalin by twenty-two years — documented. Calling the quartets a private diary is editorial framing, not a claim he made. Still anonymous: no name, no work titles, no work counts.",
      text: `The symphony restored him. Officially a corrected man. Actually an uncorrected one who had learned to carry the truth through checkpoints.

He lived that double life for four more decades. The state denounced him again years later, and he survived that the same way. He kept writing. Symphony after symphony in the big halls. In the smaller rooms of chamber music, where the state listened less, he wrote quartets. They read like a private diary of his century.

He never left for good. He took the medals and the silencing both, and he outlived the leader by twenty-two years.

Today that leader's opinions about music are a footnote. The composer's work is played somewhere on earth almost every night. Audiences still hear in it what the first audience heard: how it feels when fear runs the world, and a person answers anyway.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was Dmitri Shostakovich.

The article was called "Muddle Instead of Music" and it ran in Pravda two days after Stalin walked out of his opera. The answer was the Fifth Symphony, premiered at the height of Stalin's Terror to half an hour of weeping ovation. He is now counted among the greatest composers of the twentieth century. None of that was safe or certain on the nights he sat up waiting for a knock at the door.

Your life is not theirs. But a piece of this story may still sit beside you.

He fell from the top of his world in forty-eight hours, by decree, with no appeal. He could not fight it out loud, and he would not disappear into it. So he found the narrow way through: keep working, meet the demands on the surface, and carry the truth inside the work.

Even when you can't say what's true out loud, you don't have to become the lie. He never did.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 23, 1926, Hamlet NC; a season of family deaths beginning Dec 1938, when he
//    was 12 (sources differ on the exact date of the father's death); heroin and alcohol through
//    his 20s sideman years; hired into Miles Davis's
//    quintet Oct 1955 — the big break — but the addiction deepened: nodding off on stage, pawning
//    horns; April 1957 (30) Davis fired him (Davis had beaten the same drug himself years before);
//    weeks later, at his mother's house in Philadelphia, he quit heroin and alcohol cold — days of
//    locked-room withdrawal with his wife and family bringing water; his own liner notes to A Love
//    Supreme (1965): "During the year 1957, I experienced, by the grace of God, a spiritual
//    awakening which was to lead me to a richer, fuller, more productive life"; July-Dec 1957 the
//    Thelonious Monk residency at the Five Spot; Blue Train recorded Sept 15, 1957; rejoined Davis
//    Dec 1957; Kind of Blue 1959, Giant Steps 1960, A Love Supreme recorded Dec 9, 1964. Died of
//    liver cancer July 17, 1967, at 40, ten years off heroin.
//  Interpretive: "the firing as the mercy that forced the choice." Grounded in his own account.
//    "That bandstand became his school" is the narrator's phrase for the Monk months, not a quote.
//  Avoid saying: don't name Coltrane / Miles / Monk / album titles before the bridge, and don't
//    describe any single record closely enough for a reader to name it; addiction in
//    the older-friend register — no glamor, no clinical language, no moralizing; the withdrawal
//    rendered brief and physical, not graphic, and never as something a reader should copy; God
//    kept to his own quoted framing (bridge only).
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
    "John Coltrane was born September 23, 1926, in Hamlet, North Carolina, and raised in High Point. When he was twelve, a season of deaths — his father, grandparents, an uncle — hollowed the family, and he grew up quiet and inward, practicing obsessively. Through his twenties he was a working saxophone sideman with a worsening heroin and alcohol habit, part of the epidemic that ran through the jazz world of that era. In the fall of 1955 Miles Davis hired him for his new quintet — the most coveted sideman chair in modern jazz and Coltrane's great break — but the addiction deepened alongside the acclaim: he nodded off on stage, showed up late or high, pawned his horns. In April 1957, at thirty, Davis fired him. Davis had beaten his own heroin addiction a few years earlier and knew exactly what he was watching. Within weeks, Coltrane went to his mother's house in Philadelphia and quit heroin and alcohol at once, cold — days of withdrawal in a closed room, drinking only water, with his wife Naima and his family keeping watch. He described what happened there in his own liner notes to A Love Supreme years later: \"During the year 1957, I experienced, by the grace of God, a spiritual awakening which was to lead me to a richer, fuller, more productive life.\" That summer and fall he served a legendary residency with Thelonious Monk at the Five Spot, which he later described as a musical education, recorded his breakthrough album Blue Train on September 15, 1957, and rejoined Davis that December. The next years produced Kind of Blue with Davis (1959), his own Giant Steps (1960), and on December 9, 1964, A Love Supreme, his devotional masterpiece — recorded clean; he stayed off heroin for the rest of his life. He died of liver cancer July 17, 1967, at forty.",
  sources: [
    "Porter, Lewis. John Coltrane: His Life and Music (Ann Arbor: University of Michigan Press, 1998), Chapters 8-10.",
    "Coltrane, John. Liner notes to A Love Supreme (Impulse!, 1965).",
    "Ratliff, Ben. Coltrane: The Story of a Sound (New York: Farrar, Straus and Giroux, 2007).",
    "Davis, Miles, with Quincy Troupe. Miles: The Autobiography (New York: Simon & Schuster, 1989).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The ten years of sideman work, the obsessive practicing, the 1955 hire into the era's top band, and the habit running alongside it — all documented. No scene, dialogue, or physical detail is invented.",
      text: `There was a horn player who had worked ten years for one seat.

He was quiet and serious, and he practiced more than anyone anybody knew. He practiced long after everybody else had packed up. He had come up the hard way — dance bands, bar bands, other people's sessions.

And he carried the other thing too. The drug. It was everywhere in his line of work. It was taking people down all around him. He had picked it up young, the way half his world had, and it had its hooks all the way in.

Then the call came. The most famous young bandleader in the music wanted him — the chair every horn player alive wanted.

He took it. People started coming just to hear him.

And the habit came along, right up onto the biggest stage in the art form.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The nodding off on stage, the late or high call times, the pawned horns, and the April 1957 firing — documented, and rendered without glamor. That the bandleader had beaten the same drug himself is documented. No dialogue is quoted, and the physical altercation some accounts describe is deliberately left out.",
      text: `The habit didn't care that he had made it.

He nodded off on stage. In front of people who had paid to hear the great band. He missed calls. He showed up late, or worse. He pawned his own horns when the need got loud enough.

The bandleader was no stranger to it. He had fought the same drug himself, years before, and beaten it. So he knew exactly what he was watching. He knew exactly where it ended.

One night in the spring, it came to a head. By the end of it he was out of the band.

He was thirty years old. Ten years of work to reach that chair. He had played himself out of it in a year and a half.

Nobody said he wasn't good enough. Everybody knew the real reason. That was the worst part.

There was nowhere in his world the story hadn't already traveled.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The cold-turkey decision at his mother's Philadelphia house weeks after the firing, the closed room, the water, and his wife and family keeping watch — documented in Porter. The last line is his own liner-note wording put into indirect speech. Nothing about the withdrawal beyond what the sources give.",
      text: `He went home to his mother's house.

A few weeks later he made the decision no one else could make. Not to cut down. Not to manage it. To stop — the drug and the drink both, all at once.

He went into a room and shut the door. He asked for water and nothing else.

Those days were as bad as those days are. The body fights. He stayed in the room. His wife and his family kept watch outside the door and brought the water.

He came out clean, and changed. Something happened to him in that room. He spent the rest of his life trying to describe it. Mostly he described it through the horn.

He said later it led him to a richer, fuller life.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The clean rebuild: the July-December 1957 nightly residency with the older master pianist, leading his own record dates that September, and the invitation back into the famous band that December — documented. 'That bandstand became his school' is the narrator's phrase, not a quotation from him.",
      text: `Clean was one thing. Rebuilding was another.

The music world had watched him fall. Now it watched to see if he would stay up. He answered with work.

That summer he joined the band of an older master. A strange, brilliant pianist. They played a long nightly run in a small club.

That bandstand became his school. The older man's music asked for things no other music asked for. Every night the newly clean horn player stretched to meet it. Musicians crowded in just to hear him grow.

The hours the habit used to take, the horn got now. He practiced with a hunger that scared people.

By fall he was leading his own record dates. By winter, the bandleader who had fired him wanted him back.

He went back. Clean, and twice the player he had been.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Rejoining the famous band in December 1957 and the run of landmark records that followed are documented. Titles, names, and any description close enough to identify one particular record are held for the bridge. That he stayed off the drug for the rest of his life is documented. How the music is described is editorial, not quoted.",
      text: `What came next, over the next few years, is one of the great runs in American music.

He made records with the famous band. He made records under his own name. People still play them.

Some of that music is quiet enough to sit with on a bad night. Some of it is hard enough that players take it on to prove something to themselves. He built a sound so personal you can name him in two notes.

The fired sideman was gone. In his place stood a leader. Younger players started copying him the way his own generation had copied the old masters.

And underneath all of it was the thing from the small room. A seriousness. A gratitude. A sense that every note was being handed to something larger than himself.

He never went back to the drug.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The record of thanks — recorded December 1964, seven years after the withdrawal, with his own written dedication — plus his standing, his influence, and his death at forty in 1967 after ten years off the drug: all documented. His name, the title, the dates, and his own words are held for the bridge, and the record itself is described only in general terms.",
      text: `Years later he made a record that was a thank-you. A long, plain thank-you for the rescue of his life.

He wrote the thanks out himself, in plain words. Thanks for the help he believed he had been given.

The records from those clean years became some of the most loved in American music.

He became one of the most important musicians of his century. His sound is copied on every continent. Players still study his work the way students study a hard book.

And rarer than any of that, he became an example. The story every struggling player knew by heart. The one who fell all the way down, stopped, and came back clean.

Nearly everything he is loved for came after that room.

He was forty when he died. He had been off the drug for ten years.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `His name was John Coltrane.

He became one of the most important musicians of the twentieth century. The record of thanks was A Love Supreme. He wrote the dedication himself. "During the year 1957, I experienced, by the grace of God, a spiritual awakening which was to lead me to a richer, fuller, more productive life." The bandleader who fired him was Miles Davis. None of that had happened yet on the spring day when he was thirty, fired, and out of road.

Your life is not theirs. But a piece of this story may still sit beside you.

The thing he could not control took the chance he had spent ten years earning. He did not fix it with willpower. He went home, shut a door, and got through one day, then the next.

You don't have to be past the worst of it to begin again. He wasn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. Sept 15, 1890, Torquay; April 1926 (35) her adored mother Clara died; Aug 1926
//    Archie Christie asked for a divorce (in love with Nancy Neele); Dec 3, 1926 (36), after a
//    quarrel, she kissed her sleeping daughter, drove off, and vanished for 11 days — the car
//    abandoned above a chalk quarry, a national manhunt (search numbers vary widely by account:
//    several hundred officers, some accounts over a thousand, plus thousands of volunteers — the
//    beats now leave the car and the numbers out entirely), found Dec 14 at the Harrogate hotel
//    registered under the surname of her husband's mistress; two doctors concluded a genuine
//    loss of memory and she never gave an account of those days (the beats state the facts and
//    her silence, and adopt NO theory — note she DID publicly cite loss of memory, so never say
//    she never spoke of it at all); parts of the press accused her of a publicity stunt; divorce
//    absolute Oct 1928 (38) and Archie remarried within weeks; autumn 1928, after a dinner-party
//    conversation about Baghdad and the express train, she took the Orient Express alone — her
//    first fully solo adventure; 1930 (39) met archaeologist Max Mallowan at the Ur dig (married
//    Sept 1930, a happy marriage to her death; sources give the age gap as 13 or 14 years, so
//    the facts say thirteen and the beats say only "years younger"); her greatest books and
//    world fame followed. d. 1976.
//  Interpretive: "the year that erased her, and the train where she began authoring herself
//    again." Grounded.
//  Avoid saying: don't name Christie / Poirot / the Orient Express / Harrogate before the
//    bridge. Blind readers have now named her twice from beats 0-5 alone (first the car, the
//    search, the hotel and the false name; then the woman writer plus the vanishing plus the
//    archaeologist husband), so this pass strips every remaining headline element. Beats 0-5
//    withhold: her craft (they never say she wrote, only "work of her own" that earned), the
//    car and the driving off, the eleven-day count, the search at any scale, the place names,
//    the hotel and the false name, the newspapers and the publicity-stunt accusation, the
//    train named or described as itself, the direction of travel, the desert, the digs and his
//    profession, the settings and titles of the books, and the sales. What beats 0-5 say: she
//    left the house one night after a quarrel, she was away for days, doctors found the loss
//    of memory genuine, she never gave an account of that time; strangers talked and some did
//    not believe her; that autumn she travelled alone for days to a country a long way off,
//    the first journey she ever made by herself; the man she later married was working out
//    there and was years younger than she was; her best work came in the decades after. The
//    doctors' finding and her lifelong silence STAY — they are the episode, not decoration on
//    it. The bridge restores the train, the titles, the eleven days and the sales; the car,
//    the hotel, the false name, the place names, his profession and the press are told nowhere
//    in the story now, only here. The disappearance is still rendered ONLY as documented fact
//    + her lifelong silence — no amnesia-vs-fugue-vs-revenge theorizing, no crisis
//    speculation, nothing self-harm-adjacent.
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
      "Grief and betrayal arriving in the same year — the mother who anchored her and the husband she trusted, both gone — and then eleven days that winter when she vanished, her doctors said, even from her own memory.",
    decisionShape:
      "Whether to rebuild a small careful life in the wreckage everyone was watching, or to get on a train alone toward places she'd never been and find out who she was without him.",
    triggerEvent:
      "Months after her mother's death, her husband told her he loved another woman and wanted a divorce.",
    agencyState:
      "Publicly humiliated, privately shattered, a single mother now — but solvent by her own pen, free by law, and holding a ticket no one had chosen for her.",
  },
  biographicalFacts:
    "Agatha Christie was born September 15, 1890, in Torquay, England. Her mother, Clara, encouraged her writing from childhood. She met Archibald Christie at a dance in 1912 and married him in 1914. By her mid-thirties she was a successful mystery novelist, married to Colonel Archibald Christie, with a young daughter, Rosalind, and a house in the country at Sunningdale; she was known to be shy and to dislike public attention. In April 1926 Clara — the closest attachment of her life — died; Agatha spent the following months sorting her childhood home in deep grief, largely alone. By her own account in her autobiography, Archie disliked illness and unhappiness of any kind, and he was mostly absent that summer. That August, Archie told her he was in love with Nancy Neele and wanted a divorce; she asked him to reconsider and he refused. On the night of December 3, 1926, after a quarrel, Agatha kissed her sleeping daughter, drove away, and vanished; her car was found abandoned above a chalk quarry at Newlands Corner. The disappearance became a national sensation — hundreds of police officers (some accounts say more than a thousand), thousands of volunteer searchers, and aircraft — until, eleven days later, on December 14, she was found at the Swan Hydropathic Hotel in Harrogate, registered under the name Teresa Neele, the surname of her husband's mistress. Two doctors concluded that she had suffered a genuine loss of memory; she cited that loss of memory publicly but never gave an account of those days, and her autobiography passes over them, so the truth of them is unrecoverable. Parts of the press accused her of staging the disappearance as a publicity stunt and objected to the cost of the search. She continued to write and publish through the divorce years. The divorce decree was made absolute in October 1928, when she was thirty-eight, and Archie married Nancy Neele within weeks. That autumn, after a dinner-party conversation about Baghdad and the great express train, she did something no one expected: she boarded the Orient Express alone — her first fully solo journey — bound ultimately for Baghdad and the archaeological digs of Mesopotamia, where she visited the excavation at Ur. By her own account she loved the journey. On a later visit to Ur, in 1930, she met the archaeologist Max Mallowan, thirteen years her junior; they married in September 1930 and remained married, happily by both accounts, until her death. She spent later seasons on his excavations, working on the finds and writing. The decades that followed produced her most celebrated work — including Murder on the Orient Express (1934) and the cases of her detectives Hercule Poirot and Miss Marple — and made her the best-selling novelist in history, with sales estimated at around two billion copies. She died January 12, 1976.",
  sources: [
    "Christie, Agatha. An Autobiography (London: Collins, 1977), Parts VI-VII.",
    "Morgan, Janet. Agatha Christie: A Biography (London: Collins, 1984), Chapters 7-9.",
    "The National Archives (UK), Surrey Constabulary records on the 1926 disappearance.",
    "Agatha Christie Limited, official biography, agathachristie.com/about-christie.",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The country house, the marriage (they met at a dance years before), the young daughter, her shyness, the work of her own that had begun to earn, and her mother's lifelong encouragement of it — all documented. No invented detail. Withheld for anonymity: what the work actually was; beats 0-5 never say she wrote, because a woman writer plus the winter that follows names her outright. The bridge restores the craft.",
      text: `There was a woman in her mid-thirties who seemed, from the outside, to have the complete life.

A house in the countryside. A husband she had met at a dance years before. A small daughter. And work of her own, done quietly at home, that had started to bring in money.

At the center of it, as it had been since she was small, was her mother. Her first believer. The one person who had always understood the strange way her mind worked, and made room for it.

She was shy. She was happier alone in a quiet room than at a party. She trusted her small circle completely: her mother, her husband, her child.

Within one year, that circle was torn through twice.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Her mother's death in the spring of 1926, the summer spent sorting the family house largely alone, her own recorded account of her husband's dislike of illness and trouble, his absence that summer, his late-summer request for a divorce, and her asking him to reconsider — all documented. No invented dialogue or texture.",
      text: `In the spring, her mother died.

The grief flattened her. She spent that summer alone in her mother's house, sorting a lifetime of belongings. Her husband stayed away. He hated illness and trouble of any kind, by her own account.

She thought that was the worst of it. Doing her grieving alone.

Then, at the end of the summer, he told her the actual worst. He had fallen in love with someone else. He wanted a divorce.

Her mother dead in the spring. Her marriage dead by summer, at the hands of the person she trusted most.

She asked him to stay. He would not.

The two losses ground against each other all autumn. Grief for her mother. Grief for a man who wasn't dead but was gone. And under both, the plain shame of being left.

That winter, carrying all of it alone, something in her gave way.`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "The disappearance rendered strictly as documented: the quarrel, the sleeping daughter, her leaving the house that night, the days she was away, her own public statement that she had lost her memory of them, the doctors' conclusion that the loss was genuine, and her never giving an account of that time. Withheld for anonymity: the car she drove off in, the eleven-day count, the search and its national scale, the place names, the hotel, the false name she registered under, and the distance from home — all documented, all too recognizable before the reveal. The beat tells it as her own lost stretch of time rather than as a public event, and it attributes the memory loss to her own telling and the doctors' finding rather than asserting it in the narrator's voice. NO theory of what happened is adopted.",
      text: `Then something happened that she never explained.

One night, after a quarrel, she went upstairs and kissed her sleeping daughter. Then she left the house.

She was away for days. When she came back, she said those days were gone from her. She could not say where she had been or what she had done.

Doctors saw her afterwards. They found that the loss of memory was real.

By her own telling, whatever that stretch of time had been, she did not have it. She never gave an account of those days, for the rest of her life.

She had buried her mother, lost her marriage, and briefly lost herself. Then she came back.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The public hostility and disbelief that met her return, the divorce becoming absolute when she was thirty-eight, his remarriage within weeks, her single motherhood, and her going on with her own paid work — documented. Withheld for anonymity: the newspapers, the accusation that she had staged it for publicity, and the national scale of the attention; the beat keeps only that strangers talked and some did not believe her. The closing question is the editorial through-line, not a quotation.",
      text: `Coming back was the hard part.

It got out, the way these things do. People who had never met her decided they knew what she had done. Some of them did not believe her. The shyest of women had the worst days of her life turned over by strangers. She had to keep living in front of them.

The divorce went through anyway. He married the other woman within weeks. She was thirty-eight. A single mother, talked about, still grieving her mother.

So she did the small things that survival is made of. She looked after her daughter. She managed the money. And she kept doing her own work, because it was hers and because it paid.

Slowly a question came up through the wreckage. She had gone from her mother's house straight to her husband's. Nobody had ever asked her this one.

What did she want?`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The dinner-party conversation about a far-off country, the autumn journey she made alone soon after the divorce, and her own recorded delight in it — documented, and it was the first journey she ever took by herself. The long hours and the stations are ordinary features of such a journey rather than recorded incidents. Withheld for anonymity: the famous train, the direction of travel, the desert, the excavations and the place names; the beat says only that she went alone to a country a long way off. The bridge restores the train.",
      text: `The answer arrived as a ticket.

At a dinner party, people talked about a country a long way off, and what it took to get there. Something in her sat up.

This was the first journey she had ever taken by herself.

That autumn, with the divorce papers barely dry, she went. No husband. No companion. No one to answer to. A woman traveling alone, days of it, farther from home than she had ever been.

She loved every mile of it. The long slow hours. The strange stations. The country at the end of it, which was nothing like the one she had left.

Grief had erased her. So had betrayal, and those blank days. Somewhere on that journey she started filling herself back in.

Nobody had chosen this for her. She had chosen it.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The second marriage (met on a later trip to the same country, a man years younger than she was, happy by both accounts until her death), the months she spent out there helping with his work while doing her own, and the decades of her best work that followed — documented. The daytime-and-night split of the two kinds of work is a plain rendering of the documented seasons spent working on the finds and writing, not a recorded schedule. Withheld for anonymity: his profession, the excavations and the finds, the settings and titles of the work, her sales standing, and the fact that it went on selling for generations; the becoming is told in human terms only.",
      text: `The journey gave her back more than herself.

On a later trip out to the same country she met a man who was working there, years younger than she was. She married him, and it held, happily, for the rest of her life. She went out with him for months at a time after that. She helped with his work in the daytime and did her own at night.

And her own work got better. The decades after the terrible year were the best of it. A lot of it came out of the places her second life took her.

She kept working for the rest of her life. It was hers. Nobody had given it to her.

The woman whose life fell apart at thirty-six spent the next fifty years building something no one could take from her.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Agatha Christie.

She is the best-selling novelist in history. Around two billion books. Poirot, Marple, and Murder on the Orient Express — set on the very train she boarded alone after her divorce. The eleven days she vanished in 1926 are still a famous mystery. She took the answer with her. None of that existed yet in the year she lost her mother and her husband within months of each other.

Your life is not theirs. But a piece of this story may still sit beside you.

Two people were holding up her world, and in one year both were gone — one to death, one to somebody else. For a while she lost even her own name. No one rescued her. She bought a ticket herself and went toward a life nobody had planned for her.

You don't have to know who you'll be on the other side of this. She didn't either.`,
    },
  ],
};

// Provenance (human-QA note; not script-enforced):
//  Documented: b. May 12, 1820; led the Scutari nursing mission 1854-56 (the national heroine,
//    "the Lady with the Lamp"); contracted "Crimean fever" May 1855 (later attributed to chronic
//    brucellosis); returned Aug 1856 (36) famous and depleted; from 1857 (37) intermittently
//    bedridden and depressed for decades — she regained the ability to walk by about 1870 but
//    never returned to ward nursing; refused the heroine's retirement: from her rooms she pressed
//    for the Royal Commission on the Health of the Army (appointed 1857), gave it evidence, and
//    wrote for it a report of more than eight hundred pages (printed 1858; page counts vary by
//    source); popularized — did NOT invent — the polar-area diagram to make mortality data
//    undeniable; wrote Notes on Nursing (1859, still in print); founded the Nightingale Training
//    School at St Thomas' (1860, age 40), described in reference sources as the first SECULAR
//    nursing school in the world; wrote thousands of letters driving reform for decades (counts
//    vary; the collected works run to sixteen volumes); first woman awarded the Order of Merit
//    (1907). d. Aug 13, 1910, aged 90.
//  Interpretive: CARE — this is the burnout anchor. The honest frame: the work she loved wrecked
//    her body; she could never go back to the front lines; and she discovered her greatest impact
//    in a slower, paced, seated form. The beats must NOT glorify pushing through — the "became" is
//    "she mattered differently," not "she worked harder."
//  Avoid saying: don't name Nightingale / Crimea / Scutari / "the Lady with the Lamp" before the
//    bridge — and that includes the lamp itself, the night rounds by lamplight, and the Order of
//    Merit by name. After the 2026-08-27 anonymity pass, beats 0-5 also hold back: the word
//    "nursing" for her calling, "the most famous woman in the country", the eight-hundred-page
//    count, the wedge-of-a-circle shape of the chart, the air/light/quiet/cleanliness contents
//    of the book, and "an honor never given a woman before". A blind reader still named her off
//    that draft, so the 2026-09-01 signature pass also holds back: the team of women she took to
//    the war hospital, the comparison of deaths from filth against deaths from wounds, the papers
//    and the word "saint", the book described as what caring for the sick is, the school framed
//    as training professionals instead of servants, and the chart set against the deaths from
//    fighting. A blind reader named her again, so the 2026-09-02 pass strips the whole war frame
//    and the chart from beats 0-5: no war, soldiers, army, generals, barracks, wards or hospital,
//    and no picture, chart or diagram of any kind, only something going badly wrong far from
//    home, the place they were sending the hurt, the men in charge, and plain numbers laid out so
//    a busy man could take them in at once. Also withheld now: the tasks that name the profession
//    (cleaning, feeding, sitting with the dying), the family's stated reason for refusing her,
//    the length of the report, what the book and the school were for, the hospital that housed
//    the school, hospital design and sanitation as such, the reach of the reform beyond her own
//    country, and her age at death. The bridge restores the profession, the charts-and-numbers
//    work and the Order of Merit; the rest simply stays out.
//    Don't call the school "the first professional nursing
//    school" (the sourced claim is "first secular"); don't call her the inventor of the polar-area
//    diagram or the founder of medical statistics; don't romanticize the 20-hour ward days
//    (they're what broke her); no medical diagnosis debates; the couch/bed decades rendered as
//    adaptation, not tragedy.
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
    "Florence Nightingale was born May 12, 1820, into a wealthy English family, and against ferocious family opposition made herself a nurse — the calling she described as her life's purpose. From 1854 to 1856, during the Crimean War, she led the nursing mission at the Scutari barrack hospital, working legendary hours amid catastrophic conditions; the newspapers made her the most famous woman in Britain, the \"Lady with the Lamp.\" The cost was physical: in May 1855 she contracted \"Crimean fever\" — later attributed by biographers to chronic brucellosis — and never fully recovered. She returned home in August 1856, at thirty-six, depleted, and from 1857, at thirty-seven, was intermittently bedridden for years with chronic exhaustion, pain, and depression; the tireless twenty-hour capacity that had defined her was gone for good. Her physical condition eased somewhat from about 1870, but she never returned to ward nursing and worked from her rooms for the rest of her life. She refused, however, to retire into invalidism as an ornament of the nation. Working from those rooms — often from a couch or bed, receiving one visitor at a time, rationing her strength — she pressed for the Royal Commission on the Health of the Army, appointed in 1857, gave evidence to it, and wrote for it a report of more than eight hundred pages, printed in 1858 (page counts vary slightly across sources). She popularized the polar-area diagram — a chart form she made famous rather than invented — to make preventable-death figures undeniable to politicians; wrote Notes on Nursing (1859), the founding text of modern nursing and still in print; and in 1860, at forty, founded the Nightingale Training School at St Thomas' Hospital, described in reference sources as the first secular nursing school in the world — largely without leaving her rooms. Over the following decades she wrote thousands of letters, steering hospital design, sanitation reform, and public health far beyond Britain; thousands survive and fill the sixteen volumes of her collected works. She was the first woman admitted to the Order of Merit (1907) and died August 13, 1910, at ninety.",
  sources: [
    "Bostridge, Mark. Florence Nightingale: The Woman and Her Legend (London: Viking, 2008), Chapters 15-18.",
    "Nightingale, Florence. Notes on Matters Affecting the Health, Efficiency and Hospital Administration of the British Army (1858).",
    "Nightingale, Florence. Notes on Nursing: What It Is, and What It Is Not (London: Harrison, 1859).",
    "McDonald, Lynn, ed. The Collected Works of Florence Nightingale, 16 vols. (Waterloo, ON: Wilfrid Laurier University Press, 2001-2012).",
    "Encyclopaedia Britannica, \"Florence Nightingale\" (accessed 2026).",
  ],
  beats: [
    // Beat 0 — Scene
    {
      kind: "narrative",
      role: "scene",
      sourceNotes:
        "The family's long opposition to her working at all, the journey far from home to the place the hurt were being sent, the filthy conditions killing people who should have lived, the legendary hours, the fever she caught there, and the fame that reached home ahead of her are all documented. Withheld for anonymity: the war and everything that marks it (the soldiers, the army, the party of women she took with her, the lamp and the night rounds), the profession by name, the tasks that would name it, the newspapers, the national scale of the fame, the family's stated reason, and the documented comparison between deaths from filth and deaths from wounds. The hours are rendered as cost, not glory, per provenance.",
      text: `There was a woman who had given one piece of work everything she had.

For years her family would not allow it. She fought them over it, year after year, and in the end she won.

Then, far from home, something went badly wrong, and she went to where they were sending the hurt. It was filthy past believing. People who should have lived were dying of it.

She worked like a woman possessed. Twenty-hour days, months on end. She did whatever the place needed, and it needed everything.

Word got home before she did. People who had never met her turned her into a story.

Somewhere in those years a fever got into her body and never fully left. She ignored it. There was no time.

There is always no time. Right up until the body decides otherwise.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "The return home depleted in 1856 and the collapse from 1857 into years of intermittent bedriddenness, with the old capacity gone for good, are documented. The pain and the absence of a cure or timeline stand in for the documented chronic exhaustion and pain; no diagnosis is named, and the quiet room is dramatized texture. Withheld for anonymity: that the people who wanted her back were a whole country wanting its heroine, and what the cause of her life actually was.",
      text: `She came home to people who wanted to celebrate her, and she could barely stand up.

Something was badly wrong. The tiredness did not lift with rest. Not weeks of rest, not months. Pain moved in and stayed. The engine that had run twenty-hour days for two years would not start anymore.

Within a year she was spending most of her days lying down. She was thirty-seven.

The doctors had nothing. No cure, no timeline. This was how she lived now.

Work was not what she did. It was what she was. She had defied her whole world for it.

Now people wanted the tireless woman from the stories back. The thing she had given her life to was finally within reach. And she could not reliably sit through a meeting.

So she lay in a quiet room and asked what every worn-out person asks. What am I, if I can't do it anymore?`,
    },
    // Beat 2 — Response
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Her refusal of ornamental invalidism, the retreat to her rooms, the rationed one-at-a-time interviews with ministers and army officers, and the shift from hands-on care to writing and statistics are documented. Withheld for anonymity: who the visitors were (ministers and generals), the soldiers and the barracks, and the wards she gave up; the beat says only that she stopped doing the work with her own hands.",
      text: `The answer she found was not the heroic one. It was better.

She stopped trying to be the woman she had been out there. The people still dying in places like that one needed her mind, not her death.

So she rebuilt the work around what was actually left.

She took rooms and rarely left them. Visitors came one at a time, and not for long. The men who ran things came to her.

She worked lying down when sitting was too much. She spent her strength only where nothing else would do.

No more doing it with her own hands. A pen, paper, and numbers.

From outside it looked like retirement. It was about to become the most useful part of her life.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "The inquiry she pressed for (the Royal Commission on the Health of the Army, appointed 1857), the evidence she gave it, and the very long report she wrote for it from her sickroom (printed 1858) are documented, as is her use of a chart to make preventable deaths undeniable to politicians. Withheld for anonymity: the army and the war, the page count, and the chart itself in every recognizable form, including that it was a picture at all, its shape, its month-by-month layout, and the comparison that made it famous; the beat says only that she laid the numbers out so a busy man could take them in at once. She popularized that form rather than inventing it, so no invention is claimed. That reforms followed is documented; the beat claims no specific fall in deaths, which the facts do not state.",
      text: `From that room, she went after the men in charge.

She pushed until the government opened a formal inquiry into why so many had died out there. Then she gave that inquiry its evidence. A report far longer than anyone wanted to read, written lying down, in whatever stretches her body allowed.

Men in power do not read long reports. So she took the same truth and made it small. Plain numbers, laid out so a busy man could see in one moment what he had been avoiding for years.

It worked. Real changes followed.

None of it felt like the old fire. Some days she managed an hour of work. Some days none. She missed her old self badly.

She did it anyway, at the pace her body set. The pace mattered less than the aim.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The small practical book (1859) and the training school founded in 1860 at forty, chosen, shaped and reviewed largely by letter and interview from her rooms, are documented, as is that she never went back to hands-on care. Withheld for anonymity: what the book and the school were for, the book's subject and its standing as the founding text of the profession, that it is still in print, the hospital that housed the school, and the school's standing (reference sources call it the first secular nursing school in the world). The bridge restores the profession; the rest simply stays out.",
      text: `Then, at forty, still working from her rooms, she built the two things that outlived everything else.

First, a small book. Plain, sharp, practical. What she had learned, in language anyone could follow.

Second, she started a school, so that people could be properly trained for the work instead of picking it up by luck. She chose where it would sit, shaped its rules, and reviewed every detail by letter and interview.

She could not walk its halls. She never really would. She built it anyway, from a bed, one letter at a time.

Her students went out and trained others, and those students trained more still. Thousands of hands doing what her two could no longer do.

That was what she was, without the engine. Still her. Differently shaped, and bigger.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "The decades of letter-driven reform from her rooms, the ministers and officials who sought her advice, the honor given near the end of her life, and the great length of that life are documented; the award is left unnamed here and its first-for-a-woman distinction is held back for the bridge reveal. Withheld for anonymity: that the places she redesigned were hospitals, the sanitation and public-health language, the reach of that work far beyond her own country, and her exact age at death. Adaptation framing per provenance: she mattered differently, she did not simply work harder.",
      text: `She lived another fifty years, and worked through most of them at her rationed pace.

From her rooms, by letter, she kept changing how that work was done everywhere it was done. How the places were built. How they were run. Who was allowed to do it. Dull questions. They decided who lived.

Officials came to her for advice. Thousands of letters, decade after decade, each written inside that day's allowance of strength.

She never got the old body back. She never went back to doing the work with her hands. The version of her the stories loved had ended at thirty-six.

The version that mattered more kept working for decades after that. Near the end, they honored her for the work. Almost all of it had been done from those rooms.

She did her best work at a fraction of her old power. It was still more than enough.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Her name was Florence Nightingale.

The Lady with the Lamp. She founded modern nursing. She was among the first to use charts and numbers to force governments to stop preventable deaths, and the first woman ever given the Order of Merit. What the legend leaves out is when she did it. Nearly all of the work that mattered came after her health collapsed at thirty-six, from her rooms, at a fraction of her old strength. None of it had happened yet on the morning she came home spent.

Your life is not theirs. But a piece of this story may still sit beside you.

The engine she had built her whole self on burned out and never came back. She had to learn, in grief, that she was not the engine. She was the aim.

You don't have to be able to do what you used to do. She couldn't either.`,
    },
  ],
};

export const FIGURE_STAGES: FigureStageRow[] = [douglass, butler, lee, rogers, child, lewis, jones, rudolph, angelou, rachmaninoff, oconnor, marshall, allende, wilson, wang, chandler, graham, mcclintock, rustin, sanders, berlin_i, charles_r, sullivan_a, fitzgerald_e, poitier, simone, andersen, tallchief, lindgren, lewis_e, kovalevskaya, hughes, shelley_m, bly, faraday, carver, ramanujan, anning, owens, yeats, coleman, lamarr, hurston, muir, banting, bronte_c, shostakovich, coltrane, christie, nightingale];
