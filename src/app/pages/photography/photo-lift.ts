import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** Largest tilt, in degrees, when the cursor is at a photo's edge. */
const MAX_TILT = 1.2;

/**
 * Tilts a photo very slightly toward the mouse while it is lifted on hover
 * (the lift and shadow live in photography.scss). Sets --tilt-x / --tilt-y
 * directly, outside Angular, so pointer movement never triggers change
 * detection. Touch and reduced-motion users get no tilt.
 */
@Directive({ selector: '[appPhotoLift]' })
export class PhotoLiftDirective {
  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || reduced.matches) return;
      const box = element.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5,
        y = (event.clientY - box.top) / box.height - 0.5;
      element.style.setProperty('--tilt-x', `${(-y * 2 * MAX_TILT).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${(x * 2 * MAX_TILT).toFixed(2)}deg`);
    };
    const leave = () => {
      element.style.removeProperty('--tilt-x');
      element.style.removeProperty('--tilt-y');
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave);
    inject(DestroyRef).onDestroy(() => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    });
  }
}
