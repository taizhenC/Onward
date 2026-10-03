import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "rachmaninoff",
  figureName: "Sergei Rachmaninoff",
  title: "The Unfinished Page",
  summary: "A fictional afternoon at a composer's desk, where an honest letter becomes possible before the music does.",
  topics: ["creative-work", "asking-for-help", "uncertainty"],
  contentNote: "Creative difficulty, self-doubt and an unmet deadline. No diagnosis, treatment narrative or promise of recovery.",
  inventionNote: "The desk scene, crossed-out letter drafts, imagined melody, physical gestures and decision to leave an unfinished page visible are invented. They combine no historical letters into a claimed single event. The sources support only the requests and unfinished work summarized below, not a cure, breakthrough or causal link between the opera and concerto.",
  background: [
    { text: "In June 1900, Rachmaninoff wrote that he seemed to have lost his capacity to compose and asked Modest Tchaikovsky for more time with an opera libretto, offering to return it if waiting was impossible.", sourceIds: ["request"] },
    { text: "He later thanked Tchaikovsky for permission to retain that text. In separate 1901 correspondence, he said his Second Piano Concerto was unfinished and subsequently sent two movements for examination.", sourceIds: ["permission", "deadline", "movements"] },
  ],
  sources: [
    { id: "request", title: "Rachmaninoff to Modest Tchaikovsky, letter 158", url: "https://senar.ru/letters/158", note: "June 14/27, 1900. Russian correspondence transcribed from the 1978 Literary Heritage edition; self-assessment and conditional request, not a clinical record." },
    { id: "permission", title: "Rachmaninoff to Modest Tchaikovsky, letter 160", url: "https://senar.ru/letters/160", note: "July 5/18, 1900. Written thanks for permission to keep the libretto; no witnessed delivery scene." },
    { id: "deadline", title: "Rachmaninoff to Vasily Safonov, letter 175", url: "https://senar.ru/letters/175", note: "February 18, 1901, Old Style. Concerto unfinished and withdrawal from a scheduled concert." },
    { id: "movements", title: "Rachmaninoff to Alexander Goldenweiser, letter 178", url: "https://senar.ru/letters/178", note: "April 19, 1901, Old Style. Two movements sent for examination; first movement still incomplete." },
  ],
  pages: [
    {
      role: "scene",
      title: "Two kinds of paper",
      paragraphs: [
        "On Sergei's desk lay a sheet ruled for music and a sheet ruled for nothing. He had brought the second one there to write a letter. Somehow he kept turning toward the first, as though the notes might settle the matter before he needed to ask.",
        "A phrase occupied the upper corner. Below it waited a generous amount of empty paper. He moved the lamp, although the afternoon was not yet dark, and read the few bars without touching the keys.",
      ],
    },
    {
      role: "dark_moment",
      title: "What to promise",
      paragraphs: [
        "The letter began briskly. Too briskly. Reading it back, he found a confident composer who appeared to know when the work would be ready. He could not recognize that person at the desk. He drew a line through the promise.",
        "The next beginning was an apology that grew until it crowded out the request. He stopped again. Outside the room, ordinary sounds continued without waiting for him to become either confident or eloquent. He felt stranded between the two spoiled beginnings.",
      ],
    },
    {
      role: "response",
      title: "The smaller question",
      paragraphs: [
        "He turned the letter over and wrote down only what he was asking for: more time with the text. Not forgiveness for every empty measure. Not agreement that the work would be good. Time, if the other person could spare it.",
        "He added the part he would rather leave out. The answer might be no. The text belonged to someone who had plans of his own. A request that made room for refusal looked smaller on the paper, but also more possible to send.",
      ],
    },
    {
      role: "struggle",
      title: "The troublesome measure",
      paragraphs: [
        "Before copying the letter, Sergei returned to the music. He played the phrase and tried a different ending. The new version turned a corner only to find another blank wall. He rubbed out a note so thoroughly that the paper grew rough.",
        "For a moment he considered putting the letter away until he had something better to report. That would make the afternoon simpler: no request, no reply, no visible uncertainty. He set both hands in his lap and heard the unfinished phrase stop.",
      ],
    },
    {
      role: "turning_point",
      title: "Nothing added",
      paragraphs: [
        "When he returned to the letter, he did not improve the promise. There was no promise left to improve. He copied the request, its limit, and the possibility of sending the text back. Then he signed his name beneath what he actually knew.",
        "The music had not changed during those minutes. The page still ended too soon. But he no longer needed to finish it in order to tell someone where he stood. He folded the letter before he could add another sweeping assurance.",
      ],
    },
    {
      role: "became",
      title: "Room on the desk",
      paragraphs: [
        "He placed the folded paper near the door. A reply would come on its own schedule, and permission, if it came, would not supply the missing notes. The request had done only the work a request could do.",
        "Back at the desk, he laid a clean sheet beside the unfinished one. He did not conceal the rubbed patch or copy the phrase into a more impressive form. When the room began to dim, he lowered the lamp toward the work as it was.",
      ],
    },
    {
      role: "bridge",
      title: "No promised concerto",
      paragraphs: [
        "This imagined afternoon is not an account of how Rachmaninoff recovered, nor an explanation of any completed composition. It leaves a letter ready to send and a piece of music still incomplete.",
        "Your unfinished things need not resemble his. Nothing in this fiction requires a breakthrough from you. If the folded letter is enough company for now, the rest of the page can remain open.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
