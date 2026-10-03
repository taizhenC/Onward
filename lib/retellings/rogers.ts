import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "rogers",
  figureName: "Fred Rogers",
  title: "A Smaller Piece of Paper",
  summary: "In an imagined preparation session, Fred tries to explain quiet work without making it sound like something else.",
  topics: ["finding-a-voice", "care-and-family", "working-together"],
  contentNote: "Uncertainty about explaining and funding caring work. No recreated congressional dialogue or claim that one speech secured funding.",
  inventionNote: "The preparation room, unnamed colleague, paper cards, rehearsal difficulties and closing walk are invented. The fictional rehearsal is placed around the historical hearing as an imagined possibility, not a recovered event. No private thoughts, room details or preparation methods are established by the cited hearing record.",
  background: [
    { text: "At a Senate communications hearing in spring 1969, Fred Rogers explained his daily children's program and the value of attending to ordinary childhood feelings.", sourceIds: ["hearing", "owning-record"] },
    { text: "He described hosting, performing puppets, and writing music and scripts. Senator Pastore responded favorably, but that exchange alone does not establish the final appropriation.", sourceIds: ["hearing"] },
  ],
  sources: [
    { id: "hearing", title: "Senate Commerce Communications Hearings, NET, 1969", url: "https://americanarchive.org/catalog/cpb-aacip-516-t72794201n", note: "American Archive of Public Broadcasting program record and Fred Rogers transcript. May 1 is labeled broadcast date; the description places hearings April 29–30. No exact hearing day is asserted here." },
    { id: "owning-record", title: "Fred Rogers testifies before the Senate Subcommittee on Communications", url: "https://www.misterrogers.org/videos/pastore/", note: "Fred Rogers Productions identifies the speaker, committee and 1969 event. This record does not document the fictional rehearsal." },
  ],
  pages: [
    {
      role: "scene",
      title: "The explanation",
      paragraphs: [
        "Fred had covered a sheet with notes about the program. There were arrows between paragraphs, additions down the side, a sentence squeezed so close to the bottom that its last word nearly fell off. Beside it sat a smaller card, still blank.",
        "A colleague pulled up a chair to listen. In this borrowed hour, he wanted to make clear why the work mattered. He began at the top of the large sheet, following its arrows as though they marked a route through an unfamiliar town.",
      ],
    },
    {
      role: "dark_moment",
      title: "The missing room",
      paragraphs: [
        "By the third paragraph he was explaining an explanation. The words were accurate enough, but the program itself seemed to have slipped out between them. There was no room in this version for a child taking time to name a feeling.",
        "He stopped midway through a sentence and looked at the crowded page. In trying to give the work a sufficiently important description, he had made it difficult to recognize. His colleague waited, without attempting to finish the thought for him.",
      ],
    },
    {
      role: "response",
      title: "One ordinary moment",
      paragraphs: [
        "Fred turned the large sheet face down. He began again with a made-up child who had built something, knocked it over, and become angry. No grand example. Just a small person beside a heap of pieces, with a feeling larger than the heap.",
        "He described the space a program might make for that moment. The colleague leaned forward to ask how long such a scene would take. Fred considered the question instead of rushing past it. The conversation finally had something they could both picture.",
      ],
    },
    {
      role: "struggle",
      title: "More than a scene",
      paragraphs: [
        "An example was not a budget, and a clear explanation was not a decision. He still had practical things to say about making the program. When he reached for them, the old tangle of notes tempted him back into reading every line.",
        "He tried the opening again, then the part about the daily work. He forgot a point, retrieved it, and discovered that another point could wait. The smaller card acquired several words with a great deal of white space around them.",
      ],
    },
    {
      role: "turning_point",
      title: "The question underneath",
      paragraphs: [
        "His colleague asked what he most wanted a listener to understand. Fred looked past the card. He pictured the invented child again, still by the scattered pieces. The scene had no dramatic rescue, only someone taking the feeling seriously enough to stay with it.",
        "He answered in ordinary language. This time he did not add a more impressive sentence afterward. His colleague nodded and let the answer stand. There was room after it for another person's question, which had been missing from the first attempt.",
      ],
    },
    {
      role: "became",
      title: "What he could carry",
      paragraphs: [
        "When their hour ended, Fred put the large sheet into his folder as well. It held useful details. But he placed the little card on top, where he would see it before the arrows and additions drew him into their busy streets.",
        "Outside, he paused to fasten his coat. No rehearsal could decide how another person would listen, or what the hearing would produce. He had found an opening he could say plainly. For this walk, that was what he had to carry.",
      ],
    },
    {
      role: "bridge",
      title: "An imagined preparation",
      paragraphs: [
        "The rehearsal you have read is fiction, not the recorded story of Fred Rogers's testimony. Its small ending is an explanation made clearer. Whether caring work receives the support it needs remains beyond this scene.",
        "There is no requirement to speak beautifully about anything difficult in your own life. You may rest with the image of the smaller card: a few words, and enough space for someone else to listen.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
