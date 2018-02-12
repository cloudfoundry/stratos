import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardItemComponent } from './meta-card-item.component';

describe('MetaCardItemComponent', () => {
  let component: MetaCardItemComponent;
  let fixture: ComponentFixture<MetaCardItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaCardItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
