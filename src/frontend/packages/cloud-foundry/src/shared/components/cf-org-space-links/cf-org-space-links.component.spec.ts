import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CfOrgSpaceLinksComponent } from "./cf-org-space-links.component";

describe('CfOrgSpaceLinksComponent', () => {
  let component: CfOrgSpaceLinksComponent;
  let fixture: ComponentFixture<CfOrgSpaceLinksComponent>;
  let service;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CfOrgSpaceLinksComponent,
      ],
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
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
      // Create a new service instance with multipleConnectedEndpoints$ set to true
      service = {
        getCfName: vi.fn().mockReturnValue(of('CfName')),
        getCfURL: vi.fn().mockReturnValue(['/cf/path']),
        getOrgName: vi.fn().mockReturnValue(of('OrgName')),
        getOrgURL: vi.fn().mockReturnValue(['/org/path']),
        getSpaceName: vi.fn().mockReturnValue(of('SpaceName')),
        getSpaceURL: vi.fn().mockReturnValue(['/space/path']),
        multipleConnectedEndpoints$: of(true)
      };
      // Recreate the component with the new service
      fixture = TestBed.createComponent(CfOrgSpaceLinksComponent);
      component = fixture.componentInstance;
      component.service = service;
      fixture.detectChanges();
    });

    it('should render cf if multiple', () => {
      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toEqual('CfName / OrgName / SpaceName');
    });
  });
});
