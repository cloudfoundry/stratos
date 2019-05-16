import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPageHeaderComponent } from './show-page-header.component';

describe('ShowPageHeaderComponent', () => {
  let component: ShowPageHeaderComponent;
  let fixture: ComponentFixture<ShowPageHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPageHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
