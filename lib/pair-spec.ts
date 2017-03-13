import * as chai from 'chai';
import {Pair} from './pair';

describe('Pair', () => {

  describe('mapFirst', () => {

    it('maps first value', () => {
      chai.expect(new Pair('a', 1).mapFirst(f => f + '.').first).to.equal('a.');
    });

    it('keeps second value', () => {
      chai.expect(new Pair('a', 1).mapFirst(f => f + '.').second).to.equal(1);
    });

  });

  describe('mapSecond', () => {

    it('keeps first value', () => {
      chai.expect(new Pair('a', 1).mapSecond(s => s + 10).first).to.equal('a');
    });

    it('maps second value', () => {
      chai.expect(new Pair('a', 1).mapSecond(s => s + 10).second).to.equal(11);
    });

  });

  describe('map', () => {

    it('maps first value', () => {
      chai.expect(new Pair('a', 1).map(f => f + '.', s => s + 10).first).to.equal('a.');
    });

    it('maps second value', () => {
      chai.expect(new Pair('a', 1).map(f => f + '.', s => s + 10).second).to.equal(11);
    });

  });

});
