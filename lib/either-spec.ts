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

  it('#mapRight maps the value on the right of an either', () => {
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

  it('#mapRight keeps the value on the left of an either', () => {
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

  it('#mapLeft maps the value on the left of an either', () => {
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

  it('#mapLeft keeps the value on the right of an either', () => {
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

  it('#flatMapRight maps and flattens the value on the right into another either', () => {
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

  it('#flatMapRight keeps the value on the left of an either', () => {
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

  it('#flatMapLeft maps and flattens the value on the left into another either', () => {
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

  it('#toOption keeps the right side', () => {
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

  it('#toOption discards the left side', () => {
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
