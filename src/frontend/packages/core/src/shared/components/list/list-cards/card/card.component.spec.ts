
import { CoreModule } from '../../../../../core/core.module';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { CardComponent, listCards } from './card.component';
import { SharedModule } from '../../../../shared.module';
import { EntityInfo } from '../../../../../../../store/src/types/api.types';

describe('CardComponent', () => {
  let component: CardComponent<EntityInfo>;
  let fixture: ComponentFixture<CardComponent<EntityInfo>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<CardComponent<EntityInfo>>(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
