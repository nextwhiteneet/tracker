/** Default NEET (UG) syllabus structure used to prefill the setup wizard.
 *  Chapter names are standard NTA topics; lecture counts are sensible defaults
 *  that the student adjusts to match their own coaching/video source.
 */

export interface SyllabusChapter {
  name: string;
  cls: 11 | 12;
  lectures: number;
}

export interface SyllabusSubject {
  key: string;
  name: string;
  color: string;
  icon: string;
  lectureLength: number;
  chapters: SyllabusChapter[];
}

const c = (name: string, cls: 11 | 12, lectures: number): SyllabusChapter => ({
  name,
  cls,
  lectures,
});

export const SUBJECT_COLORS = [
  "#6C64E0", // indigo
  "#E15A7A", // rose
  "#2FA36B", // emerald
  "#E29A26", // amber
  "#3FA7D6", // sky
  "#B469E0", // violet
  "#E85C22", // flame
  "#5FA83E", // leaf
];

export const SUBJECT_ICONS = [
  "atom",
  "flask-conical",
  "leaf",
  "heart-pulse",
  "book-open",
  "microscope",
  "brain",
  "calculator",
];

export const DEFAULT_SYLLABUS: SyllabusSubject[] = [
  {
    key: "physics",
    name: "Physics",
    color: "#6C64E0",
    icon: "atom",
    lectureLength: 90,
    chapters: [
      c("Units and Measurements", 11, 3),
      c("Motion in a Straight Line", 11, 4),
      c("Motion in a Plane", 11, 5),
      c("Laws of Motion", 11, 5),
      c("Work, Energy and Power", 11, 4),
      c("System of Particles and Rotational Motion", 11, 6),
      c("Gravitation", 11, 4),
      c("Mechanical Properties of Solids", 11, 2),
      c("Mechanical Properties of Fluids", 11, 4),
      c("Thermal Properties of Matter", 11, 3),
      c("Thermodynamics", 11, 4),
      c("Kinetic Theory of Gases", 11, 2),
      c("Oscillations", 11, 4),
      c("Waves", 11, 4),
      c("Electric Charges and Fields", 12, 5),
      c("Electrostatic Potential and Capacitance", 12, 5),
      c("Current Electricity", 12, 6),
      c("Moving Charges and Magnetism", 12, 5),
      c("Magnetism and Matter", 12, 3),
      c("Electromagnetic Induction", 12, 4),
      c("Alternating Current", 12, 4),
      c("Electromagnetic Waves", 12, 2),
      c("Ray Optics and Optical Instruments", 12, 6),
      c("Wave Optics", 12, 4),
      c("Dual Nature of Radiation and Matter", 12, 3),
      c("Atoms", 12, 2),
      c("Nuclei", 12, 3),
      c("Semiconductor Electronics", 12, 4),
    ],
  },
  {
    key: "chemistry",
    name: "Chemistry",
    color: "#E15A7A",
    icon: "flask-conical",
    lectureLength: 75,
    chapters: [
      c("Some Basic Concepts of Chemistry", 11, 4),
      c("Structure of Atom", 11, 4),
      c("Classification of Elements and Periodicity", 11, 3),
      c("Chemical Bonding and Molecular Structure", 11, 6),
      c("Thermodynamics", 11, 5),
      c("Equilibrium", 11, 5),
      c("Redox Reactions", 11, 3),
      c("Organic Chemistry — Basic Principles (GOC)", 11, 6),
      c("Hydrocarbons", 11, 4),
      c("The s-Block Elements", 11, 2),
      c("The p-Block Elements (Class 11)", 11, 3),
      c("Solutions", 12, 4),
      c("Electrochemistry", 12, 4),
      c("Chemical Kinetics", 12, 4),
      c("The p-Block Elements (Class 12)", 12, 4),
      c("The d and f Block Elements", 12, 4),
      c("Coordination Compounds", 12, 5),
      c("Haloalkanes and Haloarenes", 12, 4),
      c("Alcohols, Phenols and Ethers", 12, 4),
      c("Aldehydes, Ketones and Carboxylic Acids", 12, 5),
      c("Amines", 12, 3),
      c("Biomolecules", 12, 3),
      c("Polymers", 12, 2),
    ],
  },
  {
    key: "botany",
    name: "Botany",
    color: "#2FA36B",
    icon: "leaf",
    lectureLength: 75,
    chapters: [
      c("The Living World", 11, 2),
      c("Biological Classification", 11, 4),
      c("Plant Kingdom", 11, 4),
      c("Morphology of Flowering Plants", 11, 4),
      c("Anatomy of Flowering Plants", 11, 3),
      c("Cell — The Unit of Life", 11, 5),
      c("Biomolecules", 11, 4),
      c("Cell Cycle and Cell Division", 11, 4),
      c("Photosynthesis in Higher Plants", 11, 5),
      c("Respiration in Plants", 11, 3),
      c("Plant Growth and Development", 11, 3),
      c("Sexual Reproduction in Flowering Plants", 12, 4),
      c("Principles of Inheritance and Variation", 12, 6),
      c("Molecular Basis of Inheritance", 12, 6),
      c("Microbes in Human Welfare", 12, 2),
      c("Biotechnology: Principles and Processes", 12, 3),
      c("Biotechnology and its Applications", 12, 2),
      c("Organisms and Populations", 12, 3),
      c("Ecosystem", 12, 3),
      c("Biodiversity and Conservation", 12, 2),
    ],
  },
  {
    key: "zoology",
    name: "Zoology",
    color: "#E29A26",
    icon: "heart-pulse",
    lectureLength: 75,
    chapters: [
      c("Animal Kingdom", 11, 5),
      c("Structural Organisation in Animals", 11, 3),
      c("Digestion and Absorption", 11, 4),
      c("Breathing and Exchange of Gases", 11, 3),
      c("Body Fluids and Circulation", 11, 5),
      c("Excretory Products and their Elimination", 11, 4),
      c("Locomotion and Movement", 11, 4),
      c("Neural Control and Coordination", 11, 5),
      c("Chemical Coordination and Integration", 11, 3),
      c("Human Reproduction", 12, 5),
      c("Reproductive Health", 12, 2),
      c("Evolution", 12, 4),
      c("Human Health and Disease", 12, 4),
      c("Strategies for Enhancement in Food Production", 12, 2),
    ],
  },
];

export function defaultExamDate(): string {
  // NEET is held on the first Sunday of May. Offer the upcoming one.
  const now = new Date();
  for (let yr = now.getFullYear(); ; yr++) {
    const d = new Date(yr, 4, 1); // May 1
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    if (d.getTime() > now.getTime() + 20 * 86400000) {
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    }
  }
}
