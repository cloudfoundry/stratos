import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PageSubNavSectionComponent } from './page-sub-nav-section.component';

describe('PageSubNavSectionComponent', () => {
  let component: PageSubNavSectionComponent;
  let fixture: ComponentFixture<PageSubNavSectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PageSubNavSectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSubNavSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
