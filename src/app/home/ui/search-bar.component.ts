import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-bar',
  template: `
    <ion-searchbar
      [formControl]="subredditFormControl"
      animated
      placeholder="subreddit..."
      value=""
    ></ion-searchbar>
  `,
  styles: [
    `
      ion-searchbar {
        padding: 0 5px;
      }
    `,
  ],
})
export class SearchBarComponent {
  @Input() subredditFormControl!: FormControl;
}
