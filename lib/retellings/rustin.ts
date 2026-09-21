import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "rustin",
  figureName: "Bayard Rustin",
  title: "A Place to Ask",
  summary: "At an imagined gathering inspired by the work of organizing a march, a question from a volunteer changes the shape of a plan.",
  topics: ["working-together", "asking-for-help", "uncertainty"],
  contentNote: "The responsibility of collective organizing and an incomplete plan. No violence or invented allegations against movement colleagues.",
  inventionNote: "The volunteer, information table, lost meeting place, handwritten sign and every interaction in this story are invented. The gathering is an imagined organizing scene, not a reconstruction of an incident at the March on Washington. Sources support Rustin's collaborative logistical work and his recognition of unfinished work, not the fictional problem or its solution.",
  background: [
    { text: "In a 1979 interview, Rustin described organizing logistics and nonviolence for the 1963 March on Washington with representatives of participating organizations.", sourceIds: ["organizing-interview"] },
    { text: "In October 1963, he wrote that preparation for the coalition's next steps had been inadequate. The successful gathering had not completed the movement's work.", sourceIds: ["next-steps"] },
  ],
  sources: [
    { id: "organizing-interview", title: "Interview with Bayard Rustin, 1979", url: "https://americanarchive.org/catalog/cpb-aacip_151-rr1pg1jj76", note: "Washington University interview preserved by AAPB. Answers about his march role, funding and management; retrospective testimony, not evidence of this fictional scene." },
    { id: "next-steps", title: "The Meaning of the March on Washington", url: "https://crmvet.lib.duke.edu/info/mowrust.html", note: "Rustin's October 1963 Liberation article, transcribed by Civil Rights Movement Veterans and hosted by Duke. Opening and numbered sections 1–2 address unfinished preparation and coalition work." },
  ],
  pages: [
    {
      role: "scene",
      title: "Before the tables fill",
      paragraphs: [
        "Bayard stood beside a table while a volunteer read through the plan. Around them, people carried bundles, straightened signs and checked the places where arriving groups would gather. Each task had acquired another small task since breakfast.",
        "The volunteer traced a route on the paper, then stopped. What happened if someone arrived apart from their group and did not know its meeting place? Bayard glanced toward the signs. They answered several questions, but not that one.",
      ],
    },
    {
      role: "dark_moment",
      title: "A gap with people in it",
      paragraphs: [
        "He wanted, briefly, to be asked something already settled. There were so many settled things to point to: arrangements made, responsibilities shared, places marked. Yet the volunteer's question opened a gap no amount of completed work could fill by itself.",
        "He pictured a person standing among strangers, holding the name of a group that everyone else appeared to understand. On the plan, the missing instruction was a little white space. For that person it would be the entire difficulty of the morning.",
      ],
    },
    {
      role: "response",
      title: "Who knows this part?",
      paragraphs: [
        "Bayard asked the volunteer how she would handle it. She suggested a place where people could ask without first knowing whom to ask. A table, perhaps, with someone who could contact the representatives of the different groups.",
        "They brought over two people who knew the arrival arrangements. The problem became less tidy as they talked. A table would need a sign. The person behind it would need information that was not yet all in one place. They began there.",
      ],
    },
    {
      role: "struggle",
      title: "Working out the ordinary",
      paragraphs: [
        "One suggested location was easy to see but too close to the busiest route. Another was quieter and almost invisible. They carried the table a short distance, stood back, and carried it again. The volunteer kept the unfinished sign under one arm.",
        "Bayard checked an arrival note while someone else fetched the remaining information. He could not keep every other arrangement in view at once. He had to let colleagues take their portions of the morning beyond the reach of his own eyes.",
      ],
    },
    {
      role: "turning_point",
      title: "The first question",
      paragraphs: [
        "Before they had finished, someone approached to ask where a particular group was meeting. The volunteer consulted the new list and turned to a representative beside her. Between them, they could point the person toward the right place.",
        "Bayard had been standing close enough to answer, but the question had not needed to come through him. He watched the visitor walk away. The plan had become a little more useful because it now contained other people's knowledge where his had stopped.",
      ],
    },
    {
      role: "became",
      title: "Leave room at the table",
      paragraphs: [
        "They fixed the sign in place. The volunteer asked for a spare pencil, and Bayard found one among his papers. The table looked ordinary. Anyone passing might have assumed it had always been part of the arrangements.",
        "There would be more questions, including questions this table could not answer. He left its workers room to work and went toward the next task. Behind him, somebody pulled up another chair. The morning continued in more hands than his.",
      ],
    },
    {
      role: "bridge",
      title: "One table, not the whole work",
      paragraphs: [
        "This imagined scene cannot stand in for the history, stakes or collective labor of the March on Washington. Its smaller subject is a plan becoming useful to one more person, through a question its organizer had not anticipated.",
        "Your responsibilities are your own, and this fiction sets no measure for carrying them. You may leave the table with its volunteers. Nothing here asks you to organize the whole morning before you are allowed to pause.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
