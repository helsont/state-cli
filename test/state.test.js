/*global describe, it*/

const State = require('../lib/state')
  , chai = require('chai')
  , expect = chai.expect;

const noop = function() { }
  , tojs = JSON.stringify;

describe('state population', function() {

  var parent = {};

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

  it('should create state branches', function() {
    var state = new State('a', noop, parent);
    state.populate([
      'b',
      'c'
    ]);

    expect(state.branch.b).to.exist;
    expect(state.branch.c).to.exist;
  });

});
