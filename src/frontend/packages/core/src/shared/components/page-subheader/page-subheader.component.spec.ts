import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { PageSubheaderComponent } from './page-subheader.component';

describe('PageSubheaderComponent', () => {
  let component: PageSubheaderComponent;
  let fixture: ComponentFixture<PageSubheaderComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [PageSubheaderComponent],
        imports: [...BaseTestModulesNoShared]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSubheaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
