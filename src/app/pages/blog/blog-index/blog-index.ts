import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPost } from '../../../core/models/blog-post.model';

@Component({
  selector: 'app-blog-index',
  imports: [RouterLink],
  templateUrl: './blog-index.html',
  styleUrl: './blog-index.scss',
})
export class BlogIndexComponent implements OnInit {
  private blogService = inject(BlogService);
  posts = signal<BlogPost[]>([]);

  ngOnInit(): void {
    this.blogService.getPosts().subscribe(posts => {
      this.posts.set(posts);
    });
  }
}
