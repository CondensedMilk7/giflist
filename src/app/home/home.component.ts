import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RedditService } from '../shared/data-access/reddit.service';
import { GifListCopmonent } from '../shared/ui/gif-list.component';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { Gif } from '../shared/interfaces';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchBarComponent } from './ui/search-bar.component';
import { SettingsComponent } from '../settings/settings.component';
import { StorageService } from '../shared/data-access/storage.service';
import { RouterModule } from '@angular/router';

@Component({
  imports: [
    CommonModule,
    IonicModule,
    GifListCopmonent,
    ReactiveFormsModule,
    SearchBarComponent,
    SettingsComponent,
    RouterModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <ion-header>
        <ion-toolbar>
          <app-search-bar
            [subredditFormControl]="subredditFormControl"
          ></app-search-bar>
          <ion-buttons slot="end">
            <ion-button routerLink="/saved">
              <ion-icon slot="icon-only" name="bookmark"></ion-icon>
            </ion-button>
            <ion-button
              id="settings-button"
              (click)="settingsModalOpen$.next(true)"
            >
              <ion-icon slot="icon-only" name="settings"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-progress-bar
          *ngIf="vm.isLoading"
          type="indeterminate"
          reversed="true"
        ></ion-progress-bar>
      </ion-header>
      <ion-content>
        <ion-popover
          trigger="settings-button"
          [isOpen]="vm.settingsModalOpen"
          (ionPopoverDidDismiss)="this.settingsModalOpen$.next(false)"
        >
          <ng-template>
            <app-settings></app-settings>
          </ng-template>
        </ion-popover>

        <app-gif-list
          *ngIf="vm.gifs"
          [gifs]="vm.gifs"
          (gifLoadStart)="setLoading($event)"
          (gifLoadComplete)="setLoadingComplete($event)"
          (startPlayingGif)="startPlaying($event)"
          (stopPlayingGif)="stopPlaying($event)"
          (save)="storageService.saveGif($event)"
          (unsave)="storageService.unsaveGif($event)"
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
  styles: [
    `
      ion-infinite-scroll-content {
        margin-top: 20px;
      }

      ion-buttons {
        margin: auto 0;
      }
    `,
  ],
})
export class HomeComponent {
  subredditFormControl = new FormControl('gifs');

  settingsModalOpen$ = new BehaviorSubject<boolean>(false);
  currentlyLoadingGifs$ = new BehaviorSubject<string[]>([]);
  loadedGifs$ = new BehaviorSubject<string[]>([]);
  currentlyPlayingGifs$ = new BehaviorSubject<string[]>([]);
  savedGifs$ = this.storageService.savedGifs$;

  gifs$ = combineLatest([
    this.redditService.getGifs(this.subredditFormControl),
    this.currentlyLoadingGifs$,
    this.loadedGifs$,
    this.currentlyPlayingGifs$,
    this.savedGifs$,
  ]).pipe(
    map(
      ([
        gifs,
        currentlyLoadingGifs,
        loadedGifs,
        currentlyPlayingGifs,
        savedGifs,
      ]) =>
        gifs.map((gif) => ({
          ...gif,
          loading: currentlyLoadingGifs.includes(gif.permalink),
          dataLoaded: loadedGifs.includes(gif.permalink),
          playing: currentlyPlayingGifs.includes(gif.permalink),
          saved: savedGifs.some(
            (savedGif) => savedGif.permalink === gif.permalink
          ),
        }))
    )
  );

  vm$ = combineLatest([
    this.gifs$.pipe(startWith([])),
    this.settingsModalOpen$,
    this.redditService.isLoading$,
  ]).pipe(
    map(([gifs, settingsModalOpen, isLoading]) => ({
      gifs,
      settingsModalOpen,
      isLoading,
    }))
  );

  constructor(
    private redditService: RedditService,
    public storageService: StorageService
  ) {}

  startPlaying(permalink: string) {
    this.currentlyPlayingGifs$.next([
      ...this.currentlyPlayingGifs$.value,
      permalink,
    ]);
  }

  stopPlaying(permalink: string) {
    this.currentlyPlayingGifs$.next(
      this.currentlyPlayingGifs$.value.filter((gif) => gif !== permalink)
    );
  }

  setLoading(permalink: string) {
    this.currentlyLoadingGifs$.next([
      ...this.currentlyLoadingGifs$.value,
      permalink,
    ]);
  }

  setLoadingComplete(permalinkToComplete: string) {
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
