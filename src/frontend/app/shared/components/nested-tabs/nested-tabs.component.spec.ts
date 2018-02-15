import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NestedTabsComponent } from './nested-tabs.component';

describe('NestedTabsComponent', () => {
  let component: NestedTabsComponent;
  let fixture: ComponentFixture<NestedTabsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NestedTabsComponent ]
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
