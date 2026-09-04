export interface Photo {
  id: string;
  filename: string;
  title: string;
  caption: string;
  camera: string;
  film: string;
  location: string;
  date: string;
  tags: string[];
}

export interface PhotographyData {
  photos: Photo[];
}
