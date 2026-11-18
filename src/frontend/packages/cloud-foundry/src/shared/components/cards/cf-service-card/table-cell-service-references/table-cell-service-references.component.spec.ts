import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { TableCellServiceReferencesComponent } from "./table-cell-service-references.component";

describe('TableCellServiceReferencesComponent', () => {
  let component: TableCellServiceReferencesComponent;
  let fixture: ComponentFixture<TableCellServiceReferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellServiceReferencesComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceReferencesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('row', { guid: 'svc-1' });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Each URL had two links, the icon one unnamed (WCAG 2.4.4); the keyboard
  // reaches the named link only.
  it('offers one named tab stop per URL', async () => {
    fixture.componentRef.setInput('row', {
      guid: 'svc-1',
      brokerCatalogMetadata: { documentationUrl: 'https://example.com/docs', supportUrl: 'https://example.com/help' },
    });
    await fixture.whenStable();
    const reachable = Array.from(fixture.nativeElement.querySelectorAll('a:not([tabindex="-1"])') as NodeListOf<HTMLAnchorElement>);
    expect(reachable.map(a => a.textContent?.trim())).toEqual(['Docs', 'Support']);
    const iconLinks = Array.from(fixture.nativeElement.querySelectorAll('a[tabindex="-1"]') as NodeListOf<HTMLAnchorElement>);
    expect(iconLinks.every(a => a.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(iconLinks.length).toBe(2);
  });
});
