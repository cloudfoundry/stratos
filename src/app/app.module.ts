import { NgModule } from '@angular/core';

// import { environment } from './../environments/environment';
import { AppComponent } from './app.component';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppStoreModule } from './store/store.module';
import { RouteModule } from './app.routing';
import { ApplicationsModule } from './features/applications/applications.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
    AppStoreModule,
    SharedModule,
    RouteModule,
    ApplicationsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
