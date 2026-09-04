import { Component, inject, signal, OnInit } from '@angular/core';
import { PhotographyService } from '../../core/services/photography.service';
import { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-photography',
  templateUrl: './photography.html',
  styleUrl: './photography.scss',
})
export class PhotographyComponent implements OnInit {
  private photographyService = inject(PhotographyService);
  photos = signal<Photo[]>([]);

  ngOnInit(): void {
    this.photographyService.getPhotos().subscribe(data => {
      this.photos.set(data.photos);
    });
  }
}
