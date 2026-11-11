import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Photo } from '../../../core/models/photo.model';
import { PHOTO_ASSETS } from '../../../core/services/photography.service';

/** Full-screen view of one photograph, with previous/next buttons and arrow keys. */
@Component({
  selector: 'app-photo-viewer',
  imports: [DatePipe],
  templateUrl: './photo-viewer.html',
  styleUrl: './photo-viewer.scss',
})
export class PhotoViewerComponent {
  photos = input.required<Photo[]>();
  readonly base = PHOTO_ASSETS;
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private opener: HTMLElement | null = null;
  index = signal(0);
  current = computed(() => this.photos()[this.index()]);

  /** Show photo `index`; focus returns to `opener` when the viewer closes. */
  open(index: number, opener: EventTarget | null): void {
    this.opener = opener instanceof HTMLElement ? opener : null;
    this.index.set(index);
    this.preloadNeighbours();
    document.documentElement.style.overflow = 'hidden';
    this.dialog().nativeElement.showModal();
  }

  step(by: number): void {
    const count = this.photos().length;
    this.index.update((i) => (i + by + count) % count);
    this.preloadNeighbours();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  /** Runs however the viewer closes (button, Escape or backdrop). */
  closed(): void {
    document.documentElement.style.overflow = '';
    this.opener?.focus();
    this.opener = null;
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.step(1);
    else if (event.key === 'ArrowLeft') this.step(-1);
    else return;
    event.preventDefault();
  }

  /** Clicking the dark surround (not the photo, caption or buttons) closes it. */
  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  private preloadNeighbours(): void {
    const photos = this.photos(),
      i = this.index();
    for (const k of [i - 1, i + 1]) {
      const photo = photos[(k + photos.length) % photos.length];
      if (photo) new Image().src = this.base + photo.filename;
    }
  }
}
