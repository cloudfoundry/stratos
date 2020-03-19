import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaxListMessageComponent } from './max-list-message.component';

describe('MaxListMessageComponent', () => {
  let component: MaxListMessageComponent;
  let fixture: ComponentFixture<MaxListMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaxListMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaxListMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
