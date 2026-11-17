import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExperienceService } from '../../core/services/experience.service';
import { ExperienceEntry } from '../../core/models/experience.model';

interface ExperienceSection {
  id: string;
  title: string;
  category: ExperienceEntry['category'];
}

@Component({
  selector: 'app-experience',
  imports: [RouterLink],
  templateUrl: './experience.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './experience.scss',
})
export class ExperienceComponent {
  readonly isResearch = inject(ActivatedRoute).snapshot.data['section'] === 'research';
  readonly title = this.isResearch ? 'Research' : 'Work & projects';
  readonly description = this.isResearch
    ? 'Astronomical data pipelines, radio observations, teaching, and conference presentations.'
    : 'Engineering, software development, mission concepts, and spaceflight journalism.';
  readonly data = toSignal(inject(ExperienceService).getExperience());
  private readonly sectionDefinitions: ExperienceSection[] = this.isResearch
    ? [
        { id: 'research-experience', title: 'Research experience', category: 'research' },
        { id: 'teaching', title: 'Teaching & mentorship', category: 'teaching' },
      ]
    : [
        { id: 'professional-experience', title: 'Professional experience', category: 'work' },
        {
          id: 'projects',
          title: 'Technical projects & professional development',
          category: 'project',
        },
      ];

  readonly sections = computed(() =>
    this.sectionDefinitions
      .map((section) => ({
        ...section,
        entries: this.data()?.entries.filter((entry) => entry.category === section.category) ?? [],
      }))
      .filter((section) => section.entries.length),
  );
  readonly presentations = computed(() =>
    this.isResearch ? (this.data()?.presentations ?? []) : [],
  );
}
