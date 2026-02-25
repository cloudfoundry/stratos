import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { DetachAppsComponent } from './detach-apps.component';

describe('DetachAppsComponent', () => {
  let component: DetachAppsComponent;
  let fixture: ComponentFixture<DetachAppsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DetachAppsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        DatePipe,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                serviceInstanceId: 'serviceInstanceId',
                endpointId: 'endpointId'
              }
            }
          }
        },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetachAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
