import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { UpgradePageComponent } from './upgrade-page.component';
import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { MDAppModule } from '../../../core/md.module';

describe('UpgradePageComponent', () => {
  let component: UpgradePageComponent;
  let fixture: ComponentFixture<UpgradePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        MDAppModule,
        UpgradePageComponent,
        IntroScreenComponent,
        StratosTitleComponent,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
