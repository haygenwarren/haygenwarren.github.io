import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { EducationService } from '../../core/services/education.service';
import { EducationAward, EducationEntry } from '../../core/models/education.model';

@Component({
  selector: 'app-education',
  templateUrl: './education.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './education.scss',
})
export class EducationComponent implements OnInit {
  private educationService = inject(EducationService);
  entries = signal<EducationEntry[]>([]);
  awards = signal<EducationAward[]>([]);

  ngOnInit(): void {
    this.educationService.getEducation().subscribe((data) => {
      this.entries.set(data.entries);
      this.awards.set(data.awards ?? []);
    });
  }
}
