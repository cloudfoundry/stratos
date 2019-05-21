import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../tab-nav.service';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { QuotaDefinitionComponent } from './quota-definition.component';

describe('QuotaDefinitionComponent', () => {
  let component: QuotaDefinitionComponent;
  let fixture: ComponentFixture<QuotaDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QuotaDefinitionComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace, generateTestCfEndpointServiceProvider(), TabNavService]

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
