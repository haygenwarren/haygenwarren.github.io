import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExperienceService } from '../../core/services/experience.service';
import { EducationService } from '../../core/services/education.service';
import { PhotographyService } from '../../core/services/photography.service';
import { ExperienceEntry } from '../../core/models/experience.model';
import { EducationEntry } from '../../core/models/education.model';
import { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private experienceService = inject(ExperienceService);
  private educationService = inject(EducationService);
  private photographyService = inject(PhotographyService);

  experience = signal<ExperienceEntry[]>([]);
  education = signal<EducationEntry[]>([]);
  photos = signal<Photo[]>([]);

  private track = viewChild<ElementRef<HTMLElement>>('track');
  canScroll = signal(false);

  constructor() {
    // Re-measure once the photo strip has rendered
    afterRenderEffect(() => {
      this.photos();
      this.updateCanScroll();
    });
  }

  ngOnInit() {
    this.experienceService.getExperience().subscribe(data => this.experience.set(data.entries));
    this.educationService.getEducation().subscribe(data => this.education.set(data.entries));
    this.photographyService.getPhotos().subscribe(data => this.photos.set(data.photos));
  }

  @HostListener('window:resize')
  updateCanScroll(): void {
    const el = this.track()?.nativeElement;
    this.canScroll.set(!!el && el.scrollWidth > el.clientWidth + 1);
  }

  prevPhoto(): void {
    this.stepCarousel(-1);
  }

  nextPhoto(): void {
    this.stepCarousel(1);
  }

  // Moves the strip by exactly one photo, wrapping around at either end
  private stepCarousel(direction: 1 | -1): void {
    const el = this.track()?.nativeElement;
    if (!el || el.children.length < 2) return;

    const [first, second] = Array.from(el.children) as HTMLElement[];
    const step = second.offsetLeft - first.offsetLeft;
    const max = el.scrollWidth - el.clientWidth;

    if (direction === 1 && el.scrollLeft >= max - 1) {
      el.scrollTo({ left: 0 });
    } else if (direction === -1 && el.scrollLeft <= 1) {
      el.scrollTo({ left: max });
    } else {
      el.scrollBy({ left: direction * step });
    }
  }

  formatDates(start: string, end: string | null): string {
    return `${start} – ${end ?? 'Present'}`;
  }

  photoYear(date: string): string {
    return date.split('-')[0];
  }
}
