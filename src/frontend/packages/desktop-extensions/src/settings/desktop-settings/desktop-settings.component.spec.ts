import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DesktopSettingsComponent } from './desktop-settings.component';

describe('DesktopSettingsComponent', () => {
  let component: DesktopSettingsComponent;
  let fixture: ComponentFixture<DesktopSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DesktopSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesktopSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
