import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "mcclintock",
  figureName: "Barbara McClintock",
  title: "The Sentence That Stayed",
  summary: "An imagined writing afternoon with Barbara McClintock, a promising comparison and a qualification that refuses to become a tidy conclusion.",
  topics: ["uncertainty", "creative-work", "learning"],
  contentNote: "Gentle fiction about revision and scientific uncertainty. No rejection or illness narrative, and no scientific or medical advice.",
  inventionNote: "The writing room, draft sheets, crossed-out sentences, pencil, interruption, private frustration and final arrangement of pages are invented. No draft or diary establishes these actions. The real paper's qualified comparison inspires the fiction; the story does not claim that a private breakthrough proved the comparison or won acceptance.",
  background: [
    { text: "Barbara McClintock published Some Parallels Between Gene Control Systems in Maize and in Bacteria in the September–October 1961 American Naturalist.", sourceIds: ["paper-opening"] },
    { text: "Its opening says that maize findings might not describe a general system without confirmation in other organisms, then proposes a possible relationship with recently described bacterial control systems.", sourceIds: ["paper-opening"] },
  ],
  sources: [
    { id: "paper-opening", title: "Opening of McClintock's 1961 paper, reproduced in Edith Heard's Collège de France lecture", url: "https://www.college-de-france.fr/sites/default/files/documents/en-edith-heard/UPL4955809431944515605_COURS_I_2017_HEARD.compressed.pdf", note: "PDF page 16 reproduces the article's opening paragraphs. Only that visible excerpt underlies the background here; it is not a claim to have inspected the whole paper or its drafts." },
  ],
  pages: [
    {
      role: "scene",
      title: "Two Sheets",
      paragraphs: [
        "In this imagined afternoon, Barbara has set two sheets beside each other. On one is a description of what has been observed in maize. On the other is a passage about bacteria. Her pencil rests across the narrow strip of table between them.",
        "She reads the passages again. There is something worth comparing here. She draws a third sheet toward herself and begins a sentence that will bring the two accounts together without making them identical. For a few lines, the writing comes easily.",
      ],
    },
    {
      role: "dark_moment",
      title: "Too Much Said",
      paragraphs: [
        "Then she reads the sentence aloud. It sounds assured. It also goes farther than the observations she has put beside it. The wording has crossed a distance the evidence has not. She marks the line, but does not yet strike it out.",
        "Underneath it she writes a qualification. Now the paragraph seems to approach its point and then step backward. She can imagine a reader impatient with all this careful stopping. For a moment she is that impatient reader herself.",
      ],
    },
    {
      role: "response",
      title: "Back to the Pages",
      paragraphs: [
        "She returns to the two accounts instead of producing another conclusion. What does each one actually say? She makes a short note beside the maize passage, then beside the bacterial one. The notes are plainer than the sentence she liked.",
        "A noise outside draws her attention away. When she looks down again, the pencil has rolled into the gap between the sheets. She picks it up and puts a line through the overconfident wording. The page looks worse. The claim is smaller.",
      ],
    },
    {
      role: "struggle",
      title: "A Stubborn Word",
      paragraphs: [
        "The new version contains a possibility instead of an announcement. She tries moving the qualification to the end, where it might interrupt less. There it sounds like an afterthought. She moves it back. The paragraph is not going to become effortless merely because she keeps rearranging it.",
        "Her hand is tired. She puts the pencil down and rereads without changing anything. The comparison still interests her. The uncertain part still matters. Removing either would make a smoother paragraph about something other than the question she came to examine.",
      ],
    },
    {
      role: "turning_point",
      title: "A Different Ending",
      paragraphs: [
        "She begins again beneath the crossed-out lines. This time she lets the limit arrive early. The reader will know what has not been established before being asked to consider the relationship. She does not have to conceal the distance between those things.",
        "The sentence ends sooner. Barbara follows it with the comparison she can actually make. There is no sudden new result on the desk. Only the same observations, placed in a different order, and a question no longer dressed as its own answer.",
      ],
    },
    {
      role: "became",
      title: "For Another Reading",
      paragraphs: [
        "By the time she gathers the pages, the discarded versions make a small untidy pile. She keeps them beneath the new draft. Tomorrow she may need to see why a phrase was changed, or discover that the plainer version needs work too.",
        "She leaves the two source passages together. The comparison remains worth making. What it might lead to is not something she can settle by adding a stronger adjective tonight. She clears enough space on the table to read the pages again.",
      ],
    },
    {
      role: "bridge",
      title: "Still Open",
      paragraphs: [
        "This drafting afternoon is invented. Barbara McClintock's published qualification is real; the frustration and small satisfaction around these fictional pages are not testimony about her private life. No later prize supplies the missing answer to this particular scene.",
        "The story ends with a question still available to thought. Perhaps that is an interesting place to stop, perhaps an uncomfortable one. Your own unanswered questions do not have to resemble a scientist's paper to remain part of your life.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
