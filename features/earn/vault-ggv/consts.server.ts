// Server-safe constants — no SVG / React / browser dependencies.
// Imported by both server routes and client utils.

import { parseEther } from 'viem';

export const GGV_STATS_ORIGIN = 'https://api.sevenseas.capital';

export const GGV_START_DATE = new Date('2025-09-03');

export const GGV_INCENTIVES = [
  parseEther('57.5'),
  parseEther('32'),
  parseEther('38.5'),
];
