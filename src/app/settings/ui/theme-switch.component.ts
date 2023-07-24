import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Theme } from 'src/app/shared/interfaces';

@Component({
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-theme-switch',
  template: `
    <form>
      <ion-segment [formControl]="themeControl">
        <ion-segment-button
          value="light"
          type="submit"
          (click)="setTheme.emit(themeControl.value)"
        >
          <ion-icon name="sunny"></ion-icon>
        </ion-segment-button>
        <ion-segment-button
          value="system"
          type="submit"
          (click)="setTheme.emit(themeControl.value)"
        >
          <ion-icon name="contrast"></ion-icon>
        </ion-segment-button>
        <ion-segment-button
          value="dark"
          type="submit"
          (click)="setTheme.emit(themeControl.value)"
        >
          <ion-icon name="moon"></ion-icon>
        </ion-segment-button>
      </ion-segment>
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
export class ThemeSwitchComponent {
  @Input() themeControl!: FormControl;
  @Output() setTheme = new EventEmitter<Theme>();
}
