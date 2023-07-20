import { RedditPost } from './reddit-post';

export interface RedditResponse {
  data: RedditResponseData;
}

interface RedditResponseData {
  children: RedditPost[];
  // Unused properties
  after: string;
  mdohash: string;
  dist: number;
  geo_filter: unknown;
  before: unknown;
}
