import chai from 'chai';
import chaiAsPromised from 'chai-as-promised'
import { stub } from 'sinon';

import { Defer } from '../dist/index.js'

chai.use(chaiAsPromised);
const { expect } = chai;

const getTimeIn = (secs) => new Promise(r => { setTimeout(() => r(new Date), secs * 10); });

describe('defer()', () => {
  it('Works with keywords as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer('timeIn0'));
    getTimeIn(1).then(defer('timeIn1'));
    getTimeIn(2).then(defer('timeIn2'));
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values.timeIn0).to.be.an.instanceOf(Date);
    expect(values.timeIn1).to.be.an.instanceOf(Date);
    expect(values.timeIn2).to.be.an.instanceOf(Date);
  });

  it('Works without keywords as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer());
    getTimeIn(1).then(defer());
    getTimeIn(2).then(defer());
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values['0']).to.be.an.instanceOf(Date);
    expect(values['1']).to.be.an.instanceOf(Date);
    expect(values['2']).to.be.an.instanceOf(Date);
  });
  
  it('Works with promises that will eventually reject', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer());
    getTimeIn(1).then(defer());
    Promise.reject(new Error('This error thrown intentionally')).then(defer('timeIn2'))
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values['0']).to.be.an.instanceOf(Date);
    expect(values['1']).to.be.an.instanceOf(Date);
    expect(values['2']).to.be.an.instanceOf(Date);
  });

  it('defer(key) passes through value so you can continue to chain promises', async () => {
    const defer = Defer();
    const cb = stub();
    getTimeIn(0).then(defer()).then(cb);
    await defer.all();
    expect(cb.callCount).to.equal(1);
    expect(cb.args[0][0]).to.be.an.instanceOf(Date);
  });
});

describe('defer.register()', () => {
  it('Works with keywords as expected', async () => {
    const defer = Defer();
    defer.register(getTimeIn(0), 'timeIn0');
    defer.register(getTimeIn(1), 'timeIn1');
    defer.register(getTimeIn(2), 'timeIn2');
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values.timeIn0).to.be.an.instanceOf(Date);
    expect(values.timeIn1).to.be.an.instanceOf(Date);
    expect(values.timeIn2).to.be.an.instanceOf(Date);
  });

  it('Works without keywords as expected', async () => {
    const defer = Defer();
    defer.register(getTimeIn(0));
    defer.register(getTimeIn(1));
    defer.register(getTimeIn(2));
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values['0']).to.be.an.instanceOf(Date);
    expect(values['1']).to.be.an.instanceOf(Date);
    expect(values['2']).to.be.an.instanceOf(Date);
  });

  it('Rejection is handled as expected', async () => {
    const defer = Defer();
    defer.register(getTimeIn(0),'timeIn0');
    defer.register(getTimeIn(1),'timeIn1');
    const error = new Error('This error thrown intentionally');
    defer.register(Promise.reject(error), 'timeIn2');
    await expect(defer.all()).to.be.rejectedWith(error);
  });
});

describe('defer.all()', () => {
  it('Works with keywords as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer('timeIn0'));
    getTimeIn(1).then(defer('timeIn1'));
    getTimeIn(2).then(defer('timeIn2'));
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values.timeIn0).to.be.an.instanceOf(Date);
    expect(values.timeIn1).to.be.an.instanceOf(Date);
    expect(values.timeIn2).to.be.an.instanceOf(Date);
  });

  it('Works without keywords as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer());
    getTimeIn(1).then(defer());
    getTimeIn(2).then(defer());
    const values = await defer.all();
    expect(values).to.be.an('object');
    expect(values['0']).to.be.an.instanceOf(Date);
    expect(values['1']).to.be.an.instanceOf(Date);
    expect(values['2']).to.be.an.instanceOf(Date);
  });

  it('Rejection is handled as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer('timeIn0'));
    getTimeIn(1).then(defer('timeIn1'));
    const error = new Error('This error thrown intentionally');
    Promise.reject(error).then(defer('timeIn2'));
    await expect(defer.all()).to.be.rejectedWith('hello');
  });
});

describe('defer.allSettled()', () => {
  it('Works with keywords as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer('timeIn0'));
    getTimeIn(1).then(defer('timeIn1'));
    Promise.reject(new Error('This error thrown intentionally')).then(defer('timeIn2'));
    const values = await defer.allSettled();
    expect(values).to.be.an('object');
    expect(values.timeIn0).to.be.an('object');
    expect(values.timeIn0.status).to.equal('fulfilled');
    expect(values.timeIn0.value).to.be.an.instanceOf(Date);
    expect(values.timeIn1).to.be.an('object');
    expect(values.timeIn1.status).to.equal('fulfilled');
    expect(values.timeIn1.value).to.be.an.instanceOf(Date);
    expect(values.timeIn2).to.be.an('object');
    expect(values.timeIn2.status).to.equal('rejected');
    expect(values.timeIn2.reason).to.be.an.instanceOf(Error);
  });

  it('Works without keywords as expected', async () => {
    const defer = Defer();
    getTimeIn(0).then(defer());
    getTimeIn(1).then(defer());
    Promise.reject(new Error('This error thrown intentionally')).then(defer());
    const values = await defer.allSettled();
    expect(values).to.be.an('object');
    expect(values['0']).to.be.an('object');
    expect(values['0'].status).to.equal('fulfilled');
    expect(values['0'].value).to.be.an.instanceOf(Date);
    expect(values['1']).to.be.an('object');
    expect(values['1'].status).to.equal('fulfilled');
    expect(values['1'].value).to.be.an.instanceOf(Date);
    expect(values['2']).to.be.an('object');
    expect(values['2'].status).to.equal('rejected');
    expect(values['2'].reason).to.be.an.instanceOf(Error);
  });
});
