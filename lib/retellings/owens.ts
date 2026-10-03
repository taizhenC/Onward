import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "owens",
  figureName: "Jesse Owens",
  title: "Before He Said Yes",
  summary: "An imagined letter about a paid appearance gives Jesse Owens a practical question to ask beyond the familiar story of his victories.",
  topics: ["recognition-and-money", "finding-a-voice", "uncertainty"],
  contentNote: "Financial uncertainty, exhaustion and pressure around paid work. The background mentions suspension and bankruptcy; no invented humiliation or promised financial recovery.",
  inventionNote: "The invitation, desk, reply, anonymous correspondent, questions about terms, feelings and trip to post the letter are invented. They do not reconstruct a particular contract or imply misconduct by an actual organizer. The ending does not claim that Owens secured better terms or overcame the later financial difficulties documented in the background.",
  background: [
    { text: "Jesse Owens won four gold medals at the 1936 Olympics. A contemporary dispatch later reported his suspension after missed exhibitions and attributed complaints about exhaustion and missing expenses to him and other athletes.", sourceIds: ["timeline", "dispatch"] },
    { text: "Ohio State's archive records an entertainer contract in 1937, a dry-cleaning business in 1938 and personal bankruptcy in 1939 after the business went into debt.", sourceIds: ["timeline", "legacy"] },
  ],
  sources: [
    { id: "timeline", title: "Jesse Owens timeline — Ohio State University Libraries", url: "https://library.osu.edu/timeline", note: "The reviewed 1936–1939 entries support the medals and later work chronology. They do not document this fictional invitation or reply." },
    { id: "dispatch", title: "AAU Suspends Owens, Misses An Exhibition — The Denison Press, August 17, 1936", url: "https://texashistory.unt.edu/ark:/67531/metapth737480/m1/1/", note: "Page 1, London dispatch: a contemporary report of suspension and attributed complaints, not independent proof of every organizer's conduct." },
    { id: "legacy", title: "Owens' Legacy: a National Icon — Ohio State University Libraries", url: "https://library.osu.edu/jesse-owens-a-lasting-legend/owens-legacy-a-national-icon", note: "The business paragraph records the dry cleaners, debt and bankruptcy. No invented letter is offered as the cause or remedy of those events." },
  ],
  pages: [
    {
      role: "scene",
      title: "The Invitation",
      paragraphs: [
        "In this imagined evening, Jesse has a letter open on the table. Its writer would like him to make an appearance. The first paragraph describes his victories in generous detail. His name looks very large in the little space above the proposed arrangements.",
        "He reads those arrangements twice. There is a place, a rough idea of the program, an expression of enthusiasm. He turns the page over, looking for the part about travel. The back is blank except for a faint impression of the typing.",
      ],
    },
    {
      role: "dark_moment",
      title: "What the Praise Leaves Out",
      paragraphs: [
        "It would be pleasant to answer yes and have the matter settled. There is work in the offer, perhaps money, perhaps another useful acquaintance. He has learned that a famous name can travel ahead of a person without carrying that person's fare.",
        "The praise is not the problem. The unanswered questions are. Yet after a paragraph about Olympic victories, asking where he will sleep or when he will be paid feels like bringing a small, awkward parcel into a room arranged for celebration.",
      ],
    },
    {
      role: "response",
      title: "A Courteous Beginning",
      paragraphs: [
        "Jesse takes a fresh sheet and thanks the writer for the invitation. That line comes easily. He adds that he would like to know more about the appearance. Then his pen slows. The next sentence is the reason he needs to write at all.",
        "He asks about the fee. After that he leaves a space, as though the question ought to stand by itself and not crowd the page. But the journey matters too. He adds another line about the cost of getting there.",
      ],
    },
    {
      role: "struggle",
      title: "Reading It Back",
      paragraphs: [
        "Read together, the questions sound abrupt to him. He starts explaining why they matter, then finds himself composing a defense of having ordinary expenses. The explanation grows longer than the questions. He stops before the ink reaches the bottom of the sheet.",
        "He cannot make an uncertain offer secure by finding the perfect tone. The writer may have practical answers, or may still need to work them out. Jesse looks at the first letter again. An invitation is there. An agreement is not yet there.",
      ],
    },
    {
      role: "turning_point",
      title: "Three Clear Questions",
      paragraphs: [
        "On a second sheet, he keeps the thanks and removes the defense. He asks what the payment would be, how travel would be covered and what schedule the appearance would require. He leaves enough space between the questions to read each one plainly.",
        "There is nothing triumphant about the new letter. It is shorter. The signature at the bottom belongs to the same person praised in the invitation, but the lines above it concern the person who would actually have to make the trip.",
      ],
    },
    {
      role: "became",
      title: "No Answer Yet",
      paragraphs: [
        "He addresses the envelope and takes it out to post. For a moment, with the letter still in his hand, he considers whether another sentence would make it warmer. Then he lets it go. Whoever reads it will have something specific to answer.",
        "Back at the table, he keeps the invitation rather than treating the work as settled. The evening has produced no fee, no booking and no guarantee. It has produced a reply that does not require him to vanish behind the achievements in its opening paragraph.",
      ],
    },
    {
      role: "bridge",
      title: "Beyond the Introduction",
      paragraphs: [
        "This letter and its small ending are fiction, not a discovered exchange from Jesse Owens's life. His real achievements did coexist with difficult work and financial circumstances. An invented moment of clarity does not cancel that history.",
        "The envelope in this story carries practical questions, not a promise that asking will secure an answer. You may recognize something in the distance between being admired and being provided for, without having to make his circumstances stand for yours.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
