import { Component, inject, signal, OnInit } from '@angular/core';
import { ExperienceService } from '../../core/services/experience.service';
import { ExperienceEntry } from '../../core/models/experience.model';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class ExperienceComponent implements OnInit {
  private experienceService = inject(ExperienceService);
  entries = signal<ExperienceEntry[]>([]);

  ngOnInit(): void {
    this.experienceService.getExperience().subscribe(data => {
      this.entries.set(data.entries);
    });
  }
}
