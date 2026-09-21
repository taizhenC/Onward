import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "wang",
  figureName: "Vera Wang",
  title: "When the Dress Moved",
  summary: "During an invented early design session, a beautiful sketch meets the ordinary business of sitting down and crossing a room.",
  topics: ["creative-work", "changing-direction", "working-together"],
  contentNote: "An imperfect design and the uncertainty of trying a new direction. No body criticism or claims about private relationships, finances or workplace mistreatment.",
  inventionNote: "The sample dress, unnamed fit model and colleague, studio session, dialogue conveyed indirectly, thoughts and revisions are invented. They are a benign fictional design exercise, not claims about Vera Wang's actual conduct or a real customer. The sources support only her prior fashion experience, bridal concept and first-store chronology below.",
  background: [
    { text: "Wang described bringing years of editorial and design experience to a bridal business focused on simpler, modern wedding clothes.", sourceIds: ["design-interview"] },
    { text: "Her official brand history dates the opening of the first flagship bridal store to 1990. This was a change of direction with accumulated experience, not a start from no resources or skills.", sourceIds: ["brand-history", "design-interview"] },
  ],
  sources: [
    { id: "design-interview", title: "Meet Vera Wang, the Bride Maker", url: "https://www.vogue.in/content/meet-vera-wang-bride-maker", note: "Interview by Bandana Tewari, Vogue India, June 5, 2010. First two answers cover editorial experience, the 1987 accessories design role, and the bridal-market concept." },
    { id: "brand-history", title: "Vera Wang: The Brand", url: "https://www.verawang.com/pages/the-brand", note: "Official company history, founding and first flagship store account. It supplies the 1990 background, not the invented design-session details." },
  ],
  pages: [
    {
      role: "scene",
      title: "The still version",
      paragraphs: [
        "On the drawing, the dress had done exactly what Vera wanted. A clean line, an unexpected fold, nothing asking to be admired twice. The sample on the fitting stand looked promising too. She circled it, moving a lamp so she could see the fabric without a deep shadow.",
        "Then the fit model put it on and crossed the room. The fold pulled in a direction the drawing had never suggested. Vera watched the hem hesitate at each step. Her lovely still version had acquired a problem as soon as somebody moved.",
      ],
    },
    {
      role: "dark_moment",
      title: "The drawing looks back",
      paragraphs: [
        "She glanced between the sketch and the dress. It would be easy to keep looking at the sketch. There, every decision still appeared to have been the right one, and the person inside the clothes had no need to sit down.",
        "This new direction had seemed so clear when she described it: different bridal clothes, with room for a different sensibility. Now the whole large idea had narrowed to a small practical question about fabric. She did not yet have its answer.",
      ],
    },
    {
      role: "response",
      title: "Try the chair",
      paragraphs: [
        "Vera asked the model to try sitting. A colleague brought a chair away from the wall. They watched what happened, then talked about where the fabric caught. Nobody needed to defend the sketch. The dress was giving them information it could not give on a hanger.",
        "She loosened the pinned fold and stepped back. The line changed. Some of what she had liked disappeared with it, which was irritating, but the model stood and sat with more ease. Vera asked her to cross the room again.",
      ],
    },
    {
      role: "struggle",
      title: "Neither version",
      paragraphs: [
        "Now the shape was too loose in another place. They tried a smaller adjustment, then undid it. A pin went back into the cushion; another came out. The afternoon advanced through versions that no one would photograph or remember as a finished design.",
        "Vera brought her experience to each attempt, but experience did not spare her the attempts. She could see what was wrong sooner than she could see what would work. The model rested while Vera and her colleague examined the sample off the body.",
      ],
    },
    {
      role: "turning_point",
      title: "Follow the movement",
      paragraphs: [
        "Her colleague held the fabric while Vera shifted the fold rather than tightening it. They had been trying to preserve the drawing's line. This new position gave the movement a little space of its own. From the side, it made a different line altogether.",
        "The model tried it once more. She walked, turned, and took the chair. Vera watched the fabric settle. The result was not the dress she had drawn that morning. It was, at last, a version worth looking at while someone lived inside it.",
      ],
    },
    {
      role: "became",
      title: "A useful revision",
      paragraphs: [
        "There were still finishing questions. Vera marked them instead of pretending the sample was ready. She thanked the model, checked the changes with her colleague, and made a new sketch with the revised fold in its unfamiliar place.",
        "She kept the first drawing too. It no longer embarrassed her or needed to win the argument. It showed where they had begun. On the stand, the sample waited for the next session, carrying a few careful marks toward work that remained to be done.",
      ],
    },
    {
      role: "bridge",
      title: "Not an origin myth",
      paragraphs: [
        "This studio session is invented. It does not explain Vera Wang's business, claim access to her private thoughts, or turn a single design adjustment into the reason for a career. It ends with a sample that still needs work.",
        "There is no finished design required from you here. If you want to keep anything from the fiction, perhaps it is the first drawing remaining on the table beside the second. A changed idea need not erase the work that brought it there.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
