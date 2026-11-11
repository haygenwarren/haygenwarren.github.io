/** An article published elsewhere, listed on the Writing page. */
export interface Article {
  /** Unique id; the article's URL slug works well. */
  id: string;
  title: string;
  /** Link to the published article. */
  url: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  /** Where it was published, e.g. "NASASpaceflight.com". */
  publication: string;
  /** Short subject label shown on the card, e.g. "Science" or "Launch Preview". */
  topic: string;
  /** One or two sentences, usually the article's opening line. */
  summary: string;
}

export interface WritingData {
  articles: Article[];
}
