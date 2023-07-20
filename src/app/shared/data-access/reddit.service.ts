import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, catchError, concatMap, map, scan } from 'rxjs';
import {
  Gif,
  RedditPagination,
  RedditPost,
  RedditResponse,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class RedditService {
  private pagination$ = new BehaviorSubject<RedditPagination>({
    after: null,
    infiniteScroll: null,
    retries: 0,
    totalFound: 0,
  });
  constructor(private http: HttpClient) {}

  nextPage(infinteScrollEvent: Event, after: string) {
    this.pagination$.next({
      after,
      totalFound: 0,
      retries: 0,
      infiniteScroll:
        infinteScrollEvent?.target as HTMLIonInfiniteScrollElement,
    });
  }

  getGifs() {
    const gifsForCurrentPage$ = this.pagination$.pipe(
      concatMap((pagination) =>
        this.fetchFromReddit('gifs', 'hot', pagination.after)
      )
    );

    const allGifs$ = gifsForCurrentPage$.pipe(
      scan((previousGifs, currentGifs) => [...previousGifs, ...currentGifs])
    );

    return allGifs$;
  }

  fetchFromReddit(subreddit: string, sort: string, after: string | null) {
    return this.http
      .get<RedditResponse>(
        `https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=100` +
          (after ? `&after=${after}` : '')
      )
      .pipe(
        catchError(() => EMPTY),
        map((res) => this.convertRedditPostsToGifs(res.data.children))
      );
  }

  private convertRedditPostsToGifs(posts: RedditPost[]): Gif[] {
    return posts
      .map((post) => ({
        src: this.getBestSrcForGif(post),
        author: post.data.author,
        name: post.data.name,
        permalink: post.data.permalink,
        title: post.data.title,
        thumbnail: post.data.thumbnail,
        comments: post.data.num_comments,
        loading: false,
      }))
      .filter((gifs) => gifs.src !== null);
  }

  private getBestSrcForGif(post: RedditPost) {
    // If the source is .mp4, use it
    if (post.data.url.indexOf('.mp4') > -1) {
      return post.data.url;
    }

    // convert .gifv and .webm to .mp4
    if (post.data.url.indexOf('.gifv') > -1) {
      return post.data.url.replace('.gifv', '.mp4');
    }

    if (post.data.url.indexOf('.webm') > -1) {
      return post.data.url.replace('.webm', '.mp4');
    }

    // If the URL is not .gifv or .webm, use media or secure media (if available)
    if (post.data.secure_media?.reddit_video) {
      return post.data.secure_media.reddit_video.fallback_url;
    }

    if (post.data.media?.reddit_video) {
      return post.data.media.reddit_video.fallback_url;
    }

    // If media objects are not available, try preview
    if (post.data.preview?.reddit_video_preview) {
      return post.data.preview.reddit_video_preview.fallback_url;
    }

    // No usable formats available
    return null;
  }
}
