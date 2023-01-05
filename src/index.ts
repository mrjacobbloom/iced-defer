interface Defer<Value, Key extends string | number | symbol> {
  /**
   * A Defer function, which you can pass to a Promise's .then method.
   * @param key Name to use on the resolved object. Can be left out if you don't
   * care about return values.
   * @example somePromise.then(myDefer('somePromise'))
   */
  (key?: Key): (value: Value) => void;

  /**
   * Manually register a promise on the Defer. Generally `defer(key)` is the
   * recommended usage, but but this is there in case you need it.
   * @param promise Promise to register
   * @param key Name to use on the resolved object. Can be left out if you don't
   * care about return values.
   */
  register(promise: Promise<Value>, key?: Key): void;

  /**
   * Resolves to an object that maps the deferred keys to their given values.
   * @example console.log((await myDefer.all()).somePromise)
   */
  all(): Promise<Record<Key, Value>>;

  /**
   * Resolves to an object that maps the deferred keys to the result of
   * `Promise.allSettled`.
   * @example console.log((await myDefer.all()).somePromise)
   */
  allSettled(): Promise<Record<Key, PromiseSettledResult<Value>>>;

  /**
   * Resolves to the value of Promise.race on the deferred promises.
   */
  race(): Promise<Value>;

  /**
   * Resolves to the value of Promise.any on the deferred promises.
   */
  any(): Promise<Value>;
}

/**
 * Generate a Defer function, which you can pass to a Promise's .then method.
 */
export function Defer<Value = any, Key extends string | number | symbol = string | number | symbol>(): Defer<Value, Key> {
  const registered: { promise: Promise<Value>, key: Key }[] = [];
  const register = (promise: Promise<Value>, key?: Key): void => {
    registered.push({ promise, key: key || registered.length as Key });
  };

  const defer = function(key?: Key) {
    let internalResolve: (value: Value) => void;
    // This promise is for internal use only and is never passed to the .then
    const promise = new Promise<Value>((r) => { internalResolve = r });
    register(promise, key)

    return function(value: Value): Value {
      internalResolve(value);
      return value;
    };
  };

  defer.register = register;
  
  const transformWith = function<T>(transformer: (promises: Promise<Value>[]) => Promise<T[]>): () => Promise<Record<Key, T>> {
    return async () => {
      const values = await transformer(registered.map((r) => r.promise));
      const out = {} as Record<Key, T>;
      for (let i = 0; i < registered.length; i++) {
        out[registered[i].key] = values[i];
      }
      return out;
    };
  };

  defer.all = transformWith<Value>(Promise.all.bind(Promise));

  defer.allSettled = transformWith<PromiseSettledResult<Value>>(Promise.allSettled.bind(Promise));

  defer.race = () => Promise.race(registered.map((r) => r.promise));

  // TS is complaining because Promise.any is only supported by ES2021. But
  // everything else will run fine in environments that don't support it, which
  // means users can use it in places where they were already going to use
  // Promise.any anyway.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  defer.any = () => Promise.any(registered.map((r) => r.promise));

  return defer;
}