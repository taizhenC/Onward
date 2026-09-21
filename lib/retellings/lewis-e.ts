import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "lewis-e",
  figureName: "Edmonia Lewis",
  title: "Something She Could Work With",
  summary: "An imagined encounter at a sculptor's worktable turns polite admiration into a smaller, more useful conversation about one unfinished head.",
  topics: ["creative-work", "learning", "finding-a-voice"],
  contentNote: "Fiction about artistic uncertainty and wanting substantive feedback. The historical background mentions racially condescending praise; no slurs or violence.",
  inventionNote: "The visitor is an invented character, not Lydia Maria Child or Edward Brackett. The studio visit, clay study, uneven ear, discussion, revisions and private thoughts are invented. The source records Lewis requesting criticism, not receiving this critique or improving a work because of it.",
  background: [
    { text: "In a letter published in 1864, Lydia Maria Child reported meeting Edmonia Lewis and discussing her work as a young sculptor.", sourceIds: ["child"] },
    { text: "Child reported that Lewis objected to praise based on her race and asked for faults in her work to be identified so she could learn.", sourceIds: ["child"] },
  ],
  sources: [
    { id: "child", title: "Letter from L. Maria Child — The Liberator, February 19, 1864", url: "https://fair-use.org/the-liberator/1864/02/19/the-liberator-34-08.pdf", note: "Printed page 31, column 3: the reported reception conversation and invitation to inspect a bust. It does not establish that a later studio visit or critique took place." },
  ],
  pages: [
    {
      role: "scene",
      title: "The Head on the Table",
      paragraphs: [
        "In this imagined visit, Edmonia has turned a small clay head toward the window. Its face looks different from this side. She turns it back. By the time her visitor arrives, she has moved it three times and brushed the same patch of table clean twice.",
        "The visitor bends to look and smiles. It is lovely, she says. Edmonia thanks her. Then they both stand quietly, as if the required part of the visit has already happened and neither knows what should follow it.",
      ],
    },
    {
      role: "dark_moment",
      title: "After the Compliment",
      paragraphs: [
        "Edmonia can feel the conversation moving away from the head. Soon they will discuss the weather, the walk, the hour. The visitor will leave with the pleasant sense of having encouraged her. Edmonia will still be here, turning the clay toward the window.",
        "She does not want to punish someone for being kind. She wants to know what the kindness has left untouched. The head troubles her, and admiration has given her nothing she can put her hands to.",
      ],
    },
    {
      role: "response",
      title: "Staying With the Work",
      paragraphs: [
        "Before the visitor reaches for her gloves, Edmonia asks her to stay beside the table a little longer. Not to decide whether the head is good. Just to look at it from the other side. She moves a chair out of the way.",
        "The visitor seems uncertain. She is no sculptor. Edmonia says that is all right; she is not asking for a verdict. The visitor leans down again, this time with her smile gone and her attention on the clay.",
      ],
    },
    {
      role: "struggle",
      title: "One Difference",
      paragraphs: [
        "At first the visitor can name only things she likes. Edmonia listens, impatient with herself for feeling impatient. Then the visitor points toward one ear. Does it sit a little higher than the other? Perhaps it is the light. She is not sure.",
        "Edmonia crouches beside her. Now that someone has pointed, she cannot stop seeing it. For a sharp instant she wishes she had accepted the compliment and ended the visit. The unevenness feels much larger with another person looking.",
      ],
    },
    {
      role: "turning_point",
      title: "A Question of Shape",
      paragraphs: [
        "She asks the visitor to keep pointing while she moves around the table. From this angle, the ear is not the whole trouble; the side of the head slopes differently. She presses a thumb against a spare lump of clay rather than touching the study yet.",
        "They look again. No one has explained the entire head. No one has declared Edmonia a success or a failure. There is simply a difference she can examine, and she finds herself asking the visitor one more question.",
      ],
    },
    {
      role: "became",
      title: "After the Door Closes",
      paragraphs: [
        "When the visitor leaves, Edmonia draws the head from the troublesome side. Her first drawing exaggerates the slope. She tries again. The second does not solve it either, but she can place the two sketches together and see what changed.",
        "She covers the clay for the evening. The visit has not produced a finished sculpture, and the compliment was not a lie. Beside the covered head lie two imperfect drawings, made after someone stayed long enough to look.",
      ],
    },
    {
      role: "bridge",
      title: "No Verdict",
      paragraphs: [
        "This visitor and this revision are fiction. They do not complete the historical record of Edmonia Lewis's request, or tell us how a particular criticism actually felt to her. Her real words supplied a question, not this answer.",
        "The imagined worktable remains a place where admiration and uncertainty can sit together. If the scene stays with you, it need not decide anything about your talent, your next attempt or the kind of response you want.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
