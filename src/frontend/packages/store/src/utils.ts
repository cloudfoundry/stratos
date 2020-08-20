// We don't want to brin gin the utils package from nodejs
// We only used this one function

export function isNullOrUndefined(obj: any): boolean {
  return typeof obj === 'undefined' || obj === null;
}
