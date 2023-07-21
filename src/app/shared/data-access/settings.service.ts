import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import {
  BehaviorSubject,
  Observable,
  from,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Settings } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  #hasLoaded = false;

  storage$ = from(this.ionicStorage.create()).pipe(shareReplay(1));
  load$: Observable<Settings> = this.storage$.pipe(
    switchMap((storage) => from(storage.get('settings'))),
    tap(() => (this.#hasLoaded = true)),
    shareReplay(1)
  );

  #settings$ = new BehaviorSubject<Settings>({ perPage: 10, sort: 'hot' });

  settings$ = this.#settings$.asObservable();

  constructor(private ionicStorage: Storage) {}

  init() {
    this.load$.pipe(take(1)).subscribe((settings) => {
      if (settings) {
        this.#settings$.next(settings);
      }
    });
  }

  save(settings: Settings) {
    this.#settings$.next(settings);
    console.log(settings);
    if (this.#hasLoaded) {
      this.storage$.pipe(take(1)).subscribe((storage) => {
        storage.set('settings', settings);
      });
    }
  }
}
