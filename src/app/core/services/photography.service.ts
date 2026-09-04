import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PhotographyData } from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class PhotographyService {
  private http = inject(HttpClient);

  getPhotos(): Observable<PhotographyData> {
    return this.http.get<PhotographyData>('assets/generated/photos.json');
  }
}
