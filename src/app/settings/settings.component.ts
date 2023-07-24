import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, PopoverController } from '@ionic/angular';
import { Settings, Theme } from '../shared/interfaces';
import { SettingsFormComponent } from './ui/settings-form.component';
import { tap } from 'rxjs';
import { StorageService } from '../shared/data-access/storage.service';
import { ThemeSwitchComponent } from './ui/theme-switch.component';
import { ThemeService } from '../shared/data-access/theme.service';

@Component({
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    SettingsFormComponent,
    ThemeSwitchComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings',
  template: `
    <ion-header>
      <ion-toolbar color="light">
        <ion-buttons slot="end">
          <ion-button (click)="popoverCtrl.dismiss()">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-theme-switch
        *ngIf="theme$ | async"
        [themeControl]="themeControl"
        (setTheme)="themeService.setTheme(themeControl.getRawValue())"
      ></app-theme-switch>
      <app-settings-form
        *ngIf="settings$ | async"
        [settingsForm]="settingsForm"
        (save)="handleSave()"
      ></app-settings-form>
    </ion-content>
  `,
  styles: [
    `
      :host {
        height: 100%;
      }

      ion-segment {
        --ion-background-color: #fff;
      }
    `,
  ],
})
export class SettingsComponent {
  settingsForm = this.fb.group<Settings>({
    perPage: 10,
    sort: 'hot',
  });

  themeControl = this.fb.control<Theme>('system');

  settings$ = this.storageService.settings$.pipe(
    tap((settings) => this.settingsForm.patchValue(settings))
  );

  theme$ = this.themeService.currentTheme$.pipe(
    tap((theme) => theme && this.themeControl.patchValue(theme))
  );

  constructor(
    private fb: NonNullableFormBuilder,
    public storageService: StorageService,
    public themeService: ThemeService,
    public popoverCtrl: PopoverController
  ) {}

  handleSave() {
    this.storageService.saveSettings(this.settingsForm.getRawValue());
    this.popoverCtrl.dismiss();
  }
}
