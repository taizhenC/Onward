import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "christie",
  figureName: "Agatha Christie",
  title: "The Page She Did Not Love",
  summary: "During a difficult season, a writer finishes a piece of work without pretending to be pleased with it.",
  topics: ["creative-work", "care-and-family", "uncertainty"],
  contentNote: "Separation, financial pressure and frustration with creative work.",
  inventionNote: "The particular garden mornings, moving pencil, child’s drawing, revised passage, completed manuscript scene and private thoughts are invented. The story does not reproduce a conversation with Christie's daughter or secretary. It does not claim that finishing the novel resolved her separation or her feelings about it.",
  background: [
    { text: "Christie worked on The Mystery of the Blue Train while separated from her husband and needing funds; it developed from her earlier story The Plymouth Express and was published in 1928.", sourceIds: ["work-record"] },
    { text: "The estate's reading guide describes a February 1927 trip with her daughter and secretary, including writing in a hotel garden and interruptions by her daughter.", sourceIds: ["reading-guide"] },
    { text: "The estate's work record cites Christie's autobiography for her continuing dislike of the novel and its plot.", sourceIds: ["work-record"] },
  ],
  sources: [
    { id: "work-record", title: "The Mystery of the Blue Train — Agatha Christie estate", url: "https://www.agathachristie.com/stories/the-mystery-of-the-blue-train", note: "Owning work record; publication, circumstances, earlier story and retrospective evaluation." },
    { id: "reading-guide", title: "Read Christie 2024 — March selection", url: "https://www.agathachristie.com/news/2024/read-christie-2024", note: "Estate reading guide's account of the February 1927 stay; not a record of the invented garden scenes." },
  ],
  pages: [
    {
      role: "scene",
      title: "A table in the garden",
      paragraphs: [
        "Agatha moved her paper out of a patch of sunlight and put her pencil across the top. A moment later the pencil rolled off. She retrieved it, returned to her sentence and found that she no longer knew what she had intended to put after the comma.",
        "There were worse problems than a comma. She could have made a long list of them. Instead she looked across the garden for her daughter, found her occupied nearby, and placed a hand over the page to keep the corner from lifting in the breeze.",
      ],
    },
    {
      role: "dark_moment",
      title: "Work, whether or not",
      paragraphs: [
        "She needed the book to become something that could leave her desk. Money was one reason. Having a task with an edge to it was another, though lately that edge kept moving away. Separation did not arrange itself neatly around the hours available for writing.",
        "She read the paragraph aloud under her breath. It sounded like a person explaining a train journey they had not enjoyed. She crossed out a sentence and briefly disliked the page less. Then she looked at the large white space where the sentence had been.",
      ],
    },
    {
      role: "response",
      title: "Something already begun",
      paragraphs: [
        "The earlier story offered a few things that still held: a journey, a mystery, people with reasons not to tell the truth. She returned to those pieces. She did not need to admire every one of them to notice which had a useful place in the book.",
        "For this morning, she gave herself a smaller piece of work. One character had to enter a room and discover something missing. She wrote the doorway first. Her daughter came over with a drawing just as she reached the room, and Agatha put down the pencil.",
      ],
    },
    {
      role: "struggle",
      title: "Two things on the table",
      paragraphs: [
        "The drawing required attention to an animal whose identity was not immediately clear. Agatha asked about its ears. An explanation followed, along with an addition to the picture. By the time she returned to the room in her book, she had misplaced its furniture in her mind.",
        "She began the passage again. Later she would have to stop for something else; no perfect stretch of silence was being held in reserve. On the table, the child's drawing and the unfinished page lay side by side. Neither was improved by her irritation with the other.",
      ],
    },
    {
      role: "turning_point",
      title: "A workable passage",
      paragraphs: [
        "Toward the end of the morning, the character finally crossed the room. The missing object mattered. Agatha read the passage and found a sentence to shorten, then another to leave alone. She had not discovered a sudden affection for the whole book. The passage simply worked.",
        "She numbered the page and placed it with the others. There were still decisions ahead, and probably more sentences to remove. For now, she could close the notebook without treating its contents as either a triumph or proof that she should never have opened it.",
      ],
    },
    {
      role: "became",
      title: "Not a love letter",
      paragraphs: [
        "In the ending we imagine, the completed manuscript makes an uneven stack. Agatha taps its edges against the desk. A few pages persist in sticking out. She straightens them, checks the order and ties the bundle without the satisfaction she once expected completion to bring.",
        "It is nevertheless ready to leave this particular table. Her dislike has not prevented that, and finishing has not required her to retract it. After moving the bundle aside, she finds the old drawing underneath. She gives the animal's improbable ears another look before putting it somewhere safe.",
      ],
    },
    {
      role: "bridge",
      title: "No required applause",
      paragraphs: [
        "These scenes are fiction. Christie's actual continuing dislike of this novel leaves room for a less tidy ending than the usual story of restored inspiration. A completed book need not become a beloved book. A difficult season need not become useful in retrospect.",
        "Your work and your responsibilities may be very different. Nothing here asks you to keep producing through distress. It offers only an ending without compulsory gratitude: something can be finished while your feelings remain complicated, and those feelings do not have to be edited into applause.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
