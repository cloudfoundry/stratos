import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { entityCatalog, EntityServiceFactory, generateStratosEntities } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule } from "@test-framework/core-test.helper";
import { TabNavService } from '../../../../tab-nav.service';
import { RestoreEndpointsComponent } from './restore-endpoints.component';

describe('RestoreEndpointsComponent', () => {
  let component: RestoreEndpointsComponent;
  let fixture: ComponentFixture<RestoreEndpointsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        AppTestModule,
        RouterTestingModule,
        RestoreEndpointsComponent,
      ],
      providers: [
        TabNavService,
        EntityServiceFactory,
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ],
    });

    // Register entities AFTER modules are loaded
    const entities = generateStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestoreEndpointsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
