import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationServiceMock, generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ApplicationService } from '../../application.service';
import { MapRoutesComponent } from './map-routes.component';

describe('MapRoutesComponent', () => {
  let component: MapRoutesComponent;
  let fixture: ComponentFixture<MapRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MapRoutesComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        DatePipe,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
