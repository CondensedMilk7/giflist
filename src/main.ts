import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom([IonicModule.forRoot(), HttpClientModule]),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
  ],
}).catch((err) => console.log(err));
