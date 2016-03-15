/*global describe, it*/

const State = require('../lib/state')
  , chai = require('chai')
  , expect = chai.expect;

const noop = function() { };
const parent = {};

describe('state population', function() {

  describe('type check', function() {
    it('should find legal types', function() {
      var state = new State('a', noop, parent);
      state.isType('Integer');
      state.isType('String');
      state.isType('string');
      state.isType('String ');

      expect(function() {
        state.isType('double');
      }).to.throw('Illegal type specified: double');

      expect(function() {
        state.isType('float');
      }).to.throw('Illegal type specified: float');

    });

    it('should transform parameter types', function() {
      var state = new State('a', noop, parent);
      var res = state.toTypeList({
        a: 'string',
        b: 'integer',
        c: 'string'
      });
      expect(res).to.deep.equal([1, 0, 1]);
    });
  });

  describe('parameter definitions', function() {

    it('should be an empty param list', function() {
      var state = new State('a', noop, parent);

      expect(state.populate([])).to.deep.equal([]);

    });

    it('should find no duplicate parameter definitions', function() {
      var state = new State('a', noop, parent);

      state.populate(
        [{
          a: 'string'
        },
        {
          b: 'integer'
        }]
      );

    });

    it('should find a duplicate parameter definition', function() {
      var state = new State('a', noop, parent);

      expect(function() {
        state.populate(
          [{
            a: 'integer'
          },
          {
            b: 'integer'
          }]
        );
      }).to.throw('Found two argument definitions with the same signature');
    });
  });

  describe('branch logic', function() {
    it('should create state branches', function() {
      var state = new State('a', noop, parent);
      state.populate([
        'b',
        'c'
      ]);

      expect(state.branch.b).to.exist;
      expect(state.branch.c).to.exist;
    });

    it('should create state branches shortcut', function() {
      var state = new State('a', noop, parent, [
        'b',
        'c'
      ]);

      expect(state.branch.b).to.exist;
      expect(state.branch.c).to.exist;
    });
  });

  describe('integration', function() {
    it('should create a one line command state', function() {
      var accepts = [
        'a'
      ];
      var state = new State('a', noop, parent, accepts);

      expect(state.params).to.deep.equal([]);
      expect(state.accepts).to.deep.equal(accepts);
      expect(state.branch.a).to.exist;
    });

    it('should create a full state', function() {
      var accepts = [
        {
          b: 'integer'
        },
        {
          c: 'string'
        },
        'd',
        'e'
      ];
      var state = new State('a', noop, parent, accepts);

      expect(state.params).to.deep.equal([[0], [1]]);
      expect(state.accepts).to.deep.equal(accepts);
      expect(state.branch.d).to.exist;
      expect(state.branch.e).to.exist;
    });
  });
});
