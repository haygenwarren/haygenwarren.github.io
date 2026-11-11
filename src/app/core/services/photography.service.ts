import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PhotographyData } from '../models/photo.model';

/** Where `npm run photos` puts the web copies; Photo filenames are relative to it. */
export const PHOTO_ASSETS = 'assets/photography/';

@Injectable({ providedIn: 'root' })
export class PhotographyService {
  private http = inject(HttpClient);

  getPhotos(): Observable<PhotographyData> {
    return this.http.get<PhotographyData>('assets/generated/photos.json');
  }
}
