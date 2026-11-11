import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Article, WritingData } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class WritingService {
  private http = inject(HttpClient);

  /** Published articles, newest first. */
  getArticles(): Observable<Article[]> {
    return this.http
      .get<WritingData>('assets/generated/writing.json')
      .pipe(map((data) => data.articles));
  }
}
