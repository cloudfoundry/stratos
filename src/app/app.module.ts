import { HttpModule } from '@angular/http';
import { APIEffect } from './store/effects/api.effects';
import { EffectsModule } from '@ngrx/effects';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HttpModule,
    BrowserModule,
    EffectsModule.forRoot([
      APIEffect
    ]),
    StoreModule.forRoot({ reducer: () => {} })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
