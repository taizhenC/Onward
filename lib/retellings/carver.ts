import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "carver",
  figureName: "George Washington Carver",
  title: "A Place on the Washing Line",
  summary: "A student trying to pay his way finds that accepting help does not erase the work already in his hands.",
  topics: ["asking-for-help", "learning", "recognition-and-money"],
  contentNote: "Food insecurity, financial pressure and reluctance to disclose need.",
  inventionNote: "The washing-line scenes, unnamed student, meal, laundry list, sketch and private thoughts are invented. The story compresses a period of community support into fictional encounters; it does not identify a single rescuer or reconstruct an actual day in Carver's life.",
  background: [
    { text: "Carver studied art and piano at Simpson College in 1890–1891, before transferring to Iowa Agricultural College.", sourceIds: ["simpson"] },
    { text: "In an autobiographical fragment, he recalled supporting himself through laundry work, having insufficient food, hesitating to tell strangers and receiving help from faculty, students and townspeople.", sourceIds: ["fragment"] },
  ],
  sources: [
    { id: "fragment", title: "Carver's autobiographical fragment — National Park Service", url: "https://www.nps.gov/gwca/learn/historyculture/index.htm", note: "Institutional transcription of his incomplete retrospective recollections; supports hardship and collective help, not the invented encounters." },
    { id: "simpson", title: "George Washington Carver Collection — Simpson College", url: "https://www.simpson.edu/academics-programs/dunn-library/archives-special-collections/george-washington-carver-collection/", note: "College archive context for art and piano study and the subsequent transfer." },
  ],
  pages: [
    {
      role: "scene",
      title: "Before the lesson",
      paragraphs: [
        "George held a wet sleeve away from the ground and reached for another peg. The washing line sagged toward him. He shifted a sheet, making room for the shirt, then stood back to see whether anything touched the dirt. There was always another small adjustment.",
        "His drawing paper waited indoors beneath a book. He had chosen a leaf for the day's study, one with an edge that curled instead of lying politely flat. He wanted time to look at it. First the clothes had to dry, and then somebody had to pay.",
      ],
    },
    {
      role: "dark_moment",
      title: "The empty shelf",
      paragraphs: [
        "Inside, he opened the cupboard as though checking a familiar sum. What remained would not stretch very far. He closed it gently. Outside, people crossed toward their lessons, carrying the ordinary things a student needed. He had become a student, but admission had not filled the shelf.",
        "He rehearsed a sentence about needing more laundry customers. Each version seemed to ask for something larger than he meant. By the time he reached the door, he had reduced it to a greeting, useful for passing someone in a corridor and useless for explaining hunger.",
      ],
    },
    {
      role: "response",
      title: "A plain list",
      paragraphs: [
        "He took a scrap of paper and wrote down the work he could accept. Shirts. Sheets. Ordinary washing. The list was easier than the speech. He put his name beneath it and carried it with his drawing paper, trying not to rub the two sheets together.",
        "A fellow student noticed the list. George let him read it instead of turning the page over. When the student asked whether he could mention the laundry to others, George said yes. The word came out quietly, but there was no need to say it twice.",
      ],
    },
    {
      role: "struggle",
      title: "Not enough hours",
      paragraphs: [
        "Over the following days, more washing arrived. This brought money and also wet cuffs, tired hands and calculations about daylight. Some evenings his leaf drawing advanced by hardly a line. Work was help, but it was still work; an overflowing basket did not create another hour.",
        "When an invitation to share a meal came, he nearly answered that he was busy. He was busy. He was also hungry. He stood with a shirt half folded, unable to find a reply that made him entirely independent and allowed him to accept the invitation.",
      ],
    },
    {
      role: "turning_point",
      title: "Another chair",
      paragraphs: [
        "At the table, nobody required the reply he had been trying to compose. Someone moved a chair. Someone asked what he was drawing. He described the troublesome leaf, then caught himself explaining its curved edge with his hands while the food passed toward him.",
        "Nothing about the meal cancelled his bills. Yet for that hour he was not delivering a complete account of his need. He was eating, and talking about something he had noticed. When he thanked his hosts, the words did not have to do every possible job.",
      ],
    },
    {
      role: "became",
      title: "The unfinished leaf",
      paragraphs: [
        "The next morning there was laundry again. George sorted it, leaving space on the line for the heavier pieces. He also left the drawing where he could reach it. Its unfinished edge no longer looked quite so much like an accusation about the previous evening.",
        "He worked on the curve before going out. Later, when the student passed with another customer's bundle, George took it and asked after him. There was washing to return, another conversation to have, and help from more than one direction. He remained part of all of it.",
      ],
    },
    {
      role: "bridge",
      title: "Still his hands",
      paragraphs: [
        "The leaf and the shared meal belong to this fiction, not to Carver's surviving recollections. His account does name help from other people. Our invented ending stays small: a student can receive something he needs without vanishing from the life he is working to build.",
        "Your situation is not a version of his, and this story cannot promise that support will arrive. It makes no debt out of your difficulties. If the image offers anything, it is room at a table where needing food does not require explaining your whole worth.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
