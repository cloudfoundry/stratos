import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryStacksComponent } from './cloud-foundry-stacks.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('CloudFoundryStacksComponent', () => {
  let component: CloudFoundryStacksComponent;
  let fixture: ComponentFixture<CloudFoundryStacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryStacksComponent],
      imports: [...BaseTestModules],
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
