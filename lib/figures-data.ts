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
        "Arrived NYC Sept 4, 1838 (one day after escape Sept 3). Lispenard Street boarding house = David Ruggles. Borrowed Seamen's Protection Certificate per Douglass's Life and Times.",
      text: `The papers scratched beneath his shirt.

He had folded them twice and tucked them flat against his skin, but they would not disappear. They said his name was William. They said he was a free Black sailor. They had carried him through Baltimore, onto the train, past men who could have stopped him with one hand.

Now they lay against his ribs in a room on Lispenard Street.

Outside, New York went on without knowing him. Carts in the street. Oyster calls. Boots on the boards below. Inside: a chair, a small bed, a Bible, bread paid for by David Ruggles from money gathered for fugitives like him.

For four days, no one had owned him.

He did not yet know what that meant.

He stayed indoors. He listened before crossing the room. He kept his voice low when someone came to the door. He was twenty, or twenty-one; even that had been kept from him. His mother had died before she could give him the full shape of his own beginning.

The name he had been born with still belonged to the place behind him. The name ahead of him had not arrived.

So he sat in the chair. The city brightened at the window. The papers warmed under his shirt.

He had escaped.

He had not yet become anyone.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Anna's arrival date Sept 11, 1838. Ruggles' physical resistance to slavecatchers documented in Mirror of Liberty and McFeely Ch. 4 (deliberately not date-pinned in the prose).",
      text: `The boots stopped at the door.

He held very still. The chair did not creak. The papers did not shift against his skin.

The boots moved on.

He had been told that men came for fugitives in New York. Ruggles himself had been seized in his own street by a band who said they had a warrant. He had gotten free of them. Frederick was not certain he could.

He had written to Anna in Baltimore. He did not know if the letter had reached her. He did not know if it could have. A free Black woman crossing from Baltimore alone could be stopped at a platform, questioned at a dock, delayed by one suspicious hand on her sleeve.

He thought of her in the chair beside him.

He thought of her on a road somewhere between here and the slave state, alone.

He thought of her not coming.

The light moved across the floor. He did not move with it.`,
    },
    // Beat 2 — Response: marriage and the move to New Bedford
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Marriage Sept 15, 1838, Pennington officiated, Ruggles witnessed. Anna's calico-dress detail per Life and Times.",
      text: `They were married before noon. The Reverend James Pennington came up from the back of the house and said the words. There were no rings. Anna had a calico dress and the new bonnet she had bought herself in Baltimore. Ruggles signed the certificate. Anna's name was now Anna Bailey, then Anna Johnson by the end of the week, and later, Anna Douglass.

Before the week was over, they left New York. The steamer to Newport, the stagecoach over the salt marshes, the smell of fish and tar coming up off the wharves of New Bedford. The town did not know him. He took work caulking ships, and the white shipwrights refused to work alongside him, so he took day labor where he could find it — sweeping, hauling, splitting wood for a winter that was already cold.

He had a wife and a name and a port he had never seen.

He had nothing else.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Liberator subscription 1839 within first months per Narrative. Nathan Johnson named him Douglass after the chieftain in The Lady of the Lake. AME Zion church on Second Street, New Bedford — well documented (licensed to preach there 1839).",
      text: `The mallet sounded different from one ship to another.

He learned this in his first year. Caulking was filling the seams between planks with oakum and pitch so that the sea would not come through. He could not be hired by the white shipwrights — they had told the master who hired him that they would walk off the job — so he took whatever loose work the wharves had. Hauling sails. Splitting cordwood. Sweeping a printer's office on Saturdays in exchange for the back issues of newspapers no one had bought.

He read the Liberator every week. Mr. Garrison printed a column of names — the list of men who held other men in bondage. The list did not have the master's name on it. Frederick wrote nothing.

Nathan Johnson had given him the name Douglass, after a chieftain in a poem by Walter Scott. Frederick said the name aloud in the chair at night, the way a man tries on a coat in private before he goes out in it.

Anna had two children in those years. They were free, both of them, and they were the first people Frederick had ever known whose names had not been chosen for them by someone who owned them.

He went to a small church on Second Street where Black men spoke. He stood up sometimes and said a few sentences about what slavery had been to him. The congregation knew what he was saying. The white town did not.

Three years passed in this way.

He was twenty-three.`,
    },
    // Beat 4 — Turning point: standing up at Nantucket
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Nantucket convention dated Aug 11–12, 1841. Garrison's \"thing, piece of property, or man\" line is from his subsequent Liberator report; widely quoted, though phrasing across sources varies slightly.",
      text: `The pine floor under his boots. The slat of the bench in front of him. The thinness of his own breath as he stood up.

He had not spoken to white people about himself before. Not from his own body. Not without permission. The faces in the hall went quiet by rows, the way water goes still at the edges first.

His voice came thin. He said the name of a master. He said what a beating had been. He said what it had been to read in secret while a child watched the door. His hands sweated against the back of the bench in front of him. He spoke for perhaps fifteen minutes. He sat down.

William Lloyd Garrison stood up immediately after. Garrison said: "Have we been listening to a thing, a piece of property, or a man?"

The hall said: "A man! A man!"

Before the evening was over, the Massachusetts Anti-Slavery Society offered him a paid position as a lecturer. The hand that signed the paper was his own.

He had worn the name Douglass for less than three years. He had owned no name before that at all.

When he stepped down, men he had never met reached for his hand. He gave it.`,
    },
    // Beat 5 — What he became
    {
      kind: "narrative",
      role: "became",
      text: `He left Nantucket with a paid position and a circuit to ride. He was, by the end of the year, speaking three or four nights a week in Massachusetts and Connecticut and Vermont. Some halls would not let a Black speaker in; some let him in but not the audience; sometimes the doors were locked from the inside and he spoke in fields. He kept speaking.

Anna stayed in New Bedford with the children. He sent money home. He did not yet write the Narrative. That book was four years in front of him and would force him into another exile. The man who would write it was not yet finished being made, and he knew it.

What he was, by the end of 1841, was a voice. He had not been one before. He had been work, and a borrowed name, and a body that could be carried back. The voice had been in him the whole time. He had not known it could be heard.

He kept speaking.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Frederick was four days free when he sat in that chair on Lispenard Street. He could not yet say his name. He had nothing to plan with.

You wrote: "{feeling}"

He stayed in the chair. He did not know that Anna was on her way. He did not know that the voice he would become known for was already in him and would not need to be made; only listened for. The chair did not ask him to be anyone. The room did not ask him to know the answer.

So he sat. The city brightened at the window. The papers warmed under his shirt.`,
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
        "Pre-dawn writing per Butler's \"Positive Obsession\" essay. The string of jobs (potato chip plant, telemarketing, food delivery, dishwashing) is documented across multiple Butler interviews and Canavan's biography. Living with her mother in Pasadena through the early–mid 1970s is well-established.",
      text: `The kitchen table had a wobble in one leg.

She had wedged a folded receipt under the leg some months ago. The wobble had come back. She wrote against the wobble at four in the morning, while her mother slept in the next room, by the light of a kitchen bulb that did not reach the corners.

She was twenty-seven. She lived with her mother in Pasadena and had not been able to move out. There had been a string of jobs — a potato chip plant, telemarketing, food delivery, dishwashing — and she could no longer remember which one was current. They were the same job, in the way that they all ended at midnight or began before the sun. They paid for the typewriter ribbon and the postage and the photocopies of the manuscript she was sending out, and they did not pay for anything else.

The page in front of her was a novel she had not yet titled. She had finished one before it. That one had not sold. She had begun this one without a contract, without an agent, on the same kitchen table, in the small hours.

She had been doing this since she was twelve.

Beside her, a stack of brown envelopes from publishing houses. She did not open them when she came home. She opened them later, when she had room in her head for what they would say.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "\"Two dollars an hour\" softened — Butler said \"minimum wage\" or \"$1.65–$2/hour\" in different interviews; California minimum was $2.00 in 1974. The conveyor-belt comment is Butler's own anecdote, retold in interviews.",
      text: `The brown envelope on the table on a Sunday morning.

The letter inside said the things they always said. There was nothing to learn from it that she had not learned from twenty letters before it. They liked her sentences. They could not see the audience. They had no place for the kind of book she was writing.

She put the letter down and went to make coffee.

She came back to the table and sat down.

She had finished a novel and started another and finished that one and started another. The third novel was on the table now. She had a job that paid her two dollars an hour, and at the job she had recently been told that she sorted slowly because she watched the line as if there were something on it. She had been told this in front of the other women.

She thought about the women who had laughed.

She thought about the editor who had written the letter.

She thought about the kitchen table and the bulb that did not reach the corners.

She was twenty-seven, and she had been writing every morning before work for fifteen years, and she had not yet held a published copy of one of her own books.

She put her hand on the typewriter.`,
    },
    // Beat 2 — Response: she kept writing
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Butler's affirmation practice — writing aspirational future-self sentences in her commonplace books — is well-documented. Pre-1976 work documented; exact 1974–75 phrasing not preserved verbatim, so the prose captures the practice without quoting a reconstructed sentence.",
      text: `She kept writing.

She walked to the corner store and bought a pack of typewriter paper. She walked back. She sat at the kitchen table.

Some weeks later she opened a notebook and wrote a future in capital letters, the kind of sentence she could not yet believe.

She did not need to believe it. She needed only to be the kind of person who wrote it down.

She kept the day job. She kept the morning hour. She kept opening the brown envelopes when she had the room for them.

The third novel was almost finished.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      text: `The third novel had a title now. She called it Patternmaster.

She finished it on the kitchen table, by the kitchen bulb, in the small hours, on the same wobbling leg. She made photocopies. She mailed them to several houses she had heard would read unagented science fiction by women. She paid the postage out of grocery money.

She kept writing in the morning. Not Patternmaster anymore — there was no more Patternmaster left to write. Something new. She did not know what it was yet.

Two months passed. She heard nothing.

Three months passed. She heard nothing. The factory job ended. She got a different one — telemarketing — that she liked better because she could write at a desk during slow hours. The slow hours were rare.

Four months passed. She heard nothing.

She kept writing the new thing in the morning. The new thing was not very good yet. She kept writing.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "Sharon Jarvis at Doubleday acquired Patternmaster in 1975 — verified. Advance of $1,750 — Butler's own figure in interviews. Phone-call detail (her mother's hallway, time of day) is plausible texture but not directly cited.",
      text: `The phone in her mother's hallway rang on a weekday afternoon.

She had come home from telemarketing an hour before. The voice on the other end belonged to Sharon Jarvis, an editor at Doubleday. The voice said that Doubleday wanted to publish Patternmaster. The voice said the advance would be one thousand seven hundred and fifty dollars.

She held the receiver in both hands.

She did not cry. She did not sit down. She said the things she had to say to keep the call going, and then she said the things she had to say to end it, and then she went into the kitchen and stood by the stove for a long time.

It was the first money anyone had paid her for a novel.

She picked up a notebook and wrote the fact of the sale down as if the page needed to learn it before she did.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Four novels by end of decade = Patternmaster (1976), Mind of My Mind (1977), Survivor (1978), Kindred (1979). Stopped taking shifts after Kindred per Butler's own account.",
      text: `Patternmaster came out the following year. She kept the day job. The book did not make her rich; it did not make her known. It made her, briefly, a writer with one book in print — a small thing in the world, and a different thing inside her body.

She wrote the next one. She wrote the one after that. By the end of the decade she had four novels in print and an income from Doubleday that finally let her stop taking shifts.

The future she had written toward did not arrive all at once. The bestseller did not arrive for fifteen more years. What arrived first was the work — the morning hour, the kitchen table, the wobbling leg, the bulb that still did not reach the corners.

She kept writing in the morning.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Octavia was twenty-seven, in a kitchen in Pasadena, opening brown envelopes by the light of a bulb that did not reach the corners. She had been writing for fifteen years and had never seen one of her novels in print.

You wrote: "{feeling}"

The thing she did, on the morning after the worst rejection, was buy more typewriter paper. She did not know yet that the next manuscript would sell. She did not need to know. The morning at the table was hers either way. The bulb still lit what she put in front of it.`,
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
        "George Glessner Jr. died May 1, 1929 of pneumonia at age 47 — verifiable. John Jacob Glessner died 1936 at 93 — verifiable. Glessner family interred at Graceland Cemetery, Chicago — verifiable. Frances tutored at home, not permitted college — verifiable per Goldfarb.",
      text: `The desk in the library was made of black walnut and had been her brother George's.

She sat at it on a Tuesday in May. Telegrams had come for two weeks. There were forty-three of them. She had answered six.

She was fifty-one. Her brother had died at forty-seven, of pneumonia, on the first of the month. Her father was eighty-six and would die in seven years; she did not yet know that. What she knew, that Tuesday in May, was that the brother who had been allowed to attend Harvard, who had inherited the family company with their father, who had introduced her years before to a Harvard medical man named George Magrath who studied how dead people died — that brother was now under eight feet of soil in Graceland Cemetery, and the money that had been his was now hers.

She had been married to a corporate lawyer for sixteen years. She had been divorced from him for fifteen. She had three children, all grown. She had a town house in Chicago and a summer estate in New Hampshire called The Rocks. She had a great deal of mahogany furniture she had not chosen.

She had wanted, since she was a girl, to study how dead people died.

She had not been allowed.`,
    },
    // Beat 1 — Dark moment
    {
      kind: "narrative",
      role: "dark_moment",
      sourceNotes:
        "Magrath as Harvard classmate of George Glessner Jr. — verifiable. Magrath researched chains of evidence and toxicology — verifiable. Specific letter at end-of-second-week is dramatized; correspondence between Magrath and Lee continued for decades. The library-at-age-17 scene is composite/atmospheric — Frances's exclusion from college is well-documented but the specific moment is dramatized.",
      text: `The letter she could not bring herself to open had come from Magrath at the end of the second week.

It was a personal note. He had written about George, who had been his classmate. He had written about a paper he was working on, on the chain of evidence in poisoning cases. He had written, in a sentence she could see through the closed envelope before she had opened it, that he wished her well in this terrible time, and that he hoped she would still find time, when the dust settled, to take an interest in the work they had spoken of in younger years.

She put the envelope in a drawer.

She sat at the walnut desk and did not move.

She had been seventeen when her father had told her, in this same library, that she would not be going to college. Her brother, three years behind her, would later go to Harvard. The reasons, her father had said, were good ones. He had loved her. She had not argued.

She had been twenty when she had married Blewett Lee. The reasons had also been good ones. She had not argued then either.

She had been thirty-six when she had divorced him, and that time she had argued.

What she had wanted, the entire time, was to learn how to read a body. Why people died the way they did. How a man on the morgue table could be made to tell what had happened to him. She had bought books about it. She had corresponded with Magrath about it for thirty years.

She was fifty-one.

She was running out of decades.`,
    },
    // Beat 2 — Response: she wrote back to Magrath
    {
      kind: "narrative",
      role: "response",
      sourceNotes:
        "Boston visit ~Oct 1929. Lee did travel to Boston multiple times beginning shortly after George's death. Magrath as first chair holder of the new department — verifiable.",
      text: `She wrote back to Magrath that night.

The letter was brief. It said she would like to come to Boston when he had a free week. It said she had been thinking about what they had spoken of, years before, and what it would take to make it real. It said she would pay for whatever it took.

She traveled to Boston in October. She and Magrath met at his office at the Suffolk County morgue. She wore a dark wool coat. She watched him work for an afternoon. She asked him questions about chains of custody and tissue preservation and the difference between a coroner and a medical examiner. He answered all of them.

Before she left Boston, she had committed to funding a Department of Legal Medicine at Harvard, the first of its kind in the United States, with a chair to be named for him.

The papers were drawn up over the next two years.

She was fifty-one when she made the decision and fifty-three when the chair was first filled.`,
    },
    // Beat 3 — Struggle
    {
      kind: "narrative",
      role: "struggle",
      sourceNotes:
        "Harvard's initial reluctance is well-documented (per Goldfarb Ch. 8). Two-year negotiation period — approximate; the formal department was established 1931 with continued endowment additions through 1934. Magrath Library named for him at Lee's insistence — verifiable.",
      text: `The first response from Harvard was politely worded and unenthusiastic.

The medical school did not, the dean wrote, see a need for a Department of Legal Medicine. The work could be handled, when it arose, by the existing faculty. The funds she was offering were generous and would be welcomed elsewhere — perhaps in pathology, where there was already an established program.

She wrote back. She offered more money. She suggested specific terms for how the chair would operate. She named Magrath as the first holder.

The negotiations took a year. They took another. She traveled to Boston four times. She had meetings with men who were polite and who did not look directly at her when they spoke to her about money.

She did not raise her voice. She did not write angry letters. She wrote patient ones, and detailed ones, and ones that contained more money than the previous letter had.

By the spring of 1931 the Department of Legal Medicine at Harvard had been formally established. George Burgess Magrath was its first chair. The library was named for him.

She did not attend the opening. She had insisted that the chair be named for Magrath rather than for herself. The library carried his name and not hers.`,
    },
    // Beat 4 — Turning point
    {
      kind: "narrative",
      role: "turning_point",
      sourceNotes:
        "The Magrath Library of Legal Medicine was established at Harvard ~1931–1934, funded by Lee. Lee insisted Magrath's name (not hers) on chair and library — verifiable. The wooden-crates scene captures her hands-on involvement in the early stocking; specific actions are dramatized texture but the event and her presence at Harvard during this period are historically grounded.",
      text: `The first books arrived in wooden crates.

She stood in the room before anyone had arranged them. The labels were still tied to the shelves with string. Medical jurisprudence. Toxicology. Wounds. Evidence.

The department existed now. Not as a wish in a letter. Not as a subject she read alone in the library at Prairie Avenue. As a room at Harvard Medical School, with Magrath's name on the chair and her money inside the walls.

She had been seventeen when her father had told her, in another library, that she would not be allowed to study what was in this room.

She took off her gloves and opened the first crate.`,
    },
    // Beat 5 — What she became
    {
      kind: "narrative",
      role: "became",
      sourceNotes:
        "Nine-year gap between library stocking (~1931) and the start of the Nutshell project (~1940) — verifiable. Nutshells = 19 (canonical set per Botz). Honorary captain NH State Police 1943, first woman state police rank in US — verifiable.",
      text: `The Department of Legal Medicine at Harvard ran for the next three decades. In that time it trained the first generation of medical examiners in the United States. The men who had been polite to her in the early meetings, and had not looked at her when she spoke about money, learned to look.

Nine years after she stocked the first shelves, she went out to the workshop her father had built for himself at The Rocks and began constructing model crime scenes by hand. Doll's-house-scale recreations, built from the inside, with working light fixtures and miniature evidence and clues calibrated to teach observation. She built nineteen of them, over many years, alone and with assistants she paid out of her own pocket. They were called the Nutshell Studies of Unexplained Death. Homicide detectives were trained on them in week-long seminars in Boston. They are still trained on them today. The same insistence that had stocked the library had cleared the workshop.

In 1943 the New Hampshire State Police appointed her an honorary captain. She was the first woman in the United States to hold a state police rank. She was sixty-five.

The library at Harvard, the police rank, the rooms in the workshop — none of them had her name on them. She had insisted on this. The work was the thing.`,
    },
    // Beat 6 — Bridge to you
    {
      kind: "bridge",
      role: "bridge",
      text: `Frances was fifty-one when she sat at her brother's walnut desk and decided to use the next decades for what she had wanted from the first. She had been waiting since she was seventeen.

You wrote: "{feeling}"

The desk did not know what she had given up. The mahogany she had not chosen did not know. The first room at Harvard, when the books arrived in wooden crates, did not ask her to be younger than she was. It had shelves with labels tied on string and the light coming in through one window. The light did not need her to have started earlier. It only needed her to start.`,
    },
  ],
};

export const FIGURE_STAGES: FigureStageRow[] = [douglass, butler, lee];
