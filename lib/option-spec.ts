import * as chai from 'chai';

import {Option} from './option';

describe('Option', () => {

  function equals<T>(expected: Option<T>, actual: Option<T>): void {
    chai.expect(actual.toArray()).to.deep.equals(expected.toArray());
  }

  it('correctly maps values', () => {
    equals(Option.some([6, 'ok']), Option.some<[number, string]>([3, 'ok']).map(tuple => [tuple[0] * 2, tuple[1]]));
  });

  it('correctly maps empty values', () => {
    equals(Option.empty, Option.empty.map(x => x));
  });

  describe('map2', () => {

    it('calls function when both options have a value', () => {
      equals(Option.some([3, 'b']), Option.some(3).map2(Option.some('b'), (n, s) => [n, s]));
    });

    it('does not call function when left option is empty', () => {
      equals(Option.empty, Option.empty.map2(Option.some('b'), () => {
        throw new Error();
      }));
    });

    it('does not call function when right option is empty', () => {
      equals(Option.empty, Option.some(3).map2(Option.empty, () => {
        throw new Error();
      }));
    });

  });

  describe('flatMap', () => {

    it('calls function when there is a value', () => {
      const op = Option.some(3);
      equals(op, Option.some(4).flatMap(() => op));
    });

    it('does not call function when there is no value', () => {
      equals(Option.empty, Option.empty.flatMap(() => {
        throw new Error();
      }));
    });

    it('works twice in a row', () => {
      const op = Option.some(4).flatMap(n => Option.some(n * 2)).flatMap(n => Option.some(n * 2));
      equals(Option.some(16), op);
    });

    it('recurses well', () => {
      let op = Option.some(0);
      for (let i = 0; i < 10000; i++) {
        op = op.flatMap(n => Option.some(n + 1));
      }
      equals(Option.some(10000), op);
    });

  });

  it('someLazy does not execute if not needed', () => {
    let x = 0;
    equals(Option.empty, Option.empty.flatMap(() => Option.someLazy(() => {
      x++;
      return 3;
    })));
    chai.expect(x).to.equals(0);
  });

  it('optionLazy does not execute if not needed', () => {
    let called = 0;
    equals(Option.empty, Option.empty.flatMap(() => Option.optionLazy(() => {
      called++;
      return 3;
    })));
    chai.expect(called).to.equals(0);
  });

  it('getOr accepts a null value', () => {
    chai.expect(Option.some(3).getOr(null)).to.equal(3);
    chai.expect(Option.empty.getOr(null)).to.be.null;
  });

  describe('getOrLazy', () => {

    it('accepts a null value', () => {
      chai.expect(Option.some(3).getOrLazy(() => null)).to.equal(3);
      chai.expect(Option.empty.getOrLazy(() => null)).to.be.null;
    });

    it('does not execute if not needed', () => {
      let x = 0;
      const result = Option.some(3).getOrLazy(() => {
        x++;
        return 4;
      });
      chai.expect(result).to.equals(3);
      chai.expect(x).to.equals(0);
    });

  });

  describe('isDefined', () => {

    it('returns true for a defined option', () => {
      chai.expect(Option.some(3).isDefined()).to.be.true;
    });

    it('returns false for an empty option', () => {
      chai.expect(Option.empty.isDefined()).to.be.false;
    });

  });

  describe('isEmpty', () => {

    it('returns true for an empty option', () => {
      chai.expect(Option.empty.isEmpty()).to.be.true;
    });

    it('returns false for a defined option', () => {
      chai.expect(Option.some(3).isEmpty()).to.be.false;
    });

  });

  describe('get', () => {

    it('returns value', () => {
      chai.expect(Option.some('abc').get()).to.equal('abc');
    });

    it('throws TypeError if called from an empty option', () => {
      chai.expect(() => Option.empty.get()).to.throw(TypeError);
    });

  });

  describe('toArray', () => {

    it('returns an empty array for an empty option', () => {
      chai.expect(Option.empty.toArray().length).to.equal(0);
    });

    it('returns an 1-value array for a defined option', () => {
      const result = Option.some(3).toArray();
      chai.expect(result.length).to.equal(1);
      chai.expect(result).to.contain(3);
    });

  });

  describe('reduce', () => {

    it('works with both values', () => {
      chai.expect(Option.some(3).reduce((u, t) => u + t, 4)).to.equal(7);
    });

    it('does not call function if the option is empty', () => {
      chai.expect(Option.empty.reduce(() => {
        throw new Error();
      }, 7)).to.equal(7);
    });

    it('works with a null value', () => {
      chai.expect(Option.some(3).reduce((u) => u, null)).to.be.null;
    });

  });

  describe('someLazy', () => {

    it('evaluates once', () => {
      let called = 0;
      const op = Option.someLazy(() => {
        called++;
        return 1;
      });
      chai.expect(called).to.equal(0);
      const arr1 = op.toArray();
      const arr2 = op.toArray();
      chai.expect(arr1).to.contain(1);
      chai.expect(arr2).to.contain(1);
      chai.expect(called).to.equal(1);
    });

  });

  describe('optionLazy', () => {

    it('evaluates once and returns truthy value', () => {
      let called = 0;
      const op = Option.optionLazy(() => {
        called++;
        return 1;
      });
      chai.expect(called).to.equal(0);
      const arr1 = op.toArray();
      const arr2 = op.toArray();
      chai.expect(arr1).to.contain(1);
      chai.expect(arr2).to.contain(1);
      chai.expect(called).to.equal(1);
    });

    it('evaluates once and returns empty for falsy value', () => {
      let called = 0;
      const op = Option.optionLazy(() => {
        called++;
        return null;
      });
      chai.expect(called).to.equal(0);
      const arr1 = op.toArray();
      const arr2 = op.toArray();
      chai.expect(arr1.length).to.equal(0);
      chai.expect(arr2.length).to.equal(0);
      chai.expect(called).to.equal(1);
    });

  });

  describe('toArray', () => {

    it('returns an array of one value when the option has a value', () => {
      chai.expect(Option.some(3).toArray()).to.deep.equals([3]);
    });

    it('returns an empty array when the option is empty', () => {
      chai.expect(Option.empty.toArray().length).to.equal(0);
    });

  });

  describe('option', () => {

    it('returns empty option if null value', () => {
      chai.expect(Option.option(null).isEmpty()).to.be.true;
    });

    it('returns empty option if undefined value', () => {
      chai.expect(Option.option(undefined).isEmpty()).to.be.true;
    });

  });

  describe('some', () => {

    it('returns filled option if null value', () => {
      chai.expect(Option.some(null).isDefined()).to.be.true;
    });

    it('returns filled option if undefined value', () => {
      chai.expect(Option.some(undefined).isDefined()).to.be.true;
    });

  });

  describe('truthy', () => {

    it('returns empty option if null value', () => {
      chai.expect(Option.some(null).truthy().isEmpty()).to.be.true;
    });

    it('returns filled option if undefined value', () => {
      chai.expect(Option.some(undefined).truthy().isEmpty()).to.be.true;
    });

  });

  describe('keep', () => {

    it('does not evaluate if false predicate', () => {
      let called = 0;
      chai.expect(Option.someLazy(() => {
        called++;
        return 3;
      }).keep(false).isEmpty()).to.be.true;
      chai.expect(called).to.equal(0);
    });

    it('does evaluate if true predicate', () => {
      let called = 0;
      chai.expect(Option.someLazy(() => {
        called++;
        return 3;
      }).keep(true).isDefined()).to.be.true;
      chai.expect(called).to.equal(1);
    });

  });

  describe('orElse', () => {

    it('keeps option if already has a value', () => {
      chai.expect(Option.some(3).orElse(Option.some(4)).get()).to.equal(3);
    });

    it('uses other option if it did not have a value', () => {
      chai.expect(Option.none<number>().orElse(Option.some(4)).get()).to.equal(4);
    });

  });

  describe('orElseLazy', () => {

    it('keeps option if already has a value and does not call else path', () => {
      let called = false;
      const op = Option.some(3).orElseLazy(() => {
        called = true;
        return Option.some(4);
      });
      chai.expect(op.get()).to.equal(3);
      chai.expect(called).to.be.false;
    });

    it('uses other option if it did not have a value', () => {
      chai.expect(Option.none<number>().orElseLazy(() => Option.some(4)).get()).to.equal(4);
    });

  });

  describe('forEach', () => {

    it('calls side effect if there is a value', () => {
      let called = false;
      Option.some(null).forEach(() => {
        called = true;
      });
      chai.expect(called).to.be.true;
    });

    it('does not call side effect if there is no value', () => {
      let called = false;
      Option.empty.forEach(() => {
        called = true;
      });
      chai.expect(called).to.be.false;
    });

  });

  describe('toEither', () => {

    it('maps values to rights', () => {
      const either = Option.some(3).toEither(4);
      chai.expect(either.isRight()).to.be.true;
      chai.expect(either.getRight()).to.equal(3);
    });

    it('maps empty to defined value', () => {
      const either = Option.empty.toEither(4);
      chai.expect(either.isLeft()).to.be.true;
      chai.expect(either.getLeft()).to.equal(4);
    });

  });

  describe('cata', () => {

    it('maps for defined value', () => {
      const result = Option.some(3).cata(v => v + 10, 0);
      chai.expect(result).to.equal(13);
    });

    it('uses default for empty value', () => {
      const result = Option.none<number>().cata(v => v + 10, 0);
      chai.expect(result).to.equal(0);
    });

  });

  describe('cataLazy', () => {

    it('maps for defined value and does not call default', () => {
      let called = false;
      const result = Option.some(3).cataLazy(v => v + 10, () => {
        called = true;
        return 0;
      });
      chai.expect(result).to.equal(13);
      chai.expect(called).to.be.false;
    });

    it('uses default for empty value', () => {
      const result = Option.none<number>().cataLazy(v => v + 10, () => 42);
      chai.expect(result).to.equal(42);
    });

  });

  describe('flatten', () => {

    it('reduces two Option to one', () => {
      const op = Option.some(Option.some(33));
      equals(Option.some(33), Option.flatten(op));
    });

    it('works for simple Option', () => {
      const op = Option.some(33);
      equals(Option.some(33), Option.flatten(op));
    });

  });

  describe('cataOption', () => {

    it('recurses well', () => {
      const none = Option.none<number>();
      let op = none;
      for (let i = 0; i < 10000; i++) {
        op = op.cataOption(n => Option.some(n + 1), none);
      }
      equals(none, op);
    });

  });

  describe('iterator', () => {

    it('returns no elements for an empty option', () => {
      chai.expect(Array.from(Option.empty).length).to.equal(0);
    });

    it('returns the value inside the option', () => {
      const arr = Array.from(Option.some(3));
      chai.expect(arr.length).to.equal(1);
      chai.expect(arr).to.contain(3);
    });

  });

  describe('all', () => {

    it('construct an option with an array of elements', () => {
      const arr = [Option.some(1), 2, Option.empty, 4, Option.some(5), Option.empty, 7, Option.empty, 9];
      const op = Option.all(arr);
      chai.expect(op.isDefined()).to.be.true;
      chai.expect(op.get()).to.deep.equal([1, 2, 4, 5, 7, 9]);
    });

    it('returns empty if the array does not have elements', () => {
      chai.expect(Option.all([Option.empty, Option.empty]).isEmpty()).to.be.true;
    });

  });

});
