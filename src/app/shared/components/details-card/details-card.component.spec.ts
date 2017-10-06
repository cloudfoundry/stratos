import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsCardComponent } from './details-card.component';

describe('DetailsCardComponent', () => {
  let component: DetailsCardComponent;
  let fixture: ComponentFixture<DetailsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailsCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
