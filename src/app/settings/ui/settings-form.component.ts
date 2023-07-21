import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: `app-settings-form`,
  template: `
    <form [formGroup]="settingsForm" (ngSubmit)="save.emit(true)">
      <ion-segment color="primary" formControlName="sort">
        <ion-segment-button value="hot">
          <ion-label>Hot</ion-label>
        </ion-segment-button>
        <ion-segment-button value="new">
          <ion-label>New</ion-label>
        </ion-segment-button>
      </ion-segment>

      <ion-segment color="primary" formControlName="perPage">
        <ion-segment-button value="10">10</ion-segment-button>
        <ion-segment-button value="20">20</ion-segment-button>
        <ion-segment-button value="30">30</ion-segment-button>
      </ion-segment>

      <ion-button type="submit" expand="full">Save</ion-button>
    </form>
  `,
  styles: [
    `
      form > * {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class SettingsFormComponent {
  @Input() settingsForm!: FormGroup;
  @Output() save = new EventEmitter<boolean>();
}
