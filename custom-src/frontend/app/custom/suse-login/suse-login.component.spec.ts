import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuseLoginComponent } from './suse-login.component';

describe('SuseLoginComponent', () => {
  let component: SuseLoginComponent;
  let fixture: ComponentFixture<SuseLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuseLoginComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuseLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
