import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { NestedTabsComponent } from './nested-tabs.component';

describe('NestedTabsComponent', () => {
  let component: NestedTabsComponent;
  let fixture: ComponentFixture<NestedTabsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NestedTabsComponent],
      imports: [...BaseTestModulesNoShared]
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
