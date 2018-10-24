import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StratosTitleComponent } from './stratos-title.component';

describe('StratosTitleComponent', () => {
  let component: StratosTitleComponent;
  let fixture: ComponentFixture<StratosTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StratosTitleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StratosTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
