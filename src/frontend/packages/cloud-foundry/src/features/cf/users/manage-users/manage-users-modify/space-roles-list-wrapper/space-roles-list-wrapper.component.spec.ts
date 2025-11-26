import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryTestingModule, generateActiveRouteCfOrgSpaceMock, CF_BASE_TEST_PROVIDERS } from '@test-framework/cf';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper.component';

describe('SpaceRolesListWrapperComponent', () => {
  let component: SpaceRolesListWrapperComponent;
  let fixture: ComponentFixture<SpaceRolesListWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SpaceRolesListWrapperComponent,
        NoopAnimationsModule,
      ],
      providers: [
        ...CF_BASE_TEST_PROVIDERS,
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          createBasicStoreModule(),
          CloudFoundryTestingModule
        ),
        generateActiveRouteCfOrgSpaceMock(),
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceRolesListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
