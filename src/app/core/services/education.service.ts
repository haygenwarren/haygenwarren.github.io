import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EducationData } from '../models/education.model';

@Injectable({ providedIn: 'root' })
export class EducationService {
  private http = inject(HttpClient);

  getEducation(): Observable<EducationData> {
    return this.http.get<EducationData>('assets/generated/education.json');
  }
}
