import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "berlin-i",
  figureName: "Irving Berlin",
  title: "The Song Beside the Coins",
  summary: "A young songwriter counts a disappointing return, then finds a different reason to keep the sheet music.",
  topics: ["creative-work", "recognition-and-money", "working-together"],
  contentNote: "Disappointment about money and creative work.",
  inventionNote: "The after-hours café scenes, coins on the table, discarded verse, gestures, thoughts and final exchange are invented. They are not memories or quotations from Berlin. The historical background establishes a first collaboration and a small return, not this evening or its emotional resolution.",
  background: [
    { text: "Berlin's first published song, Marie from Sunny Italy, appeared in 1907; the score credits I. Berlin with words and M. Nicholson with music.", sourceIds: ["biography", "score"] },
    { text: "In a retrospective interview, Berlin recalled collaborating with the café pianist after a rival café produced a hit; their own song brought a small profit.", sourceIds: ["interview"] },
  ],
  sources: [
    { id: "biography", title: "Irving Berlin — Concise Biography", url: "https://www.irvingberlin.com/biography", note: "Official biography; identifies the 1907 song as his first publication. It does not document the invented café evening." },
    { id: "score", title: "Marie from Sunny Italy — original score catalog", url: "https://levysheetmusic.mse.jhu.edu/collection/077/181", note: "Johns Hopkins University's Lester S. Levy Sheet Music Collection; publication and credited contributions." },
    { id: "interview", title: "Love Songs for Sale — Radio Stars, August 1934", url: "https://www.worldradiohistory.com/Archive-Radio-Stars/Radio-Stars-1934-08.pdf", note: "Bland Mulholland's attributed interview, printed page 33; retrospective account, not a transcript of the invented scenes." },
  ],
  pages: [
    {
      role: "scene",
      title: "After the last table",
      paragraphs: [
        "The café had gone quiet enough for Irving to hear a chair leg scrape across the floor. He wiped the last table twice, though it was already clean. Beneath his folded jacket lay a sheet of music, with his words printed where strangers could read them.",
        "All evening he had wanted a moment alone with it. Now he had that moment, and beside the paper he arranged the coins from their song. He nudged them into a straight line. Spread out, they occupied rather more of the table.",
      ],
    },
    {
      role: "dark_moment",
      title: "A very small sound",
      paragraphs: [
        "He counted again. The answer remained inconveniently faithful. Across the street, somebody was whistling a tune that was not theirs. Irving had carried trays to other people's music for so long that he had imagined publication would sound different from an ordinary night.",
        "He tapped a coin against the wood. That was the sound it made. There would still be work tomorrow, still orders to remember, still the awkward arithmetic of what he had earned. He folded the music until his own name disappeared inside it.",
      ],
    },
    {
      role: "response",
      title: "The folded corner",
      paragraphs: [
        "The pianist returned for something left near the keyboard. Irving almost slipped the paper into his pocket. Instead he opened it, smoothing the crease with the edge of his hand. The other man's name was there too. This disappointment had more than one owner.",
        "He pointed to a line in the second verse. It still bothered him. There were too many words crowding the end, as though the singer had to catch a departing train. He hummed the phrase badly. The pianist sat down, coat still on.",
      ],
    },
    {
      role: "struggle",
      title: "Too many words",
      paragraphs: [
        "They tried taking a word away. Now the line meant almost nothing. Irving replaced it with another and discovered that a shorter word could be just as clumsy. The pianist played the passage again. Somewhere behind them a bucket knocked against a door.",
        "There was nothing grand about this part. Irving was tired, and the tune had become irritating through repetition. He wanted to announce that the whole business was foolish. Instead he asked for the beginning once more, slower, so he could hear where he was rushing.",
      ],
    },
    {
      role: "turning_point",
      title: "Room for a breath",
      paragraphs: [
        "He left a little space where he had been forcing another word. The melody passed through it without trouble. When they reached the end, neither man hurried to start again. Irving looked at the blank place on the paper and made a small mark.",
        "It did not improve the evening's earnings. It might never interest anyone beyond this table. But the line was easier to sing, and they both knew why. For the first time that night, he was looking at the song instead of measuring the coins.",
      ],
    },
    {
      role: "became",
      title: "Separate pockets",
      paragraphs: [
        "Before leaving, he gathered the money. He did not throw it down or pretend it was enough. He put it carefully into one pocket, then folded the music along its existing crease and put that into another. Neither thing had turned into the other.",
        "At the door he tried the new line under his breath. He forgot the change halfway through and started again. Behind him, the pianist supplied the opening notes. Irving waited for them, then joined in before they went out into the street.",
      ],
    },
    {
      role: "bridge",
      title: "What the page can hold",
      paragraphs: [
        "This evening is invented; it cannot tell us what Irving Berlin thought about beginning. It leaves a song and a small payment beside each other, without making either disappear. The money matters. So does the work that the money cannot fully describe.",
        "Your circumstances may have little in common with his. There is no promised reward tucked into this ending. Only a little room for mixed feelings: wanting recognition, needing an income, and perhaps still caring about the thing you made with someone else.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
