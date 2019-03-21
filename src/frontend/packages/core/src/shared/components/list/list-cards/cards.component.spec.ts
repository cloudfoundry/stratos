import { Type } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityInfo } from '../../../../../../store/src/types/api.types';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../shared.module';
import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { CardCell } from '../list.types';
import { CardsComponent } from './cards.component';

describe('CardsComponent', () => {
  let component: CardsComponent<EntityInfo>;
  let fixture: ComponentFixture<CardsComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<CardsComponent<EntityInfo>>(CardsComponent);
    component = fixture.componentInstance;
    component.component = {} as Type<CardCell<EntityInfo>>;
    component.dataSource = {} as IListDataSource<EntityInfo>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
