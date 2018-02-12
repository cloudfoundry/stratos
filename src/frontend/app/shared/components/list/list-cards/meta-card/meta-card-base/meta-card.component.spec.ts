import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardComponent } from './meta-card.component';

describe('MetaCardComponent', () => {
  let component: MetaCardComponent;
  let fixture: ComponentFixture<MetaCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
