import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { CloudFoundryCellBaseComponent } from './cloud-foundry-cell-base.component';


describe('CloudFoundryCellBaseComponent', () => {
  let component: CloudFoundryCellBaseComponent;
  let fixture: ComponentFixture<CloudFoundryCellBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryCellBaseComponent],
      imports: [...BaseTestModules],
      providers: [ActiveRouteCfOrgSpace]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
