declare module 'rxjs-spy' {
  export interface Spy {
    log(tag?: string, partialName?: string): void;
    pause(tag: string): void;
    resume(tag: string): void;
    show(): void;
    teardown(): void;
    undo(...matching: any[]): void;
    stats(): void;
    deck(): number;
  }

  export function create(options?: {
    [key: string]: any;
  }): Spy;
}

declare module 'rxjs-spy/operators' {
  import { MonoTypeOperatorFunction } from 'rxjs';

  export function tag<T>(name: string): MonoTypeOperatorFunction<T>;
}
