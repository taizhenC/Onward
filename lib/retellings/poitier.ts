import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "poitier",
  figureName: "Sidney Poitier",
  title: "The Space Before the Line",
  summary: "An imagined evening in a young actor's training, when getting through the speech matters less than hearing the person opposite him.",
  topics: ["learning", "finding-a-voice", "working-together"],
  contentNote: "Audition disappointment and uncertainty about belonging. No abusive dialogue or claim that an accent needs correcting.",
  inventionNote: "The evening class, unnamed classmate, borrowed pencil, rehearsal exchange, thoughts and final cleaning scene are invented. This is not a reconstruction of a recorded rehearsal. Sources establish only the early audition, practice and trial-training background below; they do not verify this fictional change in his approach.",
  background: [
    { text: "Poitier recalled unsuccessful early auditions, practicing with a radio while doing paid work, and offering theatre cleaning in exchange for classes.", sourceIds: ["moving-image", "achievement"] },
    { text: "His retrospective accounts and the accompanying institutional chronology do not establish one exact audition year. He described an initial trial place, not secure admission or immediate success.", sourceIds: ["moving-image", "achievement"] },
  ],
  sources: [
    { id: "moving-image", title: "Sidney Poitier: Pinewood Dialogue, 1989", url: "https://movingimage.org/wp-content/uploads/2020/12/63_programs_transcript_pdf_228.pdf", note: "Museum of the Moving Image transcript, printed pages 2–5. Retrospective testimony about auditions, practice and trial classes, not evidence for the invented rehearsal." },
    { id: "achievement", title: "Sidney Poitier interview, 2009", url: "https://achievement.org/achiever/sidney-poitier/", note: "Academy of Achievement interview and institutional biography. The cleaning offer and separate return are recalled here; chronology differs from the earlier account." },
  ],
  pages: [
    {
      role: "scene",
      title: "Before the others arrive",
      paragraphs: [
        "Sidney set the broom against the wall and opened his script. Dust had made a pale line across one sleeve. There were a few minutes before class, enough to practice the passage he had been carrying in his head all day.",
        "He faced an empty chair and began. Without another voice to interrupt, the words came in a beautiful, unbroken rush. He finished exactly where he meant to finish. For a moment, the empty chair seemed an excellent audience.",
      ],
    },
    {
      role: "dark_moment",
      title: "The other half",
      paragraphs: [
        "Then a classmate took the chair, and the passage changed. She paused where he expected her to hurry. She said a small word as though it mattered. His carefully stored next line arrived too early, and their voices collided.",
        "He apologized, went back, collided again. Heat gathered under his collar. He knew the words; he had worked for those words. Yet here he was, holding his half of a conversation so tightly that the other half could hardly enter.",
      ],
    },
    {
      role: "response",
      title: "A mark in pencil",
      paragraphs: [
        "During the break, Sidney borrowed a pencil. He meant to underline his difficult sentence. Instead, he made a small mark beside the end of hers. He asked if they could try that short exchange again, without performing the whole passage.",
        "His classmate moved the chair back into place. This time he kept his eyes off his own first word. He watched her take a breath. Waiting felt oddly like doing nothing, though it required more attention than his rehearsed rush.",
      ],
    },
    {
      role: "struggle",
      title: "Not yet smooth",
      paragraphs: [
        "The next attempt was slower and not especially graceful. Once he waited so long that they both laughed. Once he listened properly and forgot his answer. The pencil slipped from his script and rolled beneath the chair.",
        "He retrieved it on his knees. The old wish returned: one clean performance, something finished enough to place before the people deciding whether he could stay. This untidy practice seemed such a small thing to offer instead.",
      ],
    },
    {
      role: "turning_point",
      title: "An answer",
      paragraphs: [
        "They tried once more. His classmate changed the emphasis again, and this time he heard the change before reaching for his line. The answer came out quieter than he had planned. It fitted what she had actually said.",
        "Neither of them announced that anything important had happened. She continued to the next sentence. He followed. For a little while the page lay between them like a shared object, rather than a test he had to carry alone.",
      ],
    },
    {
      role: "became",
      title: "After class",
      paragraphs: [
        "At the end of the evening, Sidney returned the pencil and picked up the broom. His place was still uncertain. There would be other passages, other auditions, and hours when effort did not give him the result he wanted.",
        "Before closing his script, he left the little mark beside his partner's line. Tomorrow he might need it again. He swept around the chair, shifted it aside, and finished the patch of floor where they had been sitting.",
      ],
    },
    {
      role: "bridge",
      title: "What this fiction leaves",
      paragraphs: [
        "This invented evening does not explain Sidney Poitier's career. It ends with a borrowed pencil returned and a small exchange heard differently. The uncertainty outside the rehearsal remains outside it.",
        "There is no audition hidden in reading this page, and nothing to prove afterward. You may keep the image of two people trying a passage again, or leave it here. Your own next sentence belongs to you.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
