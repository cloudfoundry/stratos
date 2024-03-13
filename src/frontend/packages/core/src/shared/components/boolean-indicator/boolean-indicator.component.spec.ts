import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../core/core.module';
import { BooleanIndicatorComponent, BooleanIndicatorType } from './boolean-indicator.component';

describe('BooleanIndicatorComponent', () => {
  let component: BooleanIndicatorComponent;
  let fixture: ComponentFixture<BooleanIndicatorComponent>;
  let element: HTMLElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BooleanIndicatorComponent],
      imports: [CoreModule, NoopAnimationsModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanIndicatorComponent);
    component = fixture.componentInstance;
    component.type = BooleanIndicatorType.enabledDisabled;
    component.isTrue = true;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show text by default', () => {
    expect(element.textContent).toContain('Enabled');
  });

  it('should hide text if set', () => {
    component.showText = false;
    fixture.detectChanges();
    expect(element.textContent).not.toContain('Enabled');
  });

  it('should show unknown if not boolean value', () => {
    component.isTrue = null;
    fixture.detectChanges();
    expect(element.textContent).toContain('Unknown');
  });
});
