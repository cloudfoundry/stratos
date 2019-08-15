import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { testSCFGuid } from '../../../../../core/test-framework/store-test-helper';
import { QuotaDefinitionComponent } from './quota-definition.component';

describe('QuotaDefinitionComponent', () => {
  let component: QuotaDefinitionComponent;
  let fixture: ComponentFixture<QuotaDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QuotaDefinitionComponent],
      imports: [...BaseTestModules],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { cfGuid: testSCFGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        generateTestCfEndpointServiceProvider(),
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuotaDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
