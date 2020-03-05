import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../core/core.module';
import { AppChipsComponent } from './chips.component';

describe('AppChipsComponent', () => {
  let component: AppChipsComponent;
  let fixture: ComponentFixture<AppChipsComponent>;
  let element: HTMLElement;
  const chips = [
    { value: 'value1', custom: 'custom1' },
    { value: 'value2', custom: 'custom2' },
    { value: 'value3', custom: 'custom3' },
    { value: 'value4', custom: 'custom4' },
    { value: 'value5', custom: 'custom5' }
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppChipsComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppChipsComponent);
    component = fixture.componentInstance;
    component.chips = chips;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide items if above limit', () => {
    expect(element.textContent).not.toContain('value4');
    expect(element.textContent).not.toContain('value5');
  });

  it('should show number of hidden items when compacted', () => {
    component.toggleLimit(); // show less
    component.toggleLimit(); // +2
    fixture.detectChanges();

    expect(element.textContent).toContain('+2');
  });

  it('should show "show less" when expanded', () => {
    component.toggleLimit();
    fixture.detectChanges();

    expect(element.textContent).toContain('Show less');
  });

  it('should display custom object property', () => {
    component.displayProperty = 'custom';
    fixture.detectChanges();

    expect(element.textContent).toContain('custom1');
    expect(element.textContent).not.toContain('value1');
  });
});
