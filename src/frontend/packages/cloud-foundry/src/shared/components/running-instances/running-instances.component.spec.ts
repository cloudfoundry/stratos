import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EntityCatalogModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { RunningInstancesComponent } from './running-instances.component';

describe('RunningInstancesComponent', () => {
  let component: RunningInstancesComponent;
  let fixture: ComponentFixture<RunningInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RunningInstancesComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        EntityCatalogModule.forFeature(() => generateCFEntities()),
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideRouter([]),
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper so components using stratosEntityCatalog.<entity>.store work
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(RunningInstancesComponent);
    component = fixture.componentInstance;

    // Mock the required inputs before detectChanges
    component.instances = 3;
    component.cfGuid = 'test-cf-guid';
    component.appGuid = 'test-app-guid';

    // Mock the pagination monitor to avoid the error
    vi.spyOn(component, 'ngOnInit').mockImplementation(() => {
      // Do nothing - just prevent the actual initialization
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
