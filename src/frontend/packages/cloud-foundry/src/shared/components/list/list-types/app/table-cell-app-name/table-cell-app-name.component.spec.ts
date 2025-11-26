import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';
import { ROUTER_NAVIGATION } from '@ngrx/router-store';
import { Store, StoreModule } from '@ngrx/store';

import { appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';

import { TableCellAppNameComponent } from './table-cell-app-name.component';
describe('TableCellAppNameComponent', () => {
  let component: TableCellAppNameComponent<unknown>;
  let fixture: ComponentFixture<TableCellAppNameComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAppNameComponent,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
        ),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
                ...generateCFEntities()
              ]
            }
          ]
        },
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ]
    })
      .compileComponents();

    TestBed.inject(Store).dispatch({
      type: ROUTER_NAVIGATION,
      payload: {
        event: {
          url: 'url'
        }
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppNameComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} };
    // Don't call detectChanges to avoid triggering ngOnInit
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
