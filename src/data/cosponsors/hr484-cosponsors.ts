import type { Cosponsorship } from "@/lib/types";

/**
 * HR 484 — Housing Accelerator Study (Solomon) — concurrent resolution.
 * Cosponsors per palegis.us bill info page, fetched 2026-04-20.
 */
export const HR484_COSPONSORSHIP: Cosponsorship = {
  billId: "HR484",
  primeSponsor: { name: "Jared Solomon", district: "202", party: "D" },
  cosponsors: [
    { name: "Abby Major", district: "60", party: "R" },
    { name: "Joe Hogan", district: "142", party: "R" },
    { name: "Valerie Gaydos", district: "44", party: "R" },
    { name: "Keith Harris", district: "195", party: "D" },
    { name: "Tarik Khan", district: "194", party: "D" },
    { name: "Carol Hill-Evans", district: "95", party: "D" },
    { name: "Benjamin Sanchez", district: "153", party: "D" },
    { name: "John Inglis III", district: "38", party: "D" },
    { name: "Ismail Smith-Wade-El", district: "49", party: "D" },
  ],
};
