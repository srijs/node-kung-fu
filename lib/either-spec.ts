import * as chai from 'chai';

import {Either} from './either';

describe('Either', () => {

  function fixtureErrOk(blowup: boolean): Either<Error, string> {
    if (blowup) {
      return Either.left<Error, string>(new Error('err'));
    } else {
      return Either.right<Error, string>('ok');
    }
  }

  it('creates an either with a valid left and an empty right', () => {
    const e = Either.left<string, void>('hello world');
    chai.expect(e.isLeft()).to.be.true;
    chai.expect(e.getLeft()).to.be.equal('hello world');
    chai.expect(e.isRight()).to.be.false;
    chai.expect(() => e.getRight()).to.throw(TypeError);
  });

  it('creates an either with an empty left and a valid right', () => {
    const e = Either.right<void, string>('hello world');
    chai.expect(e.isLeft()).to.be.false;
    chai.expect(() => e.getLeft()).to.throw(TypeError);
    chai.expect(e.isRight()).to.be.true;
    chai.expect(e.getRight()).to.be.equal('hello world');
  });

  it('pattern matches on the left value of an either', () => {
    const e = fixtureErrOk(true);
    e.caseOf({
      left: (lval) => {
        chai.expect(lval).to.be.deep.equal(new Error('err'));
      },
      right: () => {
        throw new Error('should not have reached the right branch');
      }
    });
  });

  it('pattern matches on the right value of an either', () => {
    const e = fixtureErrOk(false);
    e.caseOf({
      left: () => {
        throw new Error('should not have reached the left branch');
      },
      right: (rval) => {
        chai.expect(rval).to.be.equal('ok');
      }
    });
  });

  describe('#mapRight', () => {

    it('maps the value on the right of an either', () => {
      const rightOnlyEither = Either.right<void, string>('ok');
      const e = rightOnlyEither.mapRight((val) => val.length);
      e.caseOf({
        left: () => {
          throw new Error('should not have reached the left branch');
        },
        right: (rval) => {
          chai.expect(rval).to.be.equal('ok'.length);
        }
      });
    });

    it('keeps the value on the left of an either', () => {
      const leftOnlyEither = Either.left<number, string>(3);
      const e = leftOnlyEither.mapRight((val) => val.length);
      e.caseOf({
        left: (lval) => {
          chai.expect(lval).to.be.equal(3);
        },
        right: () => {
          throw new Error('should not have reached the left branch');
        }
      });
    });

  });

  describe('#mapLeft', () => {

    it('maps the value on the left of an either', () => {
      const leftOnlyEither = Either.left<number, never>(3);
      const e = leftOnlyEither.mapLeft((val) => val * 2);
      e.caseOf({
        left: (lval) => {
          chai.expect(lval).to.be.equal(3 * 2);
        },
        right: () => {
          throw new Error('should not have reached the left branch');
        }
      });
    });

    it('keeps the value on the right of an either', () => {
      const rightOnlyEither = Either.right<number, string>('ok');
      const e = rightOnlyEither.mapLeft((val) => val * 2);
      e.caseOf({
        left: () => {
          throw new Error('should not have reached the left branch');
        },
        right: (rval) => {
          chai.expect(rval).to.be.equal('ok');
        }
      });
    });

  });

  describe('#flatMapRight', () => {

    it('maps and flattens the value on the right into another either', () => {
      const rightOnlyEither = Either.right<void, string>('hello');
      const e = rightOnlyEither.flatMapRight((val) => Either.right<void, string>(`${val} world`));
      e.caseOf({
        left: () => {
          throw new Error('should not have reached left branch');
        },
        right: (rval) => {
          chai.expect(rval).to.be.equal('hello world');
        }
      });
    });

    it('keeps the value on the left of an either', () => {
      const leftOnlyEither = Either.left<number, string>(3);
      const e = leftOnlyEither.flatMapRight((val) => Either.right<number, string>(`${val} world`));
      e.caseOf({
        left: (lval) => {
          chai.expect(lval).to.be.equal(3);
        },
        right: () => {
          throw new Error('should not have reached the left branch');
        }
      });
    });

    it('recurses well', () => {
      let e = Either.right<void, number>(0);
      for (let i = 0; i < 10000; i++) {
        e = e.flatMapRight((val) => Either.right<void, number>(val + 1));
      }
      e.caseOf({
        left: () => {
          throw new Error('should not have reached the left branch');
        },
        right: (rval) => {
          chai.expect(rval).to.be.equal(10000);
        }
      });
    });

    it('memoizes', () => {
      const rightOnlyEither = Either.right<void, string>('hello');
      let called = 0;
      const e = rightOnlyEither.flatMapRight((val) => {
        called++;
        return Either.right<void, string>(`${val} world`);
      });
      e.getRight();
      e.getRight();
      chai.expect(called).to.equal(1);
    });

  });

  describe('#flatMapLeft', () => {

    it('maps and flattens the value on the left into another either', () => {
      const leftOnlyEither = Either.left<string, void>('hello');
      const e = leftOnlyEither.flatMapLeft((val) => Either.left<string, void>(`${val} world`));
      e.caseOf({
        left: (lval) => {
          chai.expect(lval).to.be.equal('hello world');
        },
        right: () => {
          throw new Error('should not have reached right branch');
        }
      });
    });

    it('#flatMapLeft keeps the value on the right of an either', () => {
      const rightOnlyEither = Either.right<number, string>('ok');
      const e = rightOnlyEither.flatMapLeft((val) => Either.left<number, string>(val * 2));
      e.caseOf({
        left: () => {
          throw new Error('should not have reached the left branch');
        },
        right: (rval) => {
          chai.expect(rval).to.be.equal('ok');
        }
      });
    });

    it('recurses well', () => {
      let e = Either.left<number, void>(0);
      for (let i = 0; i < 10000; i++) {
        e = e.flatMapLeft((val) => Either.left<number, void>(val + 1));
      }
      e.caseOf({
        left: (lval) => {
          chai.expect(lval).to.be.equal(10000);
        },
        right: () => {
          throw new Error('should not have reached the left branch');
        }
      });
    });

    it('memoizes', () => {
      const leftOnlyEither = Either.left<string, void>('hello');
      let called = 0;
      const e = leftOnlyEither.flatMapLeft((val) => {
        called++;
        return Either.left<string, void>(`${val} world`);
      });
      e.getLeft();
      e.getLeft();
      chai.expect(called).to.equal(1);
    });

  });

  describe('#toOption', () => {

    it('keeps the right side', () => {
      const rightOnlyEither = Either.right<number, string>('ok');
      rightOnlyEither.toOption().caseOf({
        none: () => {
          throw new Error('should not have reached the none branch');
        },
        some: (val) => {
          chai.expect(val).to.be.equal('ok');
        }
      });
    });

    it('discards the left side', () => {
      const leftOnlyEither = Either.left<number, string>(3);
      leftOnlyEither.toOption().caseOf({
        none: () => {
        },
        some: () => {
          throw new Error('should not have reached the none branch');
        }
      });
    });

  });

});
