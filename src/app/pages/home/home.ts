import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
  carouselIndex = signal(0);

  currentPhoto = computed(() => {
    const photos = this.photos();
    return photos.length > 0 ? photos[this.carouselIndex()] : null;
  });

  ngOnInit() {
    this.experienceService.getExperience().subscribe(data => this.experience.set(data.entries));
    this.educationService.getEducation().subscribe(data => this.education.set(data.entries));
    this.photographyService.getPhotos().subscribe(data => this.photos.set(data.photos));
  }

  prevPhoto(): void {
    const len = this.photos().length;
    if (len > 0) this.carouselIndex.update(i => (i - 1 + len) % len);
  }

  nextPhoto(): void {
    const len = this.photos().length;
    if (len > 0) this.carouselIndex.update(i => (i + 1) % len);
  }

  formatDates(start: string, end: string | null): string {
    return `${start} – ${end ?? 'Present'}`;
  }

  photoYear(date: string): string {
    return date.split('-')[0];
  }
}
