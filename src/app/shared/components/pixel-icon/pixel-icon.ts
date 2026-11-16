import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';

export type PixelIconName =
  'telescope' | 'camera' | 'book' | 'work' | 'pen' | 'home' | 'news' | 'mission-atlas';
const PATTERNS: Record<PixelIconName, string[]> = {
  telescope: [
    '000000001100',
    '000000011110',
    '000000111100',
    '000001111000',
    '000011110000',
    '000111100000',
    '001111000000',
    '000110000000',
    '000011000000',
    '000111100000',
    '001100110000',
    '011000011000',
  ],
  camera: [
    '000000000000',
    '001110000000',
    '001110111000',
    '011111111110',
    '010000000010',
    '010001100010',
    '010010010010',
    '010010010010',
    '010001100010',
    '010000000010',
    '011111111110',
    '000000000000',
  ],
  book: [
    '000000000000',
    '011110111110',
    '010001000010',
    '010001000010',
    '010101010010',
    '010101010010',
    '010001000010',
    '010101010010',
    '010001000010',
    '011111111110',
    '000001000000',
    '000000000000',
  ],
  work: [
    '000000000000',
    '000111110000',
    '000100010000',
    '011111111110',
    '010000000010',
    '010000000010',
    '011111111110',
    '010001000010',
    '010000000010',
    '010000000010',
    '011111111110',
    '000000000000',
  ],
  pen: [
    '000000001100',
    '000000011110',
    '000000111110',
    '000001111100',
    '000011111000',
    '000111110000',
    '001111100000',
    '001111000000',
    '001110000000',
    '001100000000',
    '011000000000',
    '000000000000',
  ],
  // A folded newspaper: headline, photo block and columns, with a back page.
  news: [
    '000000000000',
    '011111111000',
    '010000001000',
    '010111101110',
    '010000001010',
    '010110101010',
    '010110101010',
    '010000001010',
    '010111101010',
    '010000001010',
    '011111111110',
    '000000000000',
  ],
  home: [
    '000001000000',
    '000011100000',
    '000111110000',
    '001110111000',
    '011100011100',
    '111000001110',
    '001000001000',
    '001001101000',
    '001001101000',
    '001001101000',
    '001111111000',
    '000000000000',
  ],
  // The Mission Atlas emblem, hand-pixelled from its brand kit: ring, Earth's
  // horizon and land, the solid orbit with the active mission (lavender), and
  // the dashed orbit ending at a second mission. 15×15, so it renders at a
  // whole 2× (or 4×) scale in a 30px icon slot.
  'mission-atlas': [
    '000002222200000',
    '000225555522000',
    '002555555555200',
    '025555222244520',
    '025552555544220',
    '255525555555552',
    '255233555555552',
    '252555533555552',
    '252555555535552',
    '252555555552552',
    '022552222255520',
    '022227777722220',
    '002666777777200',
    '000226677722000',
    '000002222200000',
  ],
};

/** Colours for multi-colour patterns, keyed by digit. '1' is the bubble's own
 * colour; the rest are the Mission Atlas brand palette. */
const FILLS: Record<string, string> = {
  '1': 'currentColor',
  '2': '#efe8d6', // Parchment: ring, horizon, solid orbit, missions
  '3': '#968dd3', // Orbit Violet: dashed orbit
  '4': '#c4bcf1', // Signal Lavender: active mission
  '5': '#191c3c', // Indigo Sky: emblem disc
  '6': '#55529f', // Land Violet
  '7': '#2a2c5f', // Earth Indigo: oceans
};

@Component({
  selector: 'app-pixel-icon',
  template: `<svg [attr.viewBox]="viewBox()" aria-hidden="true" shape-rendering="crispEdges">
    @for (pixel of pixels(); track $index) {
      <rect [attr.x]="pixel.x" [attr.y]="pixel.y" width="1" height="1" [attr.fill]="pixel.fill" />
    }
  </svg>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    ':host { display: block; width: 30px; height: 30px; } svg { width: 100%; height: 100%; }',
  ],
})
export class PixelIconComponent {
  name = input.required<PixelIconName>();
  viewBox = computed(() => `0 0 ${PATTERNS[this.name()].length} ${PATTERNS[this.name()].length}`);
  pixels = computed(() =>
    PATTERNS[this.name()].flatMap((row, y) =>
      Array.from(row).flatMap((value, x) => (FILLS[value] ? [{ x, y, fill: FILLS[value] }] : [])),
    ),
  );
}
