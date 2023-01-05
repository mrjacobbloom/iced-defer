# iced-defer
A failed attempt at a utility for JavaScript Promises, inspired by [IcedCoffeeScript](https://maxtaco.github.io/coffee-script/)'s "defer" keyword.

The goal was to sidestep the "parallel arrays" required by `Promise.all`:

```typescript
async function initialize() {
  const [
    { data: foo }, // rename response.data => foo using destructuring
    { data: bar },
    { data: baz },
  ] = await Promise.all([
    request('foo.json'),
    request('bar.json'),
    request('baz.json'),
  ]);
  render(foo, bar, baz);
}
```

The approach I was playing with was to use an object that collects promises and returns an object with named properties:

```typescript
import { Defer } from 'iced-defer';
async function initialize() {
  const defer = Defer<{ data: Date }>();
  request('foo.json').then(defer('foo'));
  request('bar.json').then(defer('bar'));
  request('baz.json').then(defer('baz'));
  const { foo, bar, baz } = await defer.all();
  render(foo.data, bar.data, baz.data);
}
```

However, this doesn't work when promises reject, because `.then()` callbacks only run when the promise resolves. Some possible alternatives:

- Add a new method to `Promise.prototype`. Ex. `somePromise.register(defer('someKey'))`
- `defer()` could return a [resolveCallback, rejectCallback] tuple. Ex. `somePromise.then(...defer('someKey'))`
- Only provide `defer.register()`. Ex. `defer.register(somePromise, 'someKey')`. This works but at that point the library is no easier to use than a vanilla array :/
- Also attach to `promise.catch()`. Ex. `somePromise.then(defer('someKey')).catch(defer('someKey'))`. This is clunky though
- **Not viable:** Attach to `promise.finally()` instead. This doesn't work because the result/error aren't passed to .finally callbacks
