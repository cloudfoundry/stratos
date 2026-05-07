import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ListSubNavComponent, ListSubNavAddAction } from './list-sub-nav.component';

describe('ListSubNavComponent', () => {
  let fixture: ComponentFixture<ListSubNavComponent>;
  let component: ListSubNavComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSubNavComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListSubNavComponent);
    component = fixture.componentInstance;
  });

  function html(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders title with the count from the bound signal', () => {
    component.title = 'Total Routes';
    component.count = signal(12).asReadonly();
    fixture.detectChanges();

    const title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Routes');
    expect(title.textContent).toContain('12');
  });

  it('uses plural label form even when count is 0 or 1', () => {
    component.title = 'Total Endpoints';
    const c = signal(0);
    component.count = c.asReadonly();
    fixture.detectChanges();

    let title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Endpoints');
    expect(title.textContent).toContain('0');

    c.set(1);
    fixture.detectChanges();
    title = html().querySelector('[data-test="list-sub-nav-title"]')!;
    expect(title.textContent).toContain('Total Endpoints');
    expect(title.textContent).toContain('1');
  });

  it('renders the add button when addAction is provided', () => {
    component.title = 'Total Routes';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Add Route',
      invoke: () => undefined,
    };
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain('Add Route');
    expect(btn!.disabled).toBe(false);
  });

  it('omits the add button entirely when addAction is undefined', () => {
    component.title = 'Total Events';
    component.count = signal(5).asReadonly();
    fixture.detectChanges();

    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();
  });

  it('hides the add button while the visible signal returns false', () => {
    const visible = signal(false);
    component.title = 'Total Endpoints';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Register Endpoint',
      invoke: () => undefined,
      visible: visible.asReadonly(),
    };
    fixture.detectChanges();

    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeNull();

    visible.set(true);
    fixture.detectChanges();
    expect(html().querySelector('[data-test="list-sub-nav-add"]')).toBeTruthy();
  });

  it('disables the button while the disabled signal returns true', () => {
    const disabled = signal(true);
    component.title = 'Total Routes';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Add Route',
      invoke: () => undefined,
      disabled: disabled.asReadonly(),
    };
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    disabled.set(false);
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
  });

  it('invokes the action when the button is clicked', () => {
    let called = 0;
    component.title = 'Total Routes';
    component.count = signal(0).asReadonly();
    component.addAction = {
      label: 'Add Route',
      invoke: () => { called++; },
    };
    fixture.detectChanges();

    const btn = html().querySelector('[data-test="list-sub-nav-add"]') as HTMLButtonElement;
    btn.click();
    expect(called).toBe(1);
  });
});
