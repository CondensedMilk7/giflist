import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RedditService } from '../shared/data-access/reddit.service';
import { GifListCopmonent } from './ui/gif-list.component';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, map, startWith, tap } from 'rxjs';
import { Gif } from '../shared/interfaces';

@Component({
  imports: [CommonModule, IonicModule, GifListCopmonent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <ion-header>
        <ion-toolbar>
          <ion-title>Home</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <app-gif-list
          *ngIf="vm.gifs"
          [gifs]="vm.gifs"
          (gifLoadStart)="setLoading($event)"
          (gifLoadComplete)="setLoadingCoplete($event)"
        ></app-gif-list>

        <ion-infinite-scroll
          threshold="100px"
          (ionInfinite)="loadMore($event, vm.gifs)"
        >
          <ion-infinite-scroll-content
            loadingSpinner="bubbles"
            loadingText="Fetching gifs..."
          >
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </ion-content>
    </ng-container>
  `,
})
export class HomeComponent {
  currentlyLoadingGifs$ = new BehaviorSubject<string[]>([]);
  loadedGifs$ = new BehaviorSubject<string[]>([]);

  gifs$ = combineLatest([
    this.redditService.getGifs(),
    this.currentlyLoadingGifs$,
    this.loadedGifs$,
  ]).pipe(
    map(([gifs, currentlyLoadingGifs, loadedGifs]) =>
      gifs.map((gif) => ({
        ...gif,
        loading: currentlyLoadingGifs.includes(gif.permalink),
        dataLoaded: loadedGifs.includes(gif.permalink),
      }))
    ),
    tap((gifs) => console.log(gifs))
  );

  vm$ = combineLatest([this.gifs$.pipe(startWith([]))]).pipe(
    map(([gifs]) => ({ gifs }))
  );

  constructor(private redditService: RedditService) {}

  setLoading(permalink: string) {
    this.currentlyLoadingGifs$.next([
      ...this.currentlyLoadingGifs$.value,
      permalink,
    ]);
  }

  setLoadingCoplete(permalinkToComplete: string) {
    this.loadedGifs$.next([...this.loadedGifs$.value, permalinkToComplete]);

    this.currentlyLoadingGifs$.next([
      ...this.currentlyLoadingGifs$.value.filter(
        (permalink) => !this.loadedGifs$.value.includes(permalink)
      ),
    ]);
  }

  loadMore(ev: Event, currentGifs: Gif[]) {
    this.redditService.nextPage(ev, currentGifs[currentGifs.length - 1].name);
  }
}
