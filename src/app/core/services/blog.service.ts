import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlogData, BlogPost } from '../models/blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);

  getPosts(): Observable<BlogPost[]> {
    return this.http
      .get<BlogData>('assets/generated/posts.json')
      .pipe(map(data => data.posts.filter(p => p.published)));
  }

  getPost(slug: string): Observable<BlogPost | undefined> {
    return this.getPosts().pipe(
      map(posts => posts.find(p => p.slug === slug))
    );
  }
}
