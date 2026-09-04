import { Component, inject, signal, OnInit } from '@angular/core';
import { EducationService } from '../../core/services/education.service';
import { EducationEntry } from '../../core/models/education.model';

@Component({
  selector: 'app-education',
  templateUrl: './education.html',
  styleUrl: './education.scss',
})
export class EducationComponent implements OnInit {
  private educationService = inject(EducationService);
  entries = signal<EducationEntry[]>([]);

  ngOnInit(): void {
    this.educationService.getEducation().subscribe(data => {
      this.entries.set(data.entries);
    });
  }
}
