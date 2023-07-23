import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { GifListCopmonent } from '../shared/ui/gif-list.component';
import { StorageService } from '../shared/data-access/storage.service';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

@Component({
  imports: [CommonModule, IonicModule, RouterModule, GifListCopmonent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Saved Gifs</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/home">
            <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <app-gif-list
        *ngIf="gifs$ | async as gifs"
        [gifs]="gifs"
        (gifLoadStart)="setLoading($event)"
        (gifLoadComplete)="setLoadingComplete($event)"
        (startPlayingGif)="startPlaying($event)"
        (stopPlayingGif)="stopPlaying($event)"
        (unsave)="storageService.unsaveGif($event)"
      ></app-gif-list>
    </ion-content>
  `,
  styles: [``],
})
export class SavedGifsComponent {
  private savedGifs$ = this.storageService.savedGifs$;

  private currentlyLoadingGifs$ = new BehaviorSubject<string[]>([]);
  private loadedGifs$ = new BehaviorSubject<string[]>([]);
  private currentlyPlayingGifs$ = new BehaviorSubject<string[]>([]);

  gifs$ = combineLatest([
    this.savedGifs$,
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
        gifs
          .map((gif) => ({
            ...gif,
            loading: currentlyLoadingGifs.includes(gif.permalink),
            dataLoaded: loadedGifs.includes(gif.permalink),
            playing: currentlyPlayingGifs.includes(gif.permalink),
            saved: savedGifs.some(
              (savedGif) => savedGif.permalink === gif.permalink
            ),
          }))
          .reverse()
    )
  );

  constructor(public storageService: StorageService) {}

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
}
