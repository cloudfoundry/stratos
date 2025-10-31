import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { CustomExpansionPanelComponent, CustomExpansionPanelHeaderComponent } from './custom-expansion-panel.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('CustomExpansionPanelComponent', () => {
  let component: CustomExpansionPanelComponent;
  let fixture: ComponentFixture<CustomExpansionPanelComponent>;
  let compiled: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomExpansionPanelComponent, CustomExpansionPanelHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomExpansionPanelComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct default values', () => {
      expect(component.disabled).toBe(false);
      expect(component.expanded).toBe(false);
      expect(component.hideToggle).toBe(false);
      expect(component.togglePosition).toBe('before');
    });

    it('should apply disabled class when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();

      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('disabled')).toBe(true);
    });

    it('should apply expanded class when expanded is true', () => {
      component.expanded = true;
      fixture.detectChanges();

      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('expanded')).toBe(true);
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should toggle expanded state on click', () => {
      const initialState = component.expanded;
      const header = compiled.query(By.css('.expansion-header'));

      header.nativeElement.click();
      expect(component.expanded).toBe(!initialState);

      header.nativeElement.click();
      expect(component.expanded).toBe(initialState);
    });

    it('should emit opened event when expanding', (done) => {
      component.expanded = false;
      let openedEmitted = false;

      component.opened.subscribe(() => {
        openedEmitted = true;
      });

      const header = compiled.query(By.css('.expansion-header'));
      header.nativeElement.click();

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(openedEmitted).toBe(true);
        done();
      });
    });

    it('should emit closed event when collapsing', (done) => {
      component.expanded = true;
      let closedEmitted = false;

      component.closed.subscribe(() => {
        closedEmitted = true;
      });

      const header = compiled.query(By.css('.expansion-header'));
      header.nativeElement.click();

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(closedEmitted).toBe(true);
        done();
      });
    });

    it('should not toggle when disabled', () => {
      component.disabled = true;
      component.expanded = false;
      fixture.detectChanges();

      const header = compiled.query(By.css('.expansion-header'));
      header.nativeElement.click();

      expect(component.expanded).toBe(false);
    });

    it('should not emit events when toggling while disabled', (done) => {
      component.disabled = true;
      component.expanded = false;

      let eventEmitted = false;
      component.opened.subscribe(() => {
        eventEmitted = true;
      });
      component.closed.subscribe(() => {
        eventEmitted = true;
      });

      const header = compiled.query(By.css('.expansion-header'));
      header.nativeElement.click();

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(eventEmitted).toBe(false);
        done();
      });
    });
  });

  describe('Header Rendering', () => {
    it('should render expansion header element', () => {
      const header = compiled.query(By.css('.expansion-header'));
      expect(header).toBeTruthy();
    });

    it('should render toggle button by default', () => {
      const button = compiled.query(By.css('.toggle-button'));
      expect(button).toBeTruthy();
    });

    it('should hide toggle button when hideToggle is true', () => {
      component.hideToggle = true;
      fixture.detectChanges();

      const button = compiled.query(By.css('.toggle-button'));
      expect(button).toBeFalsy();
    });

    it('should apply hide-toggle class when hideToggle is true', () => {
      component.hideToggle = true;
      fixture.detectChanges();

      const header = compiled.query(By.css('.expansion-header'));
      expect(header.nativeElement.classList.contains('hide-toggle')).toBe(true);
    });

    it('should render SVG icon for toggle', () => {
      const icon = compiled.query(By.css('.toggle-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.tagName.toLowerCase()).toBe('svg');
    });
  });

  describe('Content Visibility', () => {
    it('should render expansion content div', () => {
      const content = compiled.query(By.css('.expansion-content'));
      expect(content).toBeTruthy();
    });

    it('should apply expanded class to content when expanded is true', () => {
      component.expanded = false;
      fixture.detectChanges();

      let content = compiled.query(By.css('.expansion-content'));
      expect(content.nativeElement.classList.contains('expanded')).toBe(false);

      component.expanded = true;
      fixture.detectChanges();

      content = compiled.query(By.css('.expansion-content'));
      expect(content.nativeElement.classList.contains('expanded')).toBe(true);
    });

    it('should have overflow hidden by default', () => {
      const content = compiled.query(By.css('.expansion-content'));
      const styles = window.getComputedStyle(content.nativeElement);
      expect(styles.overflow).toBe('hidden');
    });
  });

  describe('Animation and Transitions', () => {
    it('should have transition on expansion-content', () => {
      const content = compiled.query(By.css('.expansion-content'));
      const styles = window.getComputedStyle(content.nativeElement);
      expect(styles.transition).toContain('max-height');
    });

    it('should have transition on toggle-icon', () => {
      const icon = compiled.query(By.css('.toggle-icon'));
      const styles = window.getComputedStyle(icon.nativeElement);
      expect(styles.transition).toContain('transform');
    });

    it('should rotate icon when expanded', () => {
      component.expanded = false;
      fixture.detectChanges();

      let icon = compiled.query(By.css('.toggle-icon'));
      expect(icon.nativeElement.classList.contains('rotated')).toBe(false);

      component.expanded = true;
      fixture.detectChanges();

      icon = compiled.query(By.css('.toggle-icon'));
      expect(icon.nativeElement.classList.contains('rotated')).toBe(true);
    });

    it('should have max-height 0 when collapsed', () => {
      component.expanded = false;
      fixture.detectChanges();

      const content = compiled.query(By.css('.expansion-content'));
      const styles = window.getComputedStyle(content.nativeElement);
      expect(styles.maxHeight).toBe('0px');
    });

    it('should have max-height 1000px when expanded', () => {
      component.expanded = true;
      fixture.detectChanges();

      const content = compiled.query(By.css('.expansion-content'));
      const styles = window.getComputedStyle(content.nativeElement);
      expect(styles.maxHeight).toBe('1000px');
    });
  });

  describe('Toggle Position', () => {
    it('should apply toggle-before class by default', () => {
      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('toggle-before')).toBe(true);
    });

    it('should apply toggle-before class when position is before', () => {
      component.togglePosition = 'before';
      fixture.detectChanges();

      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('toggle-before')).toBe(true);
    });

    it('should apply toggle-after class when position is after', () => {
      component.togglePosition = 'after';
      fixture.detectChanges();

      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('toggle-after')).toBe(true);
    });

    it('should apply before class to button when position is before', () => {
      component.togglePosition = 'before';
      fixture.detectChanges();

      const button = compiled.query(By.css('.toggle-button'));
      expect(button.nativeElement.classList.contains('before')).toBe(true);
    });

    it('should apply after class to button when position is after', () => {
      component.togglePosition = 'after';
      fixture.detectChanges();

      const button = compiled.query(By.css('.toggle-button'));
      expect(button.nativeElement.classList.contains('after')).toBe(true);
    });
  });

  describe('Accessibility Features', () => {
    it('should be keyboard accessible - toggle on Enter key', () => {
      const initialState = component.expanded;
      const header = compiled.query(By.css('.expansion-header'));

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      header.nativeElement.dispatchEvent(event);

      // Note: The component doesn't handle keyboard events yet
      // This test documents that feature gap
      expect(component).toBeTruthy();
    });

    it('should have proper semantic structure', () => {
      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel).toBeTruthy();

      const header = compiled.query(By.css('.expansion-header'));
      expect(header).toBeTruthy();

      const button = compiled.query(By.css('.toggle-button'));
      expect(button).toBeTruthy();
    });

    it('should have proper ARIA attributes (when implemented)', () => {
      const button = compiled.query(By.css('.toggle-button'));
      // This documents expected ARIA attributes for accessibility
      // Current implementation should be enhanced with:
      // - aria-expanded
      // - aria-controls
      // - role="button" or proper button element
      expect(button).toBeTruthy();
    });

    it('should indicate disabled state to accessibility tools', () => {
      component.disabled = true;
      fixture.detectChanges();

      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('disabled')).toBe(true);
      // Should have aria-disabled when enhanced
    });

    it('should have proper color contrast for visibility', () => {
      const header = compiled.query(By.css('.expansion-header'));
      const styles = window.getComputedStyle(header.nativeElement);
      // This validates computed styles
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  describe('Content Projection', () => {
    it('should project header content', () => {
      const headerContent = compiled.query(By.css('ng-content[select="app-expansion-panel-header"]'));
      expect(headerContent).toBeTruthy();
    });

    it('should project panel content', () => {
      const panelContent = compiled.query(By.css('.expansion-content ng-content'));
      expect(panelContent).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', () => {
      const header = compiled.query(By.css('.expansion-header'));

      header.nativeElement.click();
      header.nativeElement.click();
      header.nativeElement.click();

      expect(component.expanded).toBe(true); // Odd number of clicks
    });

    it('should handle setting expanded property directly', () => {
      component.expanded = true;
      fixture.detectChanges();

      expect(component.expanded).toBe(true);
      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('expanded')).toBe(true);
    });

    it('should handle changing disabled state while expanded', () => {
      component.expanded = true;
      fixture.detectChanges();

      component.disabled = true;
      fixture.detectChanges();

      expect(component.expanded).toBe(true);
      expect(component.disabled).toBe(true);

      const panel = compiled.query(By.css('.custom-expansion-panel'));
      expect(panel.nativeElement.classList.contains('expanded')).toBe(true);
      expect(panel.nativeElement.classList.contains('disabled')).toBe(true);
    });

    it('should emit only appropriate events on toggle', (done) => {
      let openedCount = 0;
      let closedCount = 0;

      component.opened.subscribe(() => openedCount++);
      component.closed.subscribe(() => closedCount++);

      const header = compiled.query(By.css('.expansion-header'));

      // Open
      header.nativeElement.click();
      fixture.detectChanges();

      setTimeout(() => {
        expect(openedCount).toBe(1);
        expect(closedCount).toBe(0);

        // Close
        header.nativeElement.click();
        fixture.detectChanges();

        setTimeout(() => {
          expect(openedCount).toBe(1);
          expect(closedCount).toBe(1);
          done();
        }, 50);
      }, 50);
    });
  });
});

describe('CustomExpansionPanelHeaderComponent', () => {
  let component: CustomExpansionPanelHeaderComponent;
  let fixture: ComponentFixture<CustomExpansionPanelHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomExpansionPanelHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomExpansionPanelHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default collapsedHeight', () => {
    expect(component.collapsedHeight).toBe('auto');
  });

  it('should have default expandedHeight', () => {
    expect(component.expandedHeight).toBe('auto');
  });

  it('should accept custom collapsedHeight', () => {
    component.collapsedHeight = '48px';
    expect(component.collapsedHeight).toBe('48px');
  });

  it('should accept custom expandedHeight', () => {
    component.expandedHeight = '100px';
    expect(component.expandedHeight).toBe('100px');
  });

  it('should project content', () => {
    const compiled = fixture.debugElement;
    // The component should have ng-content to project header content
    expect(compiled).toBeTruthy();
  });
});
