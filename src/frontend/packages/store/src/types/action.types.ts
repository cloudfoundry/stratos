/**
 * Local stand-ins for the few `@ngrx/store` *type* contracts the entity model
 * still names after the ngrx runtime was removed in the final ngrx-removal
 * closer. They mirror the ngrx shapes 1:1 so the existing action / reducer /
 * handler signatures keep compiling unchanged — none of them carry any runtime
 * ngrx behaviour.
 */

/** Replaces `Action` from `@ngrx/store`. */
export interface Action {
  type: string;
}

/** Replaces `ActionReducer<T, V>` from `@ngrx/store`. */
export type ActionReducer<T, V extends Action = Action> = (state: T | undefined, action: V) => T;

/**
 * Replaces the type-only `Store<State>` from `@ngrx/store`. The ngrx runtime
 * store no longer exists; this type only survives as a carrier in a handful of
 * (now never-invoked) handler / row-builder signatures. No method is ever
 * called on it. The phantom field keeps `State` referenced so it isn't flagged
 * as an unused type parameter.
 */
export type Store<State = unknown> = {
  readonly __state?: State;
};
