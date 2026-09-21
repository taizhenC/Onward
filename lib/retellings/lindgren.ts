import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "lindgren",
  figureName: "Astrid Lindgren",
  title: "Room in the Bag",
  summary: "On an imagined day before a change in her son's care, a mother finds that packing his things is not the same as knowing how to say goodbye.",
  topics: ["care-and-family", "asking-for-help", "uncertainty"],
  contentNote: "A young child's change of caregivers, separation and the strain of combining paid work with care. No illness scenes or promise that separation becomes painless.",
  inventionNote: "The packing day, bag, mended pocket, child's choices, note, gestures and Astrid's private thoughts are invented. They are not taken from a diary or a witnessed farewell. The documented care arrangements supply the background; the story does not claim that help erased the child's distress or caused Lindgren's later writing.",
  background: [
    { text: "In 1930, Lars lived for several months with Astrid Lindgren in her rented room in Stockholm after his foster mother's illness ended his earlier care arrangement.", sourceIds: ["lasse"] },
    { text: "The family estate's account says Lindgren could not sustain both her son's care and her secretarial work. In May 1930, she brought him to her parents' farm after her mother proposed sharing his care.", sourceIds: ["youth"] },
    { text: "Lars subsequently lived with his grandparents for more than a year.", sourceIds: ["lasse"] },
  ],
  sources: [
    { id: "lasse", title: "Om Lasse — The Astrid Lindgren Company", url: "https://www.astridlindgren.com/se/om-astrid-lindgren/ungdomen/lasse", note: "Family-estate chronology, opening two paragraphs. Supports the sequence of care arrangements, not the invented packing scene." },
    { id: "youth", title: "Ungdomen — The Astrid Lindgren Company", url: "https://www.astridlindgren.com/se/om-astrid-lindgren/ungdomen", note: "The section Lasse kommer till Stockholm describes practical caregiving difficulties and the move to the grandparents. This is later estate narration, not a contemporaneous diary." },
  ],
  pages: [
    {
      role: "scene",
      title: "On the Coverlet",
      paragraphs: [
        "In this imagined room, Astrid has laid a small coat beside an open bag. She has already folded it once. Now she unfolds it to check the pocket, although she knows what is inside: nothing but a seam that has begun to come loose.",
        "Her son sits nearby, arranging two socks so their toes point in the same direction. He has made a task out of it. Astrid gives him another pair. Together they are preparing his things for the journey to her parents.",
      ],
    },
    {
      role: "dark_moment",
      title: "What Cannot Be Packed",
      paragraphs: [
        "The bag is not large, but it is taking a long time to fill. Each thing asks another question. What will he want first? What might she forget to explain? She puts a folded shirt in, then takes it out so the coat can lie beneath it.",
        "Work and care have not fitted together as she needed them to. Her parents' help is real, and so is the approaching separation. She wishes those two facts would settle into a single feeling. They refuse to do it.",
      ],
    },
    {
      role: "response",
      title: "A Small Repair",
      paragraphs: [
        "She finds a needle and begins closing the loose pocket. This is something she can finish before they leave. Her son watches the thread move. When he reaches toward it, she puts the needle down and shows him the little opening with her finger.",
        "He loses interest before the seam is mended. She keeps sewing, then stops with the last stitch waiting. The pocket will hold. She does not need to make every stitch disappear before the coat can go into the bag.",
      ],
    },
    {
      role: "struggle",
      title: "The Wrong Order",
      paragraphs: [
        "He takes a shirt out. She puts it back. He takes it out again, annoyed now, and she nearly tells him they have no time. But time is precisely what the room seems full of: the journey still ahead, the days after it, the minutes she keeps rearranging.",
        "She sits on the floor beside the bag. For a little while neither of them packs. His socks have become separated. One lies beneath the chair, just beyond her hand. She leaves it there until he goes to fetch it.",
      ],
    },
    {
      role: "turning_point",
      title: "His Part of the Bag",
      paragraphs: [
        "When he returns, she holds the bag open instead of taking the sock. He places it inside. Then its partner. She asks which shirt he wants on top. He chooses the one she has been moving, and she leaves it where he puts it.",
        "This does not explain the move to him or make him pleased about it. It only changes the last few minutes of packing. Astrid no longer has to complete the entire task while he watches his things disappear.",
      ],
    },
    {
      role: "became",
      title: "Not Everything Alone",
      paragraphs: [
        "She writes a short note for her parents about the things in the bag. Beside the coat, she mentions the repaired pocket. There are other things she will have to tell them in person, and things all of them will learn only by caring for him.",
        "She fastens the bag. Her son has gone back to the chair, and she does not summon him into an embrace to make the afternoon end neatly. She puts the needle away, checks that it is safely out of reach, and sits beside him.",
      ],
    },
    {
      role: "bridge",
      title: "Without a Neat Ending",
      paragraphs: [
        "The bag and the quiet beside the chair belong to this fiction, not to Astrid Lindgren's remembered life. A child's actual experience cannot be supplied by an invented tender ending, and this story does not try to erase the difficulty of changing care.",
        "It leaves room for help and sadness without making either one cancel the other. Your own relationships may be very different. Nothing about this imagined afternoon tells you what arrangements or feelings should be yours.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
