import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { STRATOS_ENDPOINT_TYPE, systemInfoEntityType } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { EntityListViewComponent } from './entity-list-view.component';

describe('EntityListViewComponent', () => {
  let component: EntityListViewComponent;
  let fixture: ComponentFixture<EntityListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...STORE_TEST_PROVIDERS
      ],
      imports: [
        EntityListViewComponent,
        NoopAnimationsModule,
        createBasicStoreModule()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntityListViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize provider on ngOnInit with entity config', () => {
    component.config = {
      entityConfig: {
        entityType: systemInfoEntityType,
        endpointType: STRATOS_ENDPOINT_TYPE,
      },
    };
    component.ngOnInit();
    expect(component.provider).toBeDefined();
  });
});
