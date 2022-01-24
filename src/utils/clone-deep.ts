export const cloneDeep = <V>(source: Readonly<V>): V => {
  if (typeof source !== 'object' || source === null) return source;
  if (source instanceof Date) return new Date(source.getTime()) as unknown as V;
  if (source instanceof Array) return source.map(item => cloneDeep(item)) as unknown as V;
  if (source instanceof Object) {
    Object.getOwnPropertyNames(source).reduce((o, key) => {
      o[key] = cloneDeep((source as any)[key]);
      return o;
    }, Object.create(Object.getPrototypeOf(source)));
  }
  return source;
}
