import { Inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Theme } from '../interfaces';
import { take } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  currentTheme$ = this.storageService.theme$;

  constructor(
    private storageService: StorageService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  init() {
    this.currentTheme$.pipe(take(1)).subscribe((theme) => {
      this.applyTheme(theme);
    });
  }

  setTheme(theme: Theme) {
    this.applyTheme(theme);
    this.storageService.saveTheme(theme);
  }

  private applyTheme(theme: Theme) {
    this.document.body.removeAttribute('color-theme');
    if (theme === 'dark' || theme === 'light') {
      this.document.body.setAttribute('color-theme', theme);
    }
  }
}
