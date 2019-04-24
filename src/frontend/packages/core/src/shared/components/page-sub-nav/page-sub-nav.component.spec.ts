import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { PageSubNavComponent } from './page-sub-nav.component';

describe('PageSubNavComponent', () => {
  let component: PageSubNavComponent;
  let fixture: ComponentFixture<PageSubNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [PageSubNavComponent],
      providers: [TabNavService]
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
