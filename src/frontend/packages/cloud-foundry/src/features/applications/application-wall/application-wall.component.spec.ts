import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ApplicationWallComponent } from './application-wall.component';

describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationWallComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

describe('ApplicationWallComponent.countDuplicateUrlEndpoints', () => {
  const ep = (guid: string, host: string) => ({
    guid,
    name: guid,
    api_endpoint: { Scheme: 'https', Host: host, Path: '' },
  } as any);

  it('returns null for zero or one endpoint', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([])).toBeNull();
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([ep('a', 'cf.a')])).toBeNull();
  });

  it('returns null when all URLs are distinct', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf-a.example.com'),
      ep('b', 'cf-b.example.com'),
    ])).toBeNull();
  });

  it('returns endpoint count in duplicate groups when URLs collide', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf.example.com'),
      ep('b', 'cf.example.com'),
    ])).toBe(2);
  });

  it('counts only endpoints in duplicate groups, not distinct-URL endpoints', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf.example.com'),
      ep('b', 'cf.example.com'),
      ep('c', 'cf-other.example.com'),
    ])).toBe(2);
  });

  it('sums across multiple duplicate groups', () => {
    expect(ApplicationWallComponent.countDuplicateUrlEndpoints([
      ep('a', 'cf.example.com'),
      ep('b', 'cf.example.com'),
      ep('c', 'cf-two.example.com'),
      ep('d', 'cf-two.example.com'),
      ep('e', 'cf-two.example.com'),
    ])).toBe(5);
  });
});
