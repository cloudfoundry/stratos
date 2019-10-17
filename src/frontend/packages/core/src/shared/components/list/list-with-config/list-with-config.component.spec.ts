import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListWithConfigComponent } from './list-with-config.component';

describe('ListWithConfigComponent', () => {
  let component: ListWithConfigComponent;
  let fixture: ComponentFixture<ListWithConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListWithConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListWithConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
