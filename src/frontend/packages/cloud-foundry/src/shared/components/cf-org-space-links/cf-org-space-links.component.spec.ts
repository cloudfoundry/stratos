import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceLabelService } from '../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from './cf-org-space-links.component';


describe('CfOrgSpaceLinksComponent', () => {
  let component: CfOrgSpaceLinksComponent;
  let fixture: ComponentFixture<CfOrgSpaceLinksComponent>;
  let service;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfOrgSpaceLinksComponent],
      imports: [
        RouterTestingModule,
        generateCfStoreModules()
      ]
    })
      .compileComponents();
  }));

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
    service.getCfName.and.returnValue(of('CfName'));
    service.getCfURL.and.returnValue(['/cf/path']);
    service.getOrgName.and.returnValue(of('OrgName'));
    service.getOrgURL.and.returnValue(['/org/path']);
    service.getSpaceName.and.returnValue(of('SpaceName'));
    service.getSpaceURL.and.returnValue(['/space/path']);
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
