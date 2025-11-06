import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { FavoritesSidePanelComponent } from './favorites-side-panel.component';

describe('FavoritesSidePanelComponent', () => {
  let component: FavoritesSidePanelComponent;
  let fixture: ComponentFixture<FavoritesSidePanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FavoritesSidePanelComponent
      ],
      
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
