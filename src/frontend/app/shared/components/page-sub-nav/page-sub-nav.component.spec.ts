import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageSubNavComponent } from './page-sub-nav.component';

describe('PageSubNavComponent', () => {
  let component: PageSubNavComponent;
  let fixture: ComponentFixture<PageSubNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageSubNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSubNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
