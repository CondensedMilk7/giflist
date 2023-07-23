import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  expand,
  map,
  scan,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  Gif,
  RedditPagination,
  RedditPost,
  RedditResponse,
} from '../interfaces';
import { FormControl } from '@angular/forms';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class RedditService {
  private pagination$ = new BehaviorSubject<RedditPagination>({
    after: null,
    infiniteScroll: null,
    retries: 0,
    totalFound: 0,
  });

  isLoading$ = new BehaviorSubject<boolean>(false);

  private settings$ = this.storageService.settings$;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  nextPage(infinteScrollEvent: Event, after: string) {
    this.pagination$.next({
      after,
      totalFound: 0,
      retries: 0,
      infiniteScroll:
        infinteScrollEvent?.target as HTMLIonInfiniteScrollElement,
    });
  }

  getGifs(subredditFormControl: FormControl) {
    const subreddit$ = subredditFormControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(subredditFormControl.value),
      tap(() =>
        this.pagination$.next({
          after: null,
          infiniteScroll: null,
          retries: 0,
          totalFound: 0,
        })
      )
    );

    // BEHOLD! The power of RxJS!
    // Recursively fetch gifs to meet the settings.perPage requirement
    return combineLatest([subreddit$, this.settings$]).pipe(
      switchMap(([subreddit, settings]) => {
        // Fetch gifs stream
        const gifsForCurrentPage$ = this.pagination$.pipe(
          tap(() => this.isLoading$.next(true)),
          concatMap((pagination) =>
            this.fetchFromReddit(
              subreddit,
              settings.sort,
              pagination.after,
              settings.perPage
            ).pipe(
              // Keep retrying until we have enough valid gifs to fill a page
              // 'expand' will keep repeating itself as long as it returns
              // a non-empty observable
              expand((res, index) => {
                const validGifs = res.gifs.filter((gif) => gif.src !== null);
                const gifsRequired = res.gifsRequired - validGifs.length;
                const maxAttempts = 10;

                // Keep trying if all criteria is met
                // - we need more gifs to fill the page
                // - we got at least one gif back from the API
                // - we haven't exceeded the max retries
                const shouldKeepTrying =
                  gifsRequired > 0 && res.gifs.length && index < maxAttempts;

                if (!shouldKeepTrying) {
                  pagination.infiniteScroll?.complete();
                  this.isLoading$.next(false);
                }

                return shouldKeepTrying
                  ? this.fetchFromReddit(
                      subreddit,
                      settings.sort,
                      res.gifs[res.gifs.length - 1].name,
                      gifsRequired
                    )
                  : EMPTY; // Stop retrying
              }),
              // Filter out any gifs without a src, and don't return more than the amount required
              // NOTE: Even though expand will keep repeating, each result of expand will be passed
              // here immediately without waiting for all expand calls to complete
              map((res) =>
                res.gifs
                  .filter((gif) => gif.src !== null)
                  .slice(0, res.gifsRequired)
              )
            )
          )
        );

        // Every time we get a new list of gifs, add it to cached gifs
        const allGifs$ = gifsForCurrentPage$.pipe(
          scan((previousGifs, currentGifs) => [...previousGifs, ...currentGifs])
        );

        return allGifs$;
      })
    );
  }

  fetchFromReddit(
    subreddit: string,
    sort: string,
    after: string | null,
    gifsRequired: number
  ) {
    return this.http
      .get<RedditResponse>(
        `https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=100` +
          (after ? `&after=${after}` : '')
      )
      .pipe(
        catchError(() => EMPTY),
        map((res) => ({
          gifs: this.convertRedditPostsToGifs(res.data.children),
          gifsRequired,
        }))
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
