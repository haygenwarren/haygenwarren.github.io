export interface SiteLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
}

export interface SiteMetadata {
  name: string;
  tagline: string;
  description: string;
  author: string;
  email: string;
  links: SiteLinks;
}
