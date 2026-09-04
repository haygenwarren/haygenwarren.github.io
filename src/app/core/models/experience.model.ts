export interface ExperienceEntry {
  id: string;
  organization: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
  highlights: string[];
  tags: string[];
}

export interface ExperienceData {
  entries: ExperienceEntry[];
}
