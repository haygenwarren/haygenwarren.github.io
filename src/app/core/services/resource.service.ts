import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Resource } from '../models/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private http = inject(HttpClient);

  /** Newest first; empty if there are none. */
  getResources(): Observable<Resource[]> {
    return this.http.get<{ resources: Resource[] }>('assets/generated/resources.json').pipe(
      map((data) => data.resources),
      catchError(() => of([])),
    );
  }
}
