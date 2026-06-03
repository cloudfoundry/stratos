import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { LoadingPageComponent } from './loading-page.component';

describe('LoadingPageComponent', () => {
  let component: LoadingPageComponent;
  let fixture: ComponentFixture<LoadingPageComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        LoadingPageComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  describe('when loading', () => {
    let loadingSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
      fixture = TestBed.createComponent(LoadingPageComponent);
      component = fixture.componentInstance;
      element = fixture.nativeElement;

      loadingSubject = new BehaviorSubject<boolean>(true);
      component.isLoading = loadingSubject.asObservable();
      component.ngOnInit();

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should show default message', () => {
      expect(element.textContent).toContain(component.text);
    });

    it('should show progress bar until is done', () => {
      const progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should hide progress bar when is done', async () => {
      let progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeTruthy();

      loadingSubject.next(false);

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeFalsy();
    });
  });

  it('should be created', () => {
    fixture = TestBed.createComponent(LoadingPageComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
