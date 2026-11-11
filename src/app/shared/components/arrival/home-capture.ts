const TEXT_SELECTORS = [
  '.home-wordmark',
  '.small-label',
  '.motion-control',
  '.portrait-hub h1',
  '.portrait-hub > p',
  '.satellite-label',
  '.orbit-caption p',
  '.about-link',
  '.personal-links a',
  '.personal-links button',
  '.replay',
];

/**
 * Recompose the homepage that sits underneath the arrival overlay onto a
 * canvas the size of the viewport, so the camera can photograph the real
 * layout and the final zoom lands exactly on it. Returns null until the
 * page (and its portrait) has finished rendering.
 */
export function captureHome(width: number, height: number): HTMLCanvasElement | null {
  const field = document.querySelector<HTMLCanvasElement>('app-deep-field canvas');
  const crop = document.querySelector<HTMLElement>('.portrait-crop');
  const portrait = crop?.querySelector('img');
  if (!field?.width || !crop || !portrait?.complete || !portrait.naturalWidth) return null;

  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;
  const c = result.getContext('2d')!;
  c.fillStyle = '#070a16';
  c.fillRect(0, 0, width, height);

  // Deep field, drawn the way the CSS draws it (object-fit: cover, 80%).
  const box = field.getBoundingClientRect();
  const ratio = Math.max(box.width / field.width, box.height / field.height);
  c.globalAlpha = 0.8;
  c.imageSmoothingEnabled = false;
  c.drawImage(
    field,
    box.x + (box.width - field.width * ratio) / 2,
    box.y + (box.height - field.height * ratio) / 2,
    field.width * ratio,
    field.height * ratio,
  );
  c.imageSmoothingEnabled = true;
  c.globalAlpha = 1;
  const shade = c.createRadialGradient(
    width / 2,
    height * 0.48,
    20,
    width / 2,
    height * 0.48,
    Math.max(width, height) * 0.65,
  );
  shade.addColorStop(0, '#070a1620');
  shade.addColorStop(1, '#070a16b0');
  c.fillStyle = shade;
  c.fillRect(0, 0, width, height);

  const orbit = document
    .querySelector('.orbit-lines ellipse:not(.inner-orbit)')
    ?.getBoundingClientRect();
  if (orbit) {
    c.strokeStyle = '#8d9dbb30';
    c.setLineDash([2, 7]);
    c.beginPath();
    c.ellipse(
      orbit.x + orbit.width / 2,
      orbit.y + orbit.height / 2,
      orbit.width / 2,
      orbit.height / 2,
      0,
      0,
      Math.PI * 2,
    );
    c.stroke();
    c.setLineDash([]);
  }

  const frame = document.querySelector<HTMLElement>('.portrait-frame')?.getBoundingClientRect();
  if (frame) {
    c.fillStyle = '#101525';
    c.strokeStyle = '#63718a55';
    c.beginPath();
    c.arc(frame.x + frame.width / 2, frame.y + frame.height / 2, frame.width / 2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  drawPortrait(c, crop, portrait);

  for (const bubble of document.querySelectorAll<HTMLElement>('.satellite-bubble')) {
    const r = bubble.getBoundingClientRect();
    const style = getComputedStyle(bubble);
    c.fillStyle = style.backgroundColor;
    c.strokeStyle = style.borderColor;
    c.beginPath();
    c.arc(r.x + r.width / 2, r.y + r.height / 2, r.width / 2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    const svg = bubble.querySelector('svg');
    if (!svg) continue;
    const sr = svg.getBoundingClientRect();
    c.fillStyle = style.color;
    for (const pixel of svg.querySelectorAll('rect'))
      c.fillRect(
        sr.x + (Number(pixel.getAttribute('x')) * sr.width) / 12,
        sr.y + (Number(pixel.getAttribute('y')) * sr.height) / 12,
        sr.width / 12,
        sr.height / 12,
      );
  }

  // Measure each text node where it actually rendered.
  const range = document.createRange();
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  for (const element of document.querySelectorAll<HTMLElement>(TEXT_SELECTORS.join(','))) {
    const s = getComputedStyle(element);
    c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    c.fillStyle = s.color;
    c.letterSpacing = s.letterSpacing === 'normal' ? '0px' : s.letterSpacing;
    for (const node of element.childNodes) {
      const raw = node.nodeType === Node.TEXT_NODE ? (node.textContent ?? '') : '';
      let text = raw.trim();
      if (!text) continue;
      const start = raw.length - raw.trimStart().length;
      range.setStart(node, start);
      range.setEnd(node, start + text.length);
      const r = range.getBoundingClientRect();
      if (s.textTransform === 'uppercase') text = text.toUpperCase();
      c.fillText(text, r.x, r.y + r.height / 2);
    }
  }
  c.letterSpacing = '0px';
  return result;
}

/** Mirror the CSS crop: object-fit: cover at `object-position`, then
 * `scale` about the same point (see orbital-navigation.scss). */
function drawPortrait(c: CanvasRenderingContext2D, crop: HTMLElement, img: HTMLImageElement): void {
  const box = crop.getBoundingClientRect();
  const style = getComputedStyle(img);
  const [px, py] = style.objectPosition
    .split(' ')
    .map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
  const zoom = parseFloat(style.scale) || 1;
  const nw = img.naturalWidth,
    nh = img.naturalHeight;
  const cover = Math.max(box.width / nw, box.height / nh);
  const sw = box.width / cover / zoom,
    sh = box.height / cover / zoom;
  c.save();
  c.beginPath();
  c.arc(box.x + box.width / 2, box.y + box.height / 2, box.width / 2, 0, Math.PI * 2);
  c.clip();
  c.drawImage(
    img,
    px * nw - px * sw,
    py * nh - py * sh,
    sw,
    sh,
    box.x,
    box.y,
    box.width,
    box.height,
  );
  c.restore();
}

/** A colour-negative version: inverted, with the orange mask of the base. */
export function toNegative(source: HTMLCanvasElement, maxWidth = 360): HTMLCanvasElement {
  const ratio = Math.min(1, maxWidth / source.width);
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(source.width * ratio));
  out.height = Math.max(1, Math.round(source.height * ratio));
  const c = out.getContext('2d', { willReadFrequently: true })!;
  c.drawImage(source, 0, 0, out.width, out.height);
  const image = c.getImageData(0, 0, out.width, out.height),
    d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 70 + (255 - d[i]) * 0.72;
    d[i + 1] = 34 + (255 - d[i + 1]) * 0.55;
    d[i + 2] = 12 + (255 - d[i + 2]) * 0.36;
  }
  c.putImageData(image, 0, 0);
  return out;
}
