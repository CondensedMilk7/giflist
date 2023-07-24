import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { StorageService } from './shared/data-access/storage.service';
import { ThemeService } from './shared/data-access/theme.service';

@Component({
  imports: [IonicModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  constructor(
    private storageService: StorageService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.storageService.init();
    this.themeService.init();
  }
}
