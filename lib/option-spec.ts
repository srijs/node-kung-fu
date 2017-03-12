import * as chai from 'chai';

import {Option} from './option';

describe('Option', () => {

  function equals<T>(expected: Option<T>, actual: Option<T>): void {
    chai.expect(actual.toArray()).to.deep.equals(expected.toArray());
  }

  it('correctly maps values', () => {
    equals(Option.some([6, 'ok']), Option.some<[number, string]>([3, 'ok']).map(tuple => [tuple[0] * 2, tuple[1]]));
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
      chai.expect(Option.some(4).flatMap(() => op)).to.equals(op);
    });

    it('does not call function when there is no value', () => {
      equals(Option.empty, Option.empty.flatMap(() => {
        throw new Error();
      }));
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
    let x = 0;
    equals(Option.empty, Option.empty.flatMap(() => Option.optionLazy(() => {
      x++;
      return 3;
    })));
    chai.expect(x).to.equals(0);
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

  it('get throws TypeError if called from an empty option', () => {
    chai.expect(() => Option.empty.get()).to.throw(TypeError);
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

    it('evaluates once', () => {
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

  });

});
