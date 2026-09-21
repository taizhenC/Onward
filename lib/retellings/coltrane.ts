import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "coltrane",
  figureName: "John Coltrane",
  title: "The Passage Between Them",
  summary: "An experienced saxophonist brings a question back to the piano and discovers another way into a difficult passage.",
  topics: ["learning", "asking-for-help", "working-together"],
  contentNote: "Creative frustration and uncertainty during performance.",
  inventionNote: "The single rehearsal, gestures, private embarrassment, exact mistakes and later performance sequence are invented composites. No dialogue is quoted. Thelonious Monk's documented musical help is background, not proof of these scenes or of a single transformative lesson.",
  background: [
    { text: "Coltrane described asking Thelonious Monk to learn a tune, making repeated rehearsal visits, and using repetition and written music when passages were difficult.", sourceIds: ["jazz-review"] },
    { text: "In his retrospective DownBeat essay, he described learning by asking Monk questions and watching answers played on the piano, during their work together in 1957.", sourceIds: ["downbeat"] },
    { text: "Coltrane recalled feeling lonesome when the piano stopped during performances and relying on bassist Wilbur Ware.", sourceIds: ["jazz-review"] },
  ],
  sources: [
    { id: "jazz-review", title: "An Interview with John Coltrane — The Jazz Review, January 1959", url: "https://www.jazzstudiesonline.org/files/jso/resources/pdf/JREVTwo1.pdf", note: "August Blume's interview, printed page 25; rehearsal and performance recollections. Only the legible passages retained in the reviewed source packet support this background." },
    { id: "downbeat", title: "Coltrane on Coltrane — DownBeat", url: "https://downbeat.com/microsites/prestige/trane-interview.html", note: "Coltrane with Don DeMicheal, September 1960; retrospective account of learning with Monk, not this invented rehearsal." },
  ],
  pages: [
    {
      role: "scene",
      title: "Before playing",
      paragraphs: [
        "John took the saxophone from its case and held it across his knees while the piano finished a phrase. He knew the tune well enough to anticipate where it would go. Knowing that did not mean his fingers would agree when it was his turn to enter.",
        "He adjusted the reed, although the reed was not the problem. In the small pause before they began, he could hear his own breath and a faint movement somewhere beyond the room. Then the piano offered the beginning, and he lifted the horn to join it.",
      ],
    },
    {
      role: "dark_moment",
      title: "The same corner",
      paragraphs: [
        "He lost the passage at the same corner as before. Nothing dramatic happened. The sound continued without becoming the thing he intended, and then he stopped. He knew enough music to hear the distance between his attempt and what the tune seemed to be asking.",
        "For a moment he considered playing something else, something quick and familiar that his hands already understood. It would fill the room. It would also leave the question untouched. He lowered the instrument and looked at the place on the keyboard where he had become confused.",
      ],
    },
    {
      role: "response",
      title: "A smaller question",
      paragraphs: [
        "He asked to hear that part again. Not the whole tune, and not an account of everything he ought to know. Just the small stretch where one thing became another. Monk played it, and John listened without trying to prepare his own entrance at the same time.",
        "Then he tried it slowly. The first notes arrived where he meant them to. The next did not. This time he could point to the difficulty instead of waving a hand at the entire piece. He asked another question, more specific than the first.",
      ],
    },
    {
      role: "struggle",
      title: "Again is not the same",
      paragraphs: [
        "They repeated the passage until repetition made it briefly unfamiliar. John rubbed his thumb against the instrument and waited. Listening once more was not automatically useful; he had been waiting for the sound to arrange itself inside him without noticing exactly what he kept missing.",
        "The written music gave his eyes something his ears had not held. He followed the shape on the page, then looked back toward the piano. It was neither a revelation nor an embarrassment to find marks there. They were another way of putting the question within reach.",
      ],
    },
    {
      role: "turning_point",
      title: "Enough to continue",
      paragraphs: [
        "On the next attempt he passed the difficult corner and nearly stopped from surprise. The piano kept moving. He followed, less neatly through the following phrase, until they reached a place where both could pause. He glanced back at the written passage to see what had changed.",
        "The page had not changed. He had used it differently, and somebody had stayed with the problem long enough to help. He did not announce that he had learned the tune. He put the horn to his mouth and asked to begin a little earlier.",
      ],
    },
    {
      role: "became",
      title: "When the piano rests",
      paragraphs: [
        "Later, in a performance imagined for this story, the piano fell quiet while John was still playing. For a beat the room felt wider than it had before. The familiar support was absent, and no rehearsed sentence in his head supplied a replacement for it.",
        "He heard the bass beneath him. He followed its movement, found his place and carried the phrase forward without making it especially impressive. When the piano returned, he did not lean into it quite so urgently. There had been other music to listen to while it was gone.",
      ],
    },
    {
      role: "bridge",
      title: "Not alone in the music",
      paragraphs: [
        "The particular rehearsal and performance are invented. Coltrane's own accounts describe questions, repeated practice and assistance from fellow musicians. This fiction stays inside that modest possibility: being experienced and needing help can occupy the same chair without one cancelling the other.",
        "Your difficulty need not resemble his or lead to any celebrated work. There is no test waiting at the end of this page. Only a room in which a question can remain a question, and another person's contribution need not make your own part less yours.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
