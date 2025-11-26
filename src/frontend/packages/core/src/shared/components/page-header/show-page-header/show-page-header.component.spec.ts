import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { TabNavService } from '../../../../tab-nav.service';
import { ShowPageHeaderComponent } from './show-page-header.component';

describe('ShowPageHeaderComponent', () => {
  let component: ShowPageHeaderComponent;
  let fixture: ComponentFixture<ShowPageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ShowPageHeaderComponent,
        CoreModule,
        RouterTestingModule,
      ],
      providers: [
        TabNavService,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
