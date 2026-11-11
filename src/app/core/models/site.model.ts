export interface SiteLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  x?: string;
}

export interface SiteMetadata {
  name: string;
  tagline: string;
  description: string;
  author: string;
  email: string;
  links: SiteLinks;
}
