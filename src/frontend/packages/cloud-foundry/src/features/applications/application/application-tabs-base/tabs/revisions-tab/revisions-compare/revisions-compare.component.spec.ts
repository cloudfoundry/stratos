import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { RevisionsCompareComponent } from './revisions-compare.component';

describe('RevisionsCompareComponent', () => {
  let component: RevisionsCompareComponent;
  let fixture: ComponentFixture<RevisionsCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RevisionsCompareComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => {
                  if (key === 'from') return 'rev-1';
                  if (key === 'to') return 'rev-2';
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RevisionsCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads from and to from query params', () => {
    expect(component.from).toBe('rev-1');
    expect(component.to).toBe('rev-2');
  });

  it('should render both from and to in template', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('rev-1');
    expect(compiled.textContent).toContain('rev-2');
  });
});
