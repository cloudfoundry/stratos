import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryStacksComponent } from './cloud-foundry-stacks.component';

describe('CloudFoundryStacksComponent', () => {
  let component: CloudFoundryStacksComponent;
  let fixture: ComponentFixture<CloudFoundryStacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryStacksComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryStacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
