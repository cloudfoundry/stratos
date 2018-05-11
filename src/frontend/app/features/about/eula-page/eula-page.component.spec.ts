import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EulaPageComponent } from './eula-page.component';

describe('EulaPageComponent', () => {
  let component: EulaPageComponent;
  let fixture: ComponentFixture<EulaPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EulaPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EulaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
