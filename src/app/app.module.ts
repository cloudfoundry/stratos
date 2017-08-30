import { LoginEffect } from './store/effects/login.effects';
import { authReducer } from './store/reducers/auth.reducer';
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
    StoreModule.forRoot({
      api: apiReducer,
      auth: authReducer
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25
    }),
    EffectsModule.forRoot([
      APIEffect,
      LoginEffect
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
