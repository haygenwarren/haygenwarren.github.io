import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhotographyService } from '../../core/services/photography.service';
import { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private photographyService = inject(PhotographyService);

  featuredPhoto = signal<Photo | null>(null);

  ngOnInit() {
    this.photographyService.getPhotos().subscribe(data => {
      if (data.photos.length > 0) {
        const idx = Math.floor(Math.random() * data.photos.length);
        this.featuredPhoto.set(data.photos[idx]);
      }
    });
  }
}
