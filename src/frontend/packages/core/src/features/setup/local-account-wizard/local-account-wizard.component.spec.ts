import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalAccountWizardComponent } from './local-account-wizard.component';

describe('LocalAccountWizardComponent', () => {
  let component: LocalAccountWizardComponent;
  let fixture: ComponentFixture<LocalAccountWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocalAccountWizardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalAccountWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
