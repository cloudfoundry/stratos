import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StratosTitleComponent } from './stratos-title.component';
import { StratosThemeService } from '../../../../../theme/theme.service';
import { of } from 'rxjs';

describe('StratosTitleComponent', () => {
  let component: StratosTitleComponent;
  let fixture: ComponentFixture<StratosTitleComponent>;

  beforeEach(waitForAsync(() => {
    const mockThemeService = {
      theme$: of({
        branding: {
          companyName: 'Test Company',
          loginTitle: 'Test Title',
          loginSubtitle: 'Test Subtitle',
          logo: '/test-logo.png'
        }
      })
    };

    TestBed.configureTestingModule({
      imports: [ StratosTitleComponent ],
      providers: [
        { provide: StratosThemeService, useValue: mockThemeService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StratosTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
