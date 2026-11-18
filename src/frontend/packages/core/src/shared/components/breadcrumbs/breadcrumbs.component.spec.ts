import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

import { BreadcrumbsComponent } from './breadcrumbs.component';
import { IBreadcrumbLink } from './breadcrumbs.types';

// The component only renders an already-resolved trail; the ?breadcrumbs=
// key resolution lives in page-header and is covered by its spec.
describe('BreadcrumbsComponent', () => {
  let fixture: ComponentFixture<BreadcrumbsComponent>;
  let element: HTMLElement;

  const render = (breadcrumbs: IBreadcrumbLink[] | null) => {
    fixture.componentRef.setInput('breadcrumbs', breadcrumbs);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render each crumb in order', () => {
    render([{ value: 'Page1', routerLink: '/one' }, { value: 'Page2' }]);

    const crumbs = Array.from(element.querySelectorAll('.breadcrumb')).map(e => e.textContent?.trim());
    expect(crumbs).toEqual(['Page1', 'Page2']);
  });

  it('should render a crumb with a router link as a link', () => {
    render([{ value: 'Page1', routerLink: '/one' }]);

    const link = element.querySelector('a.breadcrumb');
    expect(link?.textContent?.trim()).toBe('Page1');
    expect(link?.getAttribute('href')).toBe('/one');
  });

  it('should render a crumb without a router link as plain text', () => {
    render([{ value: 'Page5' }]);

    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('span.breadcrumb')?.textContent?.trim()).toBe('Page5');
  });

  it('should render nothing for an empty or null trail', () => {
    render([]);
    expect(element.querySelector('.breadcrumbs')).toBeNull();

    render(null);
    expect(element.querySelector('.breadcrumbs')).toBeNull();
  });
});
