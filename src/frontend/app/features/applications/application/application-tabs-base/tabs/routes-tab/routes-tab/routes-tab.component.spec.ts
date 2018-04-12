import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesTabComponent } from './routes-tab.component';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoutesTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
