import type { Retelling } from "../retelling-types";

const story = {
  kind: "fictionalized-retelling-v1",
  slug: "lamarr",
  figureName: "Hedy Lamarr",
  title: "The Name on the Form",
  summary: "An inventor who thought the paperwork was finished has to return to it, one carefully checked line at a time.",
  topics: ["uncertainty", "creative-work", "working-together"],
  contentNote: "Deadline pressure and frustration with administrative work.",
  inventionNote: "The desk, pen, imagined reading and signing moments, envelope, private thoughts and closing gesture are invented. The surviving letters document requests and attorneys' reports, not Lamarr's feelings or the exact time she handled a form. This is not a story of technological deployment or vindication against unnamed detractors.",
  background: [
    { text: "In April 1942, Lamarr's attorneys warned that an affidavit and payment were needed before a patent deadline; subsequent correspondence reported a signature-name mismatch and then a properly executed replacement form.", sourceIds: ["deadline-letter", "mismatch-telegram", "correction-letter"] },
    { text: "Patent 2,292,387 was granted to Hedy Kiesler Markey and George Antheil on August 11, 1942, for a proposed communication system that changed transmitter and receiver frequencies together to impede interference.", sourceIds: ["patent"] },
  ],
  sources: [
    { id: "deadline-letter", title: "Lyon & Lyon to Hedy Lamarr, April 13, 1942", url: "https://ids.si.edu/ids/deliveryService?max_w=1400&id=NMAH-AC1590-0000025-01", note: "Smithsonian Hedy Lamarr Papers; opening page of the two-page deadline warning reviewed in the source packet." },
    { id: "mismatch-telegram", title: "Bacon & Thomas to Lyon & Lyon, April 18, 1942", url: "https://ids.si.edu/ids/deliveryService?max_w=1400&id=NMAH-AC1590-0000033-01", note: "Smithsonian original telegram reporting a name mismatch and requesting a corrected form." },
    { id: "correction-letter", title: "Lyon & Lyon to Bacon & Thomas, April 18, 1942", url: "https://ids.si.edu/ids/deliveryService?max_w=1400&id=NMAH-AC1590-0000028", note: "Attorneys' report that a properly executed form was enclosed; not a separately inspected replacement affidavit." },
    { id: "patent", title: "United States patent 2,292,387 — Secret Communication System", url: "https://patents.google.com/patent/US2292387A/en", note: "Original patent front matter and description; confirms the grant and proposal, not adoption or successful deployment." },
  ],
  pages: [
    {
      role: "scene",
      title: "The cleared corner",
      paragraphs: [
        "Hedy had cleared a corner of the desk for the papers, moving everything else into a less convincing arrangement along the far edge. A pen lay ready beside them. She wanted the business finished properly, not merely shifted from one pile to another until it became urgent again.",
        "The invention existed in descriptions and drawings, in the problem she and her collaborator had worked on. These papers were part of that work too, though they offered none of its pleasure. She read the instructions once, then returned to the first line and read more slowly.",
      ],
    },
    {
      role: "dark_moment",
      title: "Before the deadline",
      paragraphs: [
        "The warning was plain enough. If the required steps were not completed in time, the application could be lost. A deadline did not care whether the missing thing was an idea or a signature. She placed a finger beneath the relevant sentence and held it there.",
        "She disliked how much power a thin page could acquire. The work felt larger than this, but feeling that did not excuse anything on the form. She could keep returning to the drawings, where the problem was interesting, or attend to what had to move next.",
      ],
    },
    {
      role: "response",
      title: "Ready to send",
      paragraphs: [
        "In the scene we imagine, she signed, checked the accompanying payment and arranged the pages in their envelope. The work would travel through other hands before reaching its destination. She could do her part of the sequence; she could not be every person in it.",
        "With the envelope ready, she moved the pen away and allowed the cleared corner to become ordinary desk again. There were other things waiting for attention. She felt the small relief of a finished errand, the kind that seldom seems important until it returns unfinished.",
      ],
    },
    {
      role: "struggle",
      title: "One name, two forms",
      paragraphs: [
        "Then came the mismatch. The name used for the signature did not agree with the name on the application. Another correctly signed form was needed. Hedy read the message twice, the second time looking for some larger complication hidden behind the plain explanation.",
        "There was no larger explanation to be found there. There was another form. She set it on the same corner of the desk and felt a flash of irritation at the pen, an object which had done nothing wrong. This time she left it capped until she had checked the name.",
      ],
    },
    {
      role: "turning_point",
      title: "Line by line",
      paragraphs: [
        "She placed the papers beside each other. It was an unglamorous kind of attention, comparing one line with another instead of imagining a system at work. She slowed down where she wanted to hurry, then signed the new form and looked at it once more.",
        "The correspondence would continue elsewhere. The correction would need handling and forwarding by the people doing that work. For this invented moment, her part was complete. She set the pen down without announcing to herself that every obstacle had now been removed.",
      ],
    },
    {
      role: "became",
      title: "A place in the file",
      paragraphs: [
        "The real record later contains a granted patent naming both inventors. In our imagined closing scene, Hedy opens a folder and puts the completed document with the earlier papers. The untidy sequence remains there: the request, the mismatch, the correction, the work of several people.",
        "The document cannot say how the proposed system will be used, or whether it will be used. It records something narrower. She runs a hand over the folder to flatten it, then leaves it where she can find it again. The desk is not entirely clear, but this part has a place.",
      ],
    },
    {
      role: "bridge",
      title: "A small correction",
      paragraphs: [
        "The desk scenes and their feelings are fiction, not facts extracted from an attorney's letter. They give an ordinary shape to a documented correction without turning it into a secret account of Hedy Lamarr's character, or proof that persistence brings public recognition.",
        "Your unfinished business may have quite different stakes. This story makes no promise about its outcome. It ends with something smaller than triumph: a mistake can need attention without becoming an explanation of the whole person whose name appears on the page.",
      ],
    },
  ],
} satisfies Retelling;

export default story;
