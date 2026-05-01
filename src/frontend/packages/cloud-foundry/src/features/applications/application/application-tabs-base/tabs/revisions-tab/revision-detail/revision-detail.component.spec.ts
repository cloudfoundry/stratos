import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { RevisionDetailComponent } from './revision-detail.component';

describe('RevisionDetailComponent', () => {
  let component: RevisionDetailComponent;
  let fixture: ComponentFixture<RevisionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RevisionDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'revisionGuid' ? 'abc-123' : null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RevisionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads revisionGuid from route param', () => {
    expect(component.revisionGuid).toBe('abc-123');
  });

  it('should render revisionGuid in template', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('abc-123');
  });
});
