export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  /** Omitted for a diploma, e.g. high school. */
  field?: string;
  location: string;
  startDate: string;
  endDate: string | null;
  description: string;
  highlights: string[];
  courses?: string[];
  honors?: string[];
}

export interface EducationAward {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface EducationData {
  entries: EducationEntry[];
  awards?: EducationAward[];
}
