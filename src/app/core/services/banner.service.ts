import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { BannerData } from '../models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  /** Fetched once and shared by every page; a missing file just means no photos. */
  private readonly banners$ = inject(HttpClient)
    .get<BannerData>('assets/generated/banners.json')
    .pipe(
      catchError(() => of({} as BannerData)),
      shareReplay(1),
    );

  getBanners(): Observable<BannerData> {
    return this.banners$;
  }
}
