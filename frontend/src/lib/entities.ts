export type EntityStatus = "In Review" | "Filed" | "Draft";

export type EntitySummary = {
  tin: string;
  name: string;
  entityType: string;
  region: string;
  status: EntityStatus;
  obligations: number;
  /** Only the seeded Acme entity is wired to live computation in this build. */
  live: boolean;
};

export const ENTITY_STATUSES: EntityStatus[] = ["In Review", "Filed", "Draft"];

export const ENTITIES: EntitySummary[] = [
  {
    tin: "C2581234509",
    name: "Acme Sdn Bhd",
    entityType: "Sdn Bhd",
    region: "Selangor · Hybrid",
    status: "In Review",
    obligations: 5,
    live: true,
  },
  {
    tin: "C9981002211",
    name: "Bumi Steel Bhd",
    entityType: "Berhad",
    region: "Johor · On-site",
    status: "Filed",
    obligations: 4,
    live: false,
  },
  {
    tin: "C7741920033",
    name: "Nusantara Logistics Sdn Bhd",
    entityType: "Sdn Bhd",
    region: "Penang · Hybrid",
    status: "In Review",
    obligations: 4,
    live: false,
  },
  {
    tin: "C3310455720",
    name: "Selangor FoodTech Sdn Bhd",
    entityType: "Sdn Bhd",
    region: "Kuala Lumpur · On-site",
    status: "Draft",
    obligations: 0,
    live: false,
  },
  {
    tin: "C5527810094",
    name: "Pintar Edu Sdn Bhd",
    entityType: "Sdn Bhd",
    region: "Sabah · Remote",
    status: "Filed",
    obligations: 3,
    live: false,
  },
  {
    tin: "C1209887654",
    name: "Delima Retail Sdn Bhd",
    entityType: "Sdn Bhd",
    region: "Melaka · On-site",
    status: "Draft",
    obligations: 0,
    live: false,
  },
];
