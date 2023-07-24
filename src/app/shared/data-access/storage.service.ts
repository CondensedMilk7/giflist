import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  from,
  map,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Gif, Settings, Theme } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class StorageService {
  #hasLoaded = false;

  storage$ = from(this.ionicStorage.create()).pipe(shareReplay(1));

  load$: Observable<{ settings: Settings; savedGifs: Gif[]; theme: Theme }> =
    this.storage$.pipe(
      switchMap((storage) =>
        combineLatest([
          from(storage.get('settings')),
          from(storage.get('saved_gifs')),
          from(storage.get('theme')),
        ])
      ),
      map(([settings, savedGifs, theme]) => ({ settings, savedGifs, theme })),
      tap(() => (this.#hasLoaded = true)),
      shareReplay(1)
    );

  #settings$ = new BehaviorSubject<Settings>({ perPage: 10, sort: 'hot' });
  #savedGifs$ = new BehaviorSubject<Gif[]>([]);
  #theme$ = new Subject<Theme>();

  settings$ = this.#settings$.asObservable();
  savedGifs$ = this.#savedGifs$.asObservable();
  theme$ = this.#theme$.asObservable().pipe(shareReplay(1));

  constructor(private ionicStorage: Storage) {}

  init() {
    this.load$.pipe(take(1)).subscribe(({ settings, savedGifs, theme }) => {
      if (settings) {
        this.#settings$.next(settings);
      }
      if (savedGifs) {
        this.#savedGifs$.next(savedGifs);
      }
      if (theme) {
        this.#theme$.next(theme);
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

  saveTheme(theme: Theme) {
    this.#theme$.next(theme);
    this.save('theme', theme);
  }

  private save(key: string, value: any) {
    if (this.#hasLoaded) {
      this.storage$.pipe(take(1)).subscribe((storage) => {
        storage.set(key, value);
      });
    }
  }
}
