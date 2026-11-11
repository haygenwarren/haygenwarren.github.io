/** A photograph, as written by `npm run photos` (scripts/process-photos.js). */
export interface Photo {
  id: string;
  /** Full-size image (longest edge 2048px), relative to assets/photography/. */
  filename: string;
  /** Grid image (800px wide), relative to assets/photography/. */
  thumbnail: string;
  /** Pixel size of the full-size image; keeps each photo's own proportions. */
  width: number;
  height: number;
  /** Description for screen readers. Edit freely; reruns keep it. */
  alt: string;
  camera: string;
  film: string;
  location: string;
  /** Month taken, YYYY-MM. */
  date: string;
  tags: string[];
}

export interface PhotographyData {
  photos: Photo[];
}
