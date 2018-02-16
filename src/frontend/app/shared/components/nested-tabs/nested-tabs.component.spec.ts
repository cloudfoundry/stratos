import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { getBaseTestModulesNoShared } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { NestedTabsComponent } from './nested-tabs.component';

describe('NestedTabsComponent', () => {
  let component: NestedTabsComponent;
  let fixture: ComponentFixture<NestedTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NestedTabsComponent],
      imports: [...getBaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NestedTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
