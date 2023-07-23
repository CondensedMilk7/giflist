import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  from,
  map,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Gif, Settings } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class StorageService {
  #hasLoaded = false;

  storage$ = from(this.ionicStorage.create()).pipe(shareReplay(1));

  load$: Observable<{ settings: Settings; savedGifs: Gif[] }> =
    this.storage$.pipe(
      switchMap((storage) =>
        combineLatest([
          from(storage.get('settings')),
          from(storage.get('saved_gifs')),
        ])
      ),
      map(([settings, savedGifs]) => ({ settings, savedGifs })),
      tap(() => (this.#hasLoaded = true)),
      shareReplay(1)
    );

  #settings$ = new BehaviorSubject<Settings>({ perPage: 10, sort: 'hot' });
  #savedGifs$ = new BehaviorSubject<Gif[]>([]);

  settings$ = this.#settings$.asObservable();
  savedGifs$ = this.#savedGifs$.asObservable();

  constructor(private ionicStorage: Storage) {}

  init() {
    this.load$.pipe(take(1)).subscribe(({ settings, savedGifs }) => {
      if (settings) {
        this.#settings$.next(settings);
      }
      if (savedGifs) {
        this.#savedGifs$.next(savedGifs);
      }
    });
  }

  saveSettings(settings: Settings) {
    this.#settings$.next(settings);
    this.save('settings', settings);
  }

  saveGif(gif: Gif) {
    this.#savedGifs$.next([...this.#savedGifs$.value, gif]);
    this.save('saved_gifs', this.#savedGifs$.value);
  }

  unsaveGif(gif: Gif) {
    this.#savedGifs$.next(
      this.#savedGifs$.value.filter(
        (savedGif) => savedGif.permalink !== gif.permalink
      )
    );
    this.save('saved_gifs', this.#savedGifs$.value);
  }

  private save(key: string, value: any) {
    if (this.#hasLoaded) {
      this.storage$.pipe(take(1)).subscribe((storage) => {
        storage.set(key, value);
      });
    }
  }
}
