import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VariablesTabComponent } from './variables-tab.component';

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VariablesTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VariablesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
