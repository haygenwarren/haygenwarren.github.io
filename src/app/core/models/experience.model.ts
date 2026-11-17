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
}

export interface ConferencePresentation {
  id: string;
  title: string;
  conference: string;
  format: string;
  date: string;
  location: string;
}

export interface ExperienceData {
  entries: ExperienceEntry[];
  presentations?: ConferencePresentation[];
}
