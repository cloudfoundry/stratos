import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaaspComponent } from './caasp.component';

describe('CaaspComponent', () => {
  let component: CaaspComponent;
  let fixture: ComponentFixture<CaaspComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaaspComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaaspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
