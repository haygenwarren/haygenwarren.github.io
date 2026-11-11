import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExperienceService } from '../../core/services/experience.service';
import { ExperienceEntry } from '../../core/models/experience.model';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class ExperienceComponent implements OnInit {
  private experienceService = inject(ExperienceService);
  isResearch = inject(ActivatedRoute).snapshot.data['section'] === 'research';
  title = this.isResearch ? 'Research' : 'Work experience';
  description = this.isResearch
    ? 'Optical data pipelines, radio observations, and space mission concepts.'
    : 'Manufacturing, automation, and reporting on astrophysics and spaceflight.';
  entries = signal<ExperienceEntry[]>([]);

  ngOnInit(): void {
    this.experienceService.getExperience().subscribe((data) => {
      this.entries.set(
        data.entries.filter((entry) => entry.category === (this.isResearch ? 'research' : 'work')),
      );
    });
  }
}
