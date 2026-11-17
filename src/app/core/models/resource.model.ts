/** A slide deck or poster from content/resources/, prepared at build time. */
export interface Resource {
  title: string;
  /** "Slides", "Poster", … */
  kind: string;
  /** YYYY-MM */
  date: string;
  /** Where it was presented. */
  events: string[];
  /** The PDF. */
  href: string;
  /** A picture of the first page, or null if none could be made. */
  preview: string | null;
  /** e.g. "1.8 MB" */
  size: string;
}

/** A link to a resource, added to the Research/Work entries and talks it belongs to. */
export interface ResourceLink {
  label: string;
  href: string;
}
