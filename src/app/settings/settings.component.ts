import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, PopoverController } from '@ionic/angular';
import { Settings } from '../shared/interfaces';
import { SettingsService } from '../shared/data-access/settings.service';
import { SettingsFormComponent } from './ui/settings-form.component';
import { tap } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    SettingsFormComponent,
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

  settings$ = this.settingsService.settings$.pipe(
    tap((settings) => this.settingsForm.patchValue(settings))
  );

  constructor(
    private fb: NonNullableFormBuilder,
    public settingsService: SettingsService,
    public popoverCtrl: PopoverController
  ) {}

  handleSave() {
    this.settingsService.save(this.settingsForm.getRawValue());
    this.popoverCtrl.dismiss();
  }
}
