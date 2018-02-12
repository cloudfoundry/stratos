import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardKeyComponent } from './meta-card-key.component';

describe('MetaCardKeyComponent', () => {
  let component: MetaCardKeyComponent;
  let fixture: ComponentFixture<MetaCardKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaCardKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
