import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { generateCFEntities } from '../../../cf-entity-generator';
import { CfOrgSpaceLabelService } from '../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from "./cf-org-space-links.component";

describe('CfOrgSpaceLinksComponent', () => {
  let component: CfOrgSpaceLinksComponent;
  let fixture: ComponentFixture<CfOrgSpaceLinksComponent>;
  let service;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CfOrgSpaceLinksComponent,
        RouterTestingModule,
        ...generateCfStoreModules(),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    service = {
      getCfName: vi.fn().mockReturnValue(of('CfName')),
      getCfURL: vi.fn().mockReturnValue(['/cf/path']),
      getOrgName: vi.fn().mockReturnValue(of('OrgName')),
      getOrgURL: vi.fn().mockReturnValue(['/org/path']),
      getSpaceName: vi.fn().mockReturnValue(of('SpaceName')),
      getSpaceURL: vi.fn().mockReturnValue(['/space/path']),
      multipleConnectedEndpoints$: of(false)
    };
    fixture = TestBed.createComponent(CfOrgSpaceLinksComponent);
    component = fixture.componentInstance;
    component.service = service;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render only org and space', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toEqual('OrgName / SpaceName');
  });

  describe('with multiple endpoints', () => {
    beforeEach(() => {
      service.multipleConnectedEndpoints$ = of(true);
      fixture.detectChanges();
    });

    it('should render cf if multiple', () => {
      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toEqual('CfName / OrgName / SpaceName');
    });
  });
});
