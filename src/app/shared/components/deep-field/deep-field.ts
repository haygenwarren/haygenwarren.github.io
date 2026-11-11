import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({
  selector: 'app-deep-field',
  template: '<canvas #field aria-hidden="true"></canvas>',
  styles: [
    `
      :host {
        position: absolute;
        inset: -3%;
        pointer-events: none;
        overflow: hidden;
      }
      canvas {
        width: 100%;
        height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
        opacity: 0.8;
      }
    `,
  ],
})
export class DeepFieldComponent {
  private field = viewChild.required<ElementRef<HTMLCanvasElement>>('field');
  constructor() {
    afterNextRender(() => this.draw());
  }

  private draw(): void {
    const canvas = this.field().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 700;
    canvas.height = 600;
    let seed = 318;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    ctx.fillStyle = '#070a16';
    ctx.fillRect(0, 0, 700, 600);
    const colors = ['#aab9e0', '#7186bd', '#e1bb8c', '#b39acb', '#d9dff0'];
    for (let i = 0; i < 800; i++) {
      ctx.globalAlpha = 0.15 + random() * 0.5;
      ctx.fillStyle = colors[Math.floor(random() * colors.length)];
      const x = Math.floor(random() * 700);
      const y = Math.floor(random() * 600);
      ctx.fillRect(x, y, 1, 1);
      if (i % 57 === 0) {
        ctx.globalAlpha = 0.2;
        ctx.fillRect(x - 2, y, 5, 1);
        ctx.fillRect(x, y - 2, 1, 5);
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Seeded galaxies: warm elliptical cores and cool spiral arms.
    for (let i = 0; i < 100; i++) {
      const x = random() * 700,
        y = random() * 600;
      const radius = 2 + random() * 7,
        angle = random() * Math.PI;
      const spiral = i % 3 === 0;
      for (let j = 0; j < 100; j++) {
        const distance = random() * radius;
        const theta = spiral
          ? distance * 0.8 + (j % 2) * Math.PI + random() * 0.8
          : random() * Math.PI * 2;
        const gx = Math.cos(theta) * distance,
          gy = Math.sin(theta) * distance * 0.45;
        ctx.fillStyle = distance < radius * 0.3 ? '#e2c59e' : spiral ? '#7f86c3' : '#a48b9c';
        ctx.globalAlpha = 0.04 + (1 - distance / radius) * 0.22;
        ctx.fillRect(
          Math.round(x + gx * Math.cos(angle) - gy * Math.sin(angle)),
          Math.round(y + gx * Math.sin(angle) + gy * Math.cos(angle)),
          1,
          1,
        );
      }
      ctx.fillStyle = '#e1cfbc';
      ctx.globalAlpha = 0.55;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}
