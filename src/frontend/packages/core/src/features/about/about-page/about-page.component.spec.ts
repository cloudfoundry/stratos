import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { AboutPageComponent } from './about-page.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('AboutPageComponent', () => {
  let component: AboutPageComponent;
  let fixture: ComponentFixture<AboutPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AboutPageComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.customizations.hideAboutAdditionalContent = false;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display additional content by default', () => {
    const additionalContent: DebugElement = fixture.debugElement.query(By.css('.about-page__additional-content'));
    expect(additionalContent).toBeTruthy();
    expect(additionalContent.nativeElement.hidden).toBe(false);
  });

  it('should not display additional content', () => {
    component.customizations.hideAboutAdditionalContent = true;
    fixture.detectChanges();

    const additionalContent: DebugElement = fixture.debugElement.query(By.css('.about-page__additional-content'));
    expect(additionalContent).toBeNull()
  });
});
