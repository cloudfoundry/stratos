import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardValueComponent } from './meta-card-value.component';

describe('MetaCardValueComponent', () => {
  let component: MetaCardValueComponent;
  let fixture: ComponentFixture<MetaCardValueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaCardValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
