import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SiteMetadata } from '../models/site.model';

@Injectable({ providedIn: 'root' })
export class SiteService {
  private http = inject(HttpClient);

  getMetadata(): Observable<SiteMetadata> {
    return this.http.get<SiteMetadata>('assets/generated/site.json');
  }
}
