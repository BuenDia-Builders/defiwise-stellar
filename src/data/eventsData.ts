export type EventType = "webinar" | "workshop" | "ama" | "hackathon";
export type EventStatus = "upcoming" | "past";

export interface DeFiEvent {
  id: number;
  title: string;
  description: string;
  date: string; // ISO date string
  type: EventType;
  status: EventStatus;
  image: string;
  registrationUrl: string;
}

export const eventsData: DeFiEvent[] = [
  {
    id: 1,
    title: "Intro to DeFi on Stellar",
    description:
      "Live webinar covering the fundamentals of decentralized finance and how Stellar's ecosystem differs from EVM chains. Ideal for beginners.",
    date: "2026-07-15T18:00:00Z",
    type: "webinar",
    status: "upcoming",
    image: "/defiInvest.svg",
    registrationUrl: "https://github.com/BuenDia-Builders",
  },
  {
    id: 2,
    title: "Build Your First Soroban Contract",
    description:
      "Hands-on workshop where you'll write, test, and deploy a Soroban smart contract on Stellar Testnet. Bring your laptop.",
    date: "2026-08-02T17:00:00Z",
    type: "workshop",
    status: "upcoming",
    image: "/defiParty.svg",
    registrationUrl: "https://github.com/BuenDia-Builders",
  },
  {
    id: 3,
    title: "Buen Día Builders AMA",
    description:
      "Ask us anything! Open session with the DeFiWise core team. Topics: roadmap, NFT badges, XP token design, and what's next.",
    date: "2026-08-20T19:00:00Z",
    type: "ama",
    status: "upcoming",
    image: "/defiInvest.svg",
    registrationUrl: "https://github.com/BuenDia-Builders",
  },
  {
    id: 4,
    title: "DeFi Hackathon — Stellar Edition",
    description:
      "48-hour hackathon building DeFi tools on Stellar. Prizes in XLM. Teams of up to 4. Projects judged on innovation, usability, and on-chain integration.",
    date: "2026-05-10T12:00:00Z",
    type: "hackathon",
    status: "past",
    image: "/defiParty.svg",
    registrationUrl: "https://github.com/BuenDia-Builders",
  },
];
