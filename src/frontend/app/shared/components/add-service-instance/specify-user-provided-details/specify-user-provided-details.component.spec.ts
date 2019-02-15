import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecifyUserProvidedDetailsComponent } from './specify-user-provided-details.component';

describe('SpecifyUserProvidedDetailsComponent', () => {
  let component: SpecifyUserProvidedDetailsComponent;
  let fixture: ComponentFixture<SpecifyUserProvidedDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecifyUserProvidedDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
