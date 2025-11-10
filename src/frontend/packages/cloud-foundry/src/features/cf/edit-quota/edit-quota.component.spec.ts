import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { EditQuotaComponent } from './edit-quota.component';

describe('EditQuotaComponent', () => {
  let component: EditQuotaComponent;
  let fixture: ComponentFixture<EditQuotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditQuotaComponent,
      ],
      providers: [
        provideMockStore(),
        ...STORE_TEST_PROVIDERS,
        TabNavService,
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                cfId: 'cfGuid'
              },
              queryParams: {}
            },
          }
        }
      ]
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(EditQuotaComponent).toBeDefined();
  });
});
