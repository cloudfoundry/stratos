import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared, CloudFoundrySpaceServiceMock } from '@test-framework/cf';
import { CloudFoundrySpaceService } from '../../../../features/cf/services/cloud-foundry-space.service';
import { CardCfSpaceDetailsComponent } from './card-cf-space-details.component';

describe('CardCfSpaceDetailsComponent', () => {
  let component: CardCfSpaceDetailsComponent;
  let fixture: ComponentFixture<CardCfSpaceDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardCfSpaceDetailsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfSpaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
