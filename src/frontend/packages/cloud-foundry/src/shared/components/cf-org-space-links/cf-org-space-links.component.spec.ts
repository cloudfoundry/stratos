import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceLabelService } from '../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from './cf-org-space-links.component';


describe('CfOrgSpaceLinksComponent', () => {
  let component: CfOrgSpaceLinksComponent;
  let fixture: ComponentFixture<CfOrgSpaceLinksComponent>;
  let service;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [CfOrgSpaceLinksComponent],
      imports: [
        RouterTestingModule,
        generateCfStoreModules()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    service = jasmine.createSpyObj<CfOrgSpaceLabelService>('CfOrgSpaceLabelService', [
      'getCfName',
      'getCfURL',
      'getOrgName',
      'getOrgURL',
      'getSpaceName',
      'getSpaceURL'
    ]);
    service.multipleConnectedEndpoints$ = of(false);
    service.getCfName.mockReturnValue(of('CfName'));
    service.getCfURL.mockReturnValue(['/cf/path']);
    service.getOrgName.mockReturnValue(of('OrgName'));
    service.getOrgURL.mockReturnValue(['/org/path']);
    service.getSpaceName.mockReturnValue(of('SpaceName'));
    service.getSpaceURL.mockReturnValue(['/space/path']);
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
