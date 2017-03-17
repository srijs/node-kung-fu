import * as chai from 'chai';

import {Option} from './option';
import {PartialFunction} from './partial-function';
import {Unit} from './unit';

describe('PartialFunction', () => {

  function equals<T>(expected: Option<T>, actual: Option<T>): void {
    chai.expect(actual.toArray()).to.deep.equals(expected.toArray());
  }

  it('never resolves when using the empty function', () => {
    equals(Option.empty, PartialFunction.empty().call(3));
  });

  it('always resolves when using the identity function', () => {
    equals(Option.some(3), PartialFunction.identity().call(3));
  });

  it('correctly maps values', () => {
    equals(PartialFunction.identity<number>().map(x => x * 2).call(3), Option.some(6));
  });

  describe('And', () => {

    it('resolves if both functions resolve', () => {
      equals(Option.some(3), PartialFunction.identity().and(PartialFunction.identity()).call(3));
    });

    it('resolves if left function resolves', () => {
      equals(Option.some(3), PartialFunction.identity().and(PartialFunction.empty()).call(3));
    });

    it('resolves if right function resolves', () => {
      equals(Option.some(3), PartialFunction.empty().and(PartialFunction.identity()).call(3));
    });

    it('does not resolve if neither function resolves', () => {
      equals(Option.empty, PartialFunction.empty().and(PartialFunction.empty()).call(3));
    });

  });

  describe('Compose', () => {

    it('only resolves if both functions resolve', () => {
      equals(Option.some(3), PartialFunction.identity().compose(PartialFunction.identity()).call(3));
    });

    it('does not resolve if left function does not resolve', () => {
      equals(Option.empty, PartialFunction.empty().compose(PartialFunction.identity()).call(3));
    });

    it('does not resolve if right function does not resolve', () => {
      equals(Option.empty, PartialFunction.identity().compose(PartialFunction.empty()).call(3));
    });

    it('does not resolve if neither function resolves', () => {
      equals(Option.empty, PartialFunction.empty().compose(PartialFunction.empty()).call(3));
    });

  });

  describe('AsInstanceOf', () => {

    it('correctly recognizes classes', () => {
      equals(Option.some(Unit.unit()), PartialFunction.asInstanceOf(Unit).call(Unit.unit()));
    });

    it('correctly recognizes objects of different classes', () => {
      equals(Option.empty, PartialFunction.asInstanceOf(Unit).call('not a test instance'));
    });

    it('correctly recognizes empty objects', () => {
      equals(Option.empty, PartialFunction.asInstanceOf(Unit).call({}));
    });

  });

  describe('Concat', () => {

    it('behaves like and for an array of partial functions', () => {
      const condition1 = new PartialFunction<number, number>(n => Option.some(n).filter(x => x % 2 === 0));
      const condition2 = new PartialFunction<number, number>(n => Option.some(n).filter(x => x % 3 === 0));
      const condition3 = new PartialFunction<number, number>(n => Option.some(n).filter(x => x % 5 === 0));
      const conditions = PartialFunction.concat([condition1, condition2, condition3]);
      equals(Option.some(2), conditions.call(2));
      equals(Option.some(3), conditions.call(3));
      equals(Option.some(5), conditions.call(5));
      equals(Option.some(4), conditions.call(4));
      equals(Option.some(9), conditions.call(9));
      equals(Option.some(10), conditions.call(10));
      equals(Option.some(30), conditions.call(30));
      equals(Option.empty, conditions.call(1));
      equals(Option.empty, conditions.call(7));
      equals(Option.empty, conditions.call(11));
    });

  });

});
