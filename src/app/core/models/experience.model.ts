import { ResourceLink } from './resource.model';

export interface ExperienceEntry {
  id: string;
  category: 'research' | 'work' | 'project' | 'teaching';
  organization: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  url?: string;
  description: string;
  highlights: string[];
  tags: string[];
  /** Slides or posters, added from content/resources/ at build time. */
  files?: ResourceLink[];
}

export interface ConferencePresentation {
  id: string;
  title: string;
  conference: string;
  format: string;
  date: string;
  location: string;
  /** Slides or posters, added from content/resources/ at build time. */
  files?: ResourceLink[];
}

export interface ExperienceData {
  entries: ExperienceEntry[];
  presentations?: ConferencePresentation[];
}
