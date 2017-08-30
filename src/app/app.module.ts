import { HttpModule } from '@angular/http';
import { APIEffect } from './store/effects/api.effects';
import { EffectsModule } from '@ngrx/effects';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { apiReducer } from './store/reducers/api.reducer';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HttpModule,
    BrowserModule,
    StoreModule.forRoot({ api: apiReducer }),
    StoreDevtoolsModule.instrument({
      maxAge: 25
    }),
    EffectsModule.forRoot([
      APIEffect
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
