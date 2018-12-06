import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryUsersComponent } from './cloud-foundry-users.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('CloudFoundryUsersComponent', () => {
  let component: CloudFoundryUsersComponent;
  let fixture: ComponentFixture<CloudFoundryUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryUsersComponent],
      imports: [
        ...BaseTestModules
      ],
      providers: [
        ActiveRouteCfOrgSpace
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
