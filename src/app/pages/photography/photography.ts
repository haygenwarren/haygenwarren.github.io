import { Component, HostListener, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PHOTO_ASSETS, PhotographyService } from '../../core/services/photography.service';
import { Photo } from '../../core/models/photo.model';
import { ContactRequestComponent } from '../../shared/components/contact-request/contact-request';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer';
import { PhotoLiftDirective } from './photo-lift';

@Component({
  selector: 'app-photography',
  imports: [DatePipe, ContactRequestComponent, PhotoViewerComponent, PhotoLiftDirective],
  templateUrl: './photography.html',
  styleUrl: './photography.scss',
})
export class PhotographyComponent {
  readonly base = PHOTO_ASSETS;
  photos = toSignal(
    inject(PhotographyService)
      .getPhotos()
      .pipe(map((data) => data.photos)),
    { initialValue: [] as Photo[] },
  );
  /** The span of years the photographs were taken, e.g. "2023–2026". */
  copyrightYears = computed(() => {
    const years = this.photos().map((photo) => Number(photo.date.slice(0, 4)));
    if (!years.length) return String(new Date().getFullYear());
    const first = Math.min(...years),
      last = Math.max(...years);
    return first === last ? String(first) : `${first}–${last}`;
  });

  /**
   * Discourage casual saving: no "Save Image As…" menu and no dragging a
   * photograph out of the page (grid or viewer). This is only a deterrent —
   * anything shown in a browser can still be captured. The rest of the page
   * is unaffected.
   */
  @HostListener('contextmenu', ['$event'])
  @HostListener('dragstart', ['$event'])
  protectPhoto(event: Event): void {
    if (event.target instanceof HTMLImageElement) event.preventDefault();
  }

  srcset(photo: Photo): string {
    return `${this.base}${photo.thumbnail} 800w, ${this.base}${photo.filename} ${photo.width}w`;
  }
}
