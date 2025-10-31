declare module 'intersect' {
  function intersect<T>(...arrays: T[][]): T[];
  export default intersect;
}
