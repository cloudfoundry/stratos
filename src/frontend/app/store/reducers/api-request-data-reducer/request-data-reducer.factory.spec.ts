import { requestDataReducerFactory } from './request-data-reducer.factory';
import { ISuccessRequestAction } from '../../types/request.types';

fdescribe('RequestDataReducerFactory', () => {
  it('should create', () => {
    const reducer = requestDataReducerFactory([], ['a', 'b', 'c', 'd']);
    expect(reducer).toBeDefined();
  });
  it('should create with default state', () => {
    const id1 = '1';
    const id2 = '2';
    const reducer = requestDataReducerFactory([id1, id2], ['a', 'b', 'c', 'd']);
    const state = reducer(undefined, { type: 'UNKNOWN_INIT' });
    expect(state).toEqual({ [id1]: {}, [id2]: {} });
  });
  it('should create with default state', () => {
    const testEntityType = 'test';
    const testEntityTypeUnused = 'test';
    const entitytKey = 'test23456';
    const giud = 'id123';
    const resEntity = {
      id123: {
        guid: 'id123',
        hello: 'hi',
        hola: 'bonjour'
      }
    };
    const action = {
      type: 'success',
      response: {
        entities: {
          [entitytKey]: {
            resEntity
          }
        },
        results: [resEntity.guid]
      },
      apiAction: {
        entitytKey,
        giud
      }: IRequestAction
    } as ISuccessRequestAction;
    const reducer = requestDataReducerFactory([testEntityType, testEntityTypeUnused], ['a', 'b', 'c', 'd']);
    const state = reducer(undefined, { type: 'UNKNOWN_INIT' });
  });
});

