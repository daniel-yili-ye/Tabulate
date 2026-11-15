/** Bounds shared by validation, the receipt parser and the database checks. */
export const LIMITS = {
  maxCents: 100_000_00,
  maxItems: 150,
  maxParticipants: 30,
  minParticipants: 2,
  nameLength: 60,
  itemNameLength: 120,
  businessNameLength: 120,
  paymentMessageLength: 300,
} as const;
