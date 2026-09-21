import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "rudolph",
  figureName: "Wilma Rudolph",
  title: "The Other Side of the Court",
  summary: "A young basketball player tries a different afternoon without knowing whether it will become anything more.",
  topics: ["learning", "changing-direction", "uncertainty"],
  contentNote: "Limited playing time and frustration about being on the sidelines. No illness, treatment-defiance or cure narrative.",
  inventionNote: "The particular game, teammate, rolled socks, first running exercise, thoughts and walk home are invented. The story gives no exact age or school year because the reviewed account does not establish that chronology. Its modest running experience is fictional, not a reconstruction of a documented tryout or an explanation of later Olympic results.",
  background: [
    { text: "A scholarly account describes Rudolph making a school basketball team, spending her first season on the bench, and receiving only limited playing time the following year.", sourceIds: ["school-account"] },
    { text: "The same account describes a coach inviting basketball players to try track, and Rudolph initially participating to remain active and fit for basketball. Exact school-grade calendar years and an exact tryout age are not established in that account.", sourceIds: ["school-account"] },
  ],
  sources: [
    { id: "school-account", title: "Foxes, not oxes: an excerpt from A Spectacular Leap", url: "https://www.uapress.com/2015/06/23/foxes-not-oxes-an-excerpt-from-a-spectacular-leap/", note: "University of Arkansas Press, June 23, 2015. The basketball and track-tryout passages are biographical narration; nearby memoir quotations do not turn every passage into Rudolph's own testimony." },
  ],
  pages: [
    {
      role: "scene",
      title: "Following the ball",
      paragraphs: [
        "Wilma followed the ball from the bench, her shoulders turning before she remembered to sit still. A pass crossed the court. She saw the opening, then saw it close. Her fingers pressed briefly against her knees as though they, too, had something to contribute.",
        "When she was called in near the end, the game seemed to speed up. By the time she found its rhythm, it was over. She untied her shoes slowly afterward, unwilling to admit how much of the afternoon she still had left in her.",
      ],
    },
    {
      role: "dark_moment",
      title: "The unused afternoon",
      paragraphs: [
        "At home, she rolled her socks together, unrolled them, and rolled them again. There was nothing remarkable to report. She had gone, watched, played a little, and come back. Wanting more had not made the minutes on the court any longer.",
        "She considered leaving the shoes beneath the chair for a while. Not giving up basketball forever; that was too large a thought. Just missing the next afternoon, so she would not have to bring home quite so much unused wanting.",
      ],
    },
    {
      role: "response",
      title: "A different invitation",
      paragraphs: [
        "When the basketball players were invited to try running, Wilma's first thought was still about basketball. Another way to stay active might be useful. She did not recognize a calling in the invitation. She recognized somewhere she could go after school.",
        "A teammate said she was going and asked whether Wilma wanted to walk over with her. Wilma picked up the rolled socks. The question was small enough to answer. They would go together, and she would see what the afternoon was like.",
      ],
    },
    {
      role: "struggle",
      title: "Without the ball",
      paragraphs: [
        "The first exercise felt unfamiliar. On the court she watched other players, passing lanes, the ball. Here she had to listen for instructions and learn where to stand. She started too soon, stopped, and returned to the place she had just left.",
        "A second attempt was not a discovery of effortless talent. It was an attempt, followed by breathing hard and waiting for the next instruction. She glanced at her teammate. They were both learning, with no useful way to pretend otherwise.",
      ],
    },
    {
      role: "turning_point",
      title: "Across the line",
      paragraphs: [
        "Later, Wilma completed a short run and slowed beyond the finish. Nothing announced itself. There was no grand certainty, no imagined crowd. But for those moments she had been inside the activity, not watching for someone to let her enter it.",
        "She walked back beside her teammate and asked what they would do next time. Only after asking did she notice that she had said next time. The afternoon had become something she could picture repeating, without needing it to become her whole future.",
      ],
    },
    {
      role: "became",
      title: "Two possibilities",
      paragraphs: [
        "On the way home they discussed a basketball play they still wanted to try. Wilma had not exchanged one identity for another at the edge of the track. She was carrying the old interest with her, along with a new set of instructions to remember.",
        "She put her shoes by the chair and left them where she could reach them. The day had not proved what kind of athlete she would become. It had given her an afternoon she had taken part in, and a reason to consider another.",
      ],
    },
    {
      role: "bridge",
      title: "Before a future is known",
      paragraphs: [
        "This fictional afternoon is not the origin story of Wilma Rudolph's medals. It makes no claim about medical recovery or the power of determination. Here, a young person simply tries something she does not yet know well.",
        "Your circumstances may be entirely different. There is no demand to find another activity, or to turn a disappointment into an achievement. This story can end with shoes beside a chair, without asking where yours will take you.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
