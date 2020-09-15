import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CreateApplicationStep1Component } from './create-application-step1.component';

describe('CreateApplicationStep1Component', () => {
  let component: CreateApplicationStep1Component;
  let fixture: ComponentFixture<CreateApplicationStep1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateApplicationStep1Component,
      ],
      imports: [
        generateCfBaseTestModules(),
      ],
      providers: [CfOrgSpaceDataService, PaginationMonitorFactory, {
        provide: ActivatedRoute,
        useValue: {
          root: {
            snapshot: {
              queryParams: { endpointGuid: null },
            }
          }
        }
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
