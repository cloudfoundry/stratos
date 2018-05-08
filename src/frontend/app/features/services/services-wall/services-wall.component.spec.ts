import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesWallComponent } from './services-wall.component';

describe('ServicesWallComponent', () => {
  let component: ServicesWallComponent;
  let fixture: ComponentFixture<ServicesWallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServicesWallComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
