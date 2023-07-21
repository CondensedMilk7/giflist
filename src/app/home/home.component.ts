import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RedditService } from '../shared/data-access/reddit.service';
import { GifListCopmonent } from './ui/gif-list.component';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, map, startWith, tap } from 'rxjs';
import { Gif } from '../shared/interfaces';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchBarComponent } from './ui/search-bar.component';
import { SettingsComponent } from '../settings/settings.component';
import { SettingsService } from '../shared/data-access/settings.service';

@Component({
  imports: [
    CommonModule,
    IonicModule,
    GifListCopmonent,
    ReactiveFormsModule,
    SearchBarComponent,
    SettingsComponent,
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
          color="dark"
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
export class HomeComponent implements OnInit {
  subredditFormControl = new FormControl('gifs');

  settingsModalOpen$ = new BehaviorSubject<boolean>(false);
  currentlyLoadingGifs$ = new BehaviorSubject<string[]>([]);
  loadedGifs$ = new BehaviorSubject<string[]>([]);

  gifs$ = combineLatest([
    this.redditService.getGifs(this.subredditFormControl),
    this.currentlyLoadingGifs$,
    this.loadedGifs$,
  ]).pipe(
    map(([gifs, currentlyLoadingGifs, loadedGifs]) =>
      gifs.map((gif) => ({
        ...gif,
        loading: currentlyLoadingGifs.includes(gif.permalink),
        dataLoaded: loadedGifs.includes(gif.permalink),
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
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.init();
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
