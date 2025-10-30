import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { signal } from '@angular/core';

import { StratosTitleComponent } from './stratos-title.component';
import { StratosThemeService } from '../../../../../theme/theme.service';

describe('StratosTitleComponent', () => {
  let component: StratosTitleComponent;
  let fixture: ComponentFixture<StratosTitleComponent>;

  beforeEach(waitForAsync(() => {
    const mockTheme = signal({
      branding: {
        companyName: 'Test Company',
        loginTitle: 'Test Title',
        loginSubtitle: 'Test Subtitle',
        logo: '/test-logo.png'
      }
    } as any);

    const mockThemeService = {
      theme: mockTheme.asReadonly()
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
