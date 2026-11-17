/** A page's banner photo, resolved from content/site/banners.json at build time. */
export interface PageBanner {
  src: string;
  /** Responsive sources: a phone-sized copy and the full size. */
  srcset?: string;
  alt: string;
  /** CSS object-position: which part of the photo stays in the wide crop. */
  focus: string;
  /** Mirror the photo left to right. */
  flip: boolean;
}

/** Banners keyed by page: research, work, writing, education, photography, blog, about. */
export type BannerData = Record<string, PageBanner>;
