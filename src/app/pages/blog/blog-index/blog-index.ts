import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageBannerComponent } from '../../../shared/components/page-banner/page-banner';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPost } from '../../../core/models/blog-post.model';

@Component({
  selector: 'app-blog-index',
  imports: [RouterLink, DatePipe, PageBannerComponent],
  templateUrl: './blog-index.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './blog-index.scss',
})
export class BlogIndexComponent implements OnInit {
  private blogService = inject(BlogService);
  posts = signal<BlogPost[]>([]);

  ngOnInit(): void {
    this.blogService.getPosts().subscribe((posts) => {
      this.posts.set(posts);
    });
  }
}
