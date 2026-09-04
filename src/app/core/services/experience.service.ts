import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExperienceData } from '../models/experience.model';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private http = inject(HttpClient);

  getExperience(): Observable<ExperienceData> {
    return this.http.get<ExperienceData>('assets/generated/experience.json');
  }
}
