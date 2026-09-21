import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "lee",
  figureName: "Frances Glessner Lee",
  title: "A Place on the Shelf",
  summary: "An imagined afternoon among a donor's books, when one unfinished catalogue entry threatens to stand for everything she has not yet done.",
  topics: ["working-together", "uncertainty"],
  contentNote: "Gentle fiction about unfinished work and accepting its limits. Brief, non-graphic reference to a library of legal medicine.",
  inventionNote: "The catalogue cards, unidentified author, assistant, room, gestures and private doubts are invented. No source records this afternoon or the conversation. Lee's actual library gift and her stated intention to develop a larger department provide the background, not evidence for the imagined events.",
  background: [
    { text: "In May 1934, Frances Glessner Lee presented the thousand-volume George Burgess Magrath Library of Legal Medicine at Harvard Medical School.", sourceIds: ["dedication"] },
    { text: "In her dedication remarks, Lee described the larger department she hoped to build as a gradual undertaking, only a small part of which was under way.", sourceIds: ["dedication"] },
  ],
  sources: [
    { id: "dedication", title: "Mrs. Lee and President Conant Are Speakers at Opening of Library — The Harvard Crimson, May 25, 1934", url: "https://www.thecrimson.com/article/1934/5/25/mrs-lee-and-president-conant-are/", note: "Contemporary report reproducing the dedication speeches. Supports the gift and the explicitly unfinished larger plan, not the fictional catalogue scene." },
  ],
  pages: [
    {
      role: "scene",
      title: "The Last Card",
      paragraphs: [
        "In this imagined afternoon, Frances has reached the bottom of a stack of catalogue cards. Beyond the table, books stand in uneven rows. Some lean against their neighbors; others wait in short piles for space. She draws the last volume toward her and opens its worn cover.",
        "The title is there. The author's name is not. She turns another page, then another, as though the missing name might have wandered deeper into the book. On the card, beneath the title, she has left a clean white space.",
      ],
    },
    {
      role: "dark_moment",
      title: "An Uncomfortable Blank",
      paragraphs: [
        "She puts that card aside. It lands beside a list of things the collection still needs: another shelf, more checking, books not yet found. The list makes the room seem smaller. All afternoon she has been handling what is here; now she can see only what is absent.",
        "She had wanted to make something useful. In the little silence before she reaches for her pencil again, useful begins to sound embarrassingly ambitious. Perhaps the whole collection ought to wait until she can introduce it without so many qualifications.",
      ],
    },
    {
      role: "response",
      title: "One More Search",
      paragraphs: [
        "Frances opens the book again. She checks the edges of its first pages, lifts a folded leaf, looks beneath a loose piece of paper. Nothing. She can keep searching this same volume, or she can admit that it has not supplied an answer.",
        "An assistant comes to the table with two books balanced against a sleeve. Where should these go? Frances almost says to leave everything for now. Instead, she clears a place beside her. They compare the titles with the cards already finished.",
      ],
    },
    {
      role: "struggle",
      title: "What the Card Can Say",
      paragraphs: [
        "The assistant reaches the incomplete entry and stops. Frances explains the missing author, then begins explaining the other gaps, too. There are more explanations than the small card has room for. She hears herself describing a much larger institution than this table can hold.",
        "The assistant waits, one finger keeping their place in the stack. The book is still open between them. Whatever it lacks, its title is legible. Its pages can be read. The unfinished card does not make the volume disappear.",
      ],
    },
    {
      role: "turning_point",
      title: "A Useful Description",
      paragraphs: [
        "Frances takes a fresh card. She copies what she can establish and writes that the author remains unidentified. The line feels less elegant than a name would have felt. It is also something another person can understand without having to ask her.",
        "They find a place for the volume. The assistant reads back the shelf reference while Frances checks it. For a moment there is no larger plan to defend, only a book and a way of finding it again.",
      ],
    },
    {
      role: "became",
      title: "Before Leaving",
      paragraphs: [
        "Before she leaves, Frances puts the unfinished list in a folder. She does not throw it away. Those tasks belong to the collection too, but they need not sit on top of every completed card. Tomorrow someone can begin where today's work stopped.",
        "At the door, she looks back at the shelves. There is room for more books. There are also books already there. She leaves the catalogue on the table where the next pair of hands can reach it.",
      ],
    },
    {
      role: "bridge",
      title: "The Book Remains",
      paragraphs: [
        "This small ending belongs to fiction, not to a recovered afternoon in Frances Glessner Lee's life. The real gift does not verify the missing card, the assistant or the doubt we have imagined around them.",
        "The story leaves a book available and a question unanswered. You may find company in that unfinished shelf, or no resemblance at all. Neither response requires you to turn your own work into a lesson.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
