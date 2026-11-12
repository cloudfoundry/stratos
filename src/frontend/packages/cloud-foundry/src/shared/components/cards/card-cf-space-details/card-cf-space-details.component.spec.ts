import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  const create = (setup: (svc: CloudFoundrySpaceServiceMock) => void = () => {}) => {
    setup(TestBed.inject(CloudFoundrySpaceService) as unknown as CloudFoundrySpaceServiceMock);
    fixture = TestBed.createComponent(CardCfSpaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('should create', () => {
    create();
    expect(component).toBeTruthy();
  });

  it('links the space\'s own quota to its quota page', () => {
    create(svc => svc.spaceQuotaDefinition$ = of({ name: 'small' }) as never);
    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href*="space-quota"]');
    expect(link?.getAttribute('href')).toBe('/cloud-foundry/cf-1/organizations/org-1/spaces/space-1/space-quota');
    expect(link?.textContent?.trim()).toBe('small');
  });

  it('sends a space without a quota to the organization\'s quota once', () => {
    create(svc => svc.quotaDefinition$ = of({ name: 'org-quota' }) as never);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(text()).toContain('None assigned');
    const link = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'))
      .find(a => a.textContent?.includes('view organization\'s quota'));
    link!.click();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cloud-foundry', 'cf-1', 'organizations', 'org-1', 'quota']);
  });

  it('says whether SSH is enabled for the space', () => {
    create(svc => svc.spaceDataService.space = (() => ({ allowSsh: false })) as never);
    expect(text()).toContain('Disabled');
  });
});
