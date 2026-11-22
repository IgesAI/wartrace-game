/**
 * CANDIDATE demo content for local play. NOT REVIEWED, NOT PUBLISHABLE.
 *
 * Drafted by an AI coding agent from general knowledge as bounded, finite-roster prompts
 * (docs/04_DATA_PROVENANCE.md "Finite roster"). Citations are tier-C discovery pages
 * (Wikipedia), which are never sufficient alone for publication. Rarity values are
 * uncalibrated editorial guesses. A human historian must verify membership, aliases,
 * sources and rarity before any of this can become `verified` content.
 */
export type DemoAnswer = {
  key: string;
  canonicalName: string;
  entityType: string;
  disambiguation?: string;
  rarity: number;
  aliases: string[];
};

export type DemoQuestion = {
  familyKey: string;
  topic: string;
  prompt: string;
  eligibility: string;
  exclusions: string;
  coverageNote: string;
  source: { title: string; url: string; publisher: string };
  answers: DemoAnswer[];
};

export const DEMO_HISTORY_OPERATION = {
  title: "Operation Fogline",
  blurb:
    "Seven bounded rosters from exploration, antiquity, the World Wars and the space age. Local demo content: candidate answers awaiting historian review.",
};

const wiki = (title: string, slug: string) => ({
  title: `${title} — Wikipedia`,
  url: `https://en.wikipedia.org/wiki/${slug}`,
  publisher: "Wikipedia (tier C, discovery only)",
});

export const DEMO_HISTORY_QUESTIONS: DemoQuestion[] = [
  {
    familyKey: "demo.ancient.seven-wonders",
    topic: "Antiquity",
    prompt: "Name one of the Seven Wonders of the Ancient World.",
    eligibility: "The seven monuments of the classical Hellenistic list (Antipater of Sidon / Philo tradition).",
    exclusions: "Medieval, modern or 'new' wonders lists; alternative entries such as the Walls of Babylon.",
    coverageNote: "Finite set of seven; candidate only.",
    source: wiki("Seven Wonders of the Ancient World", "Seven_Wonders_of_the_Ancient_World"),
    answers: [
      { key: "great-pyramid", canonicalName: "Great Pyramid of Giza", entityType: "monument", rarity: 0.05, aliases: ["Great Pyramid of Giza", "Great Pyramid", "Pyramid of Giza", "Pyramid of Khufu", "Pyramid of Cheops", "Giza Pyramid"] },
      { key: "hanging-gardens", canonicalName: "Hanging Gardens of Babylon", entityType: "monument", rarity: 0.15, aliases: ["Hanging Gardens of Babylon", "Hanging Gardens", "Gardens of Babylon"] },
      { key: "colossus-rhodes", canonicalName: "Colossus of Rhodes", entityType: "monument", rarity: 0.3, aliases: ["Colossus of Rhodes", "Colossus", "The Colossus"] },
      { key: "lighthouse-alexandria", canonicalName: "Lighthouse of Alexandria", entityType: "monument", rarity: 0.4, aliases: ["Lighthouse of Alexandria", "Pharos of Alexandria", "Pharos", "Alexandria Lighthouse"] },
      { key: "statue-zeus", canonicalName: "Statue of Zeus at Olympia", entityType: "monument", rarity: 0.58, aliases: ["Statue of Zeus at Olympia", "Statue of Zeus", "Zeus at Olympia"] },
      { key: "temple-artemis", canonicalName: "Temple of Artemis at Ephesus", entityType: "monument", rarity: 0.62, aliases: ["Temple of Artemis at Ephesus", "Temple of Artemis", "Artemision", "Temple of Diana"] },
      { key: "mausoleum", canonicalName: "Mausoleum at Halicarnassus", entityType: "monument", rarity: 0.8, aliases: ["Mausoleum at Halicarnassus", "Mausoleum of Halicarnassus", "Tomb of Mausolus", "Mausoleum of Mausolus"] },
    ],
  },
  {
    familyKey: "demo.exploration.columbus-1492-ships",
    topic: "Exploration",
    prompt: "Name one of the three ships of Christopher Columbus's first Atlantic voyage (1492).",
    eligibility: "The three vessels that sailed from Palos in August 1492.",
    exclusions: "Ships of later voyages.",
    coverageNote: "Finite set of three; Niña's registered name 'Santa Clara' accepted as alias. Candidate only.",
    source: wiki("Voyages of Christopher Columbus", "Voyages_of_Christopher_Columbus"),
    answers: [
      { key: "santa-maria", canonicalName: "Santa María", entityType: "ship", rarity: 0.1, aliases: ["Santa María", "Santa Maria", "La Santa María", "La Santa Maria"] },
      { key: "nina", canonicalName: "Niña", entityType: "ship", rarity: 0.25, aliases: ["Niña", "Nina", "La Niña", "La Nina", "Santa Clara"] },
      { key: "pinta", canonicalName: "Pinta", entityType: "ship", rarity: 0.3, aliases: ["Pinta", "La Pinta"] },
    ],
  },
  {
    familyKey: "demo.ww1.central-powers",
    topic: "First World War",
    prompt: "Name one of the four Central Powers of the First World War.",
    eligibility: "States formally allied as the Central Powers, 1914–1918.",
    exclusions: "Modern successor-state names (e.g. 'Turkey', 'Austria') are not accepted for the historical states.",
    coverageNote: "Finite set of four; candidate only. Alias policy on successor names needs editorial sign-off.",
    source: wiki("Central Powers", "Central_Powers"),
    answers: [
      { key: "german-empire", canonicalName: "German Empire", entityType: "state", rarity: 0.05, aliases: ["German Empire", "Germany", "Imperial Germany"] },
      { key: "austria-hungary", canonicalName: "Austria-Hungary", entityType: "state", rarity: 0.2, aliases: ["Austria-Hungary", "Austria Hungary", "Austro-Hungarian Empire", "Austro-Hungary", "Dual Monarchy"] },
      { key: "ottoman-empire", canonicalName: "Ottoman Empire", entityType: "state", rarity: 0.45, aliases: ["Ottoman Empire", "Ottomans", "The Ottoman Empire"] },
      { key: "bulgaria", canonicalName: "Kingdom of Bulgaria", entityType: "state", rarity: 0.75, aliases: ["Kingdom of Bulgaria", "Bulgaria", "Tsardom of Bulgaria"] },
    ],
  },
  {
    familyKey: "demo.coldwar.nato-founders",
    topic: "Cold War",
    prompt: "Name one of the twelve founding signatory states of the North Atlantic Treaty (4 April 1949).",
    eligibility: "The twelve original signatories in Washington, D.C., April 1949.",
    exclusions: "States that acceded later (e.g. Greece and Turkey in 1952).",
    coverageNote: "Finite set of twelve; candidate only.",
    source: wiki("North Atlantic Treaty", "North_Atlantic_Treaty"),
    answers: [
      { key: "usa", canonicalName: "United States", entityType: "state", rarity: 0.02, aliases: ["United States", "United States of America", "USA", "US", "U.S.", "U.S.A.", "America"] },
      { key: "uk", canonicalName: "United Kingdom", entityType: "state", rarity: 0.05, aliases: ["United Kingdom", "UK", "U.K.", "Britain", "Great Britain"] },
      { key: "france", canonicalName: "France", entityType: "state", rarity: 0.08, aliases: ["France"] },
      { key: "canada", canonicalName: "Canada", entityType: "state", rarity: 0.2, aliases: ["Canada"] },
      { key: "italy", canonicalName: "Italy", entityType: "state", rarity: 0.3, aliases: ["Italy"] },
      { key: "netherlands", canonicalName: "Netherlands", entityType: "state", rarity: 0.4, aliases: ["Netherlands", "The Netherlands", "Holland"] },
      { key: "belgium", canonicalName: "Belgium", entityType: "state", rarity: 0.4, aliases: ["Belgium"] },
      { key: "norway", canonicalName: "Norway", entityType: "state", rarity: 0.5, aliases: ["Norway"] },
      { key: "denmark", canonicalName: "Denmark", entityType: "state", rarity: 0.52, aliases: ["Denmark"] },
      { key: "portugal", canonicalName: "Portugal", entityType: "state", rarity: 0.65, aliases: ["Portugal"] },
      { key: "luxembourg", canonicalName: "Luxembourg", entityType: "state", rarity: 0.75, aliases: ["Luxembourg"] },
      { key: "iceland", canonicalName: "Iceland", entityType: "state", rarity: 0.85, aliases: ["Iceland"] },
    ],
  },
  {
    familyKey: "demo.ww2.normandy-beaches",
    topic: "Second World War",
    prompt: "Name one of the five Allied landing-beach code names in Normandy on 6 June 1944.",
    eligibility: "The five assault beach sector code names of Operation Neptune.",
    exclusions: "Sub-sector names (e.g. 'Dog Green'), inland objectives.",
    coverageNote: "Finite set of five; candidate only.",
    source: wiki("Normandy landings", "Normandy_landings"),
    answers: [
      { key: "omaha", canonicalName: "Omaha Beach", entityType: "place", rarity: 0.1, aliases: ["Omaha", "Omaha Beach"] },
      { key: "utah", canonicalName: "Utah Beach", entityType: "place", rarity: 0.35, aliases: ["Utah", "Utah Beach"] },
      { key: "juno", canonicalName: "Juno Beach", entityType: "place", rarity: 0.45, aliases: ["Juno", "Juno Beach"] },
      { key: "gold", canonicalName: "Gold Beach", entityType: "place", rarity: 0.5, aliases: ["Gold", "Gold Beach"] },
      { key: "sword", canonicalName: "Sword Beach", entityType: "place", rarity: 0.55, aliases: ["Sword", "Sword Beach"] },
    ],
  },
  {
    familyKey: "demo.space.vostok-cosmonauts",
    topic: "Space age",
    prompt: "Name a cosmonaut who flew on a crewed Vostok mission (1961–1963).",
    eligibility: "Pilots of Vostok 1 through Vostok 6.",
    exclusions: "Backup crews, Voskhod and later programmes.",
    coverageNote: "Finite set of six; transliteration aliases need editorial review. Candidate only.",
    source: wiki("Vostok programme", "Vostok_programme"),
    answers: [
      { key: "gagarin", canonicalName: "Yuri Gagarin", entityType: "person", rarity: 0.05, aliases: ["Yuri Gagarin", "Yury Gagarin", "Gagarin"] },
      { key: "tereshkova", canonicalName: "Valentina Tereshkova", entityType: "person", rarity: 0.4, aliases: ["Valentina Tereshkova", "Tereshkova"] },
      { key: "titov", canonicalName: "Gherman Titov", entityType: "person", rarity: 0.7, aliases: ["Gherman Titov", "German Titov", "Titov"] },
      { key: "nikolayev", canonicalName: "Andriyan Nikolayev", entityType: "person", rarity: 0.85, aliases: ["Andriyan Nikolayev", "Andrian Nikolayev", "Andrian Nikolaev", "Nikolayev", "Nikolaev"] },
      { key: "popovich", canonicalName: "Pavel Popovich", entityType: "person", rarity: 0.85, aliases: ["Pavel Popovich", "Popovich"] },
      { key: "bykovsky", canonicalName: "Valery Bykovsky", entityType: "person", rarity: 0.9, aliases: ["Valery Bykovsky", "Valeri Bykovsky", "Bykovsky"] },
    ],
  },
  {
    familyKey: "demo.space.apollo-moonwalkers",
    topic: "Space age",
    prompt: "Name one of the twelve people who walked on the Moon during the Apollo programme.",
    eligibility: "Astronauts who performed lunar surface EVAs on Apollo 11, 12, 14, 15, 16 or 17.",
    exclusions: "Command module pilots who orbited without landing.",
    coverageNote: "Finite set of twelve; surname-only aliases are unique within this set. Candidate only.",
    source: wiki("List of Apollo astronauts", "List_of_Apollo_astronauts"),
    answers: [
      { key: "armstrong", canonicalName: "Neil Armstrong", entityType: "person", rarity: 0.02, aliases: ["Neil Armstrong", "Armstrong"] },
      { key: "aldrin", canonicalName: "Buzz Aldrin", entityType: "person", rarity: 0.08, aliases: ["Buzz Aldrin", "Edwin Aldrin", "Edwin 'Buzz' Aldrin", "Aldrin"] },
      { key: "shepard", canonicalName: "Alan Shepard", entityType: "person", rarity: 0.45, aliases: ["Alan Shepard", "Shepard"] },
      { key: "cernan", canonicalName: "Eugene Cernan", entityType: "person", rarity: 0.6, aliases: ["Eugene Cernan", "Gene Cernan", "Cernan"] },
      { key: "young", canonicalName: "John Young", entityType: "person", rarity: 0.65, aliases: ["John Young", "John W. Young", "Young"] },
      { key: "bean", canonicalName: "Alan Bean", entityType: "person", rarity: 0.7, aliases: ["Alan Bean", "Bean"] },
      { key: "conrad", canonicalName: "Pete Conrad", entityType: "person", rarity: 0.75, aliases: ["Pete Conrad", "Charles Conrad", "Charles 'Pete' Conrad", "Conrad"] },
      { key: "mitchell", canonicalName: "Edgar Mitchell", entityType: "person", rarity: 0.75, aliases: ["Edgar Mitchell", "Mitchell"] },
      { key: "schmitt", canonicalName: "Harrison Schmitt", entityType: "person", rarity: 0.75, aliases: ["Harrison Schmitt", "Jack Schmitt", "Schmitt"] },
      { key: "scott", canonicalName: "David Scott", entityType: "person", rarity: 0.8, aliases: ["David Scott", "Dave Scott"] },
      { key: "duke", canonicalName: "Charles Duke", entityType: "person", rarity: 0.8, aliases: ["Charles Duke", "Charlie Duke", "Duke"] },
      { key: "irwin", canonicalName: "James Irwin", entityType: "person", rarity: 0.85, aliases: ["James Irwin", "Jim Irwin", "Irwin"] },
    ],
  },
];
