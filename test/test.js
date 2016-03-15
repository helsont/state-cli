/*global describe, it*/

const States = require('../index')
  , chai = require('chai')
  , expect = chai.expect;

const noop = function() { }
  , tojs = JSON.stringify;

describe('states fsm', function() {

  describe('initialization', function() {
    var fsm = new States();

    it('should fail to initialize states a and b', function() {
      var temp = new States();

      temp.on([
        'a',
        'b'
      ]);

      expect(function() {
        temp.done();
      }).to.throw('Failed to register the following states:' + tojs(['a', 'b']));

    });

    it('should fail to initialize state b', function() {
      var temp = new States();

      temp.on([
        'a',
        'b'
      ]);

      // Add one initializer, but not b's
      temp.on('a', {
        param: 'string'
      }, noop);

      expect(function() {
        temp.done();
      }).to.throw('Failed to register the following states:' + tojs(['b']));
    });

    it('should initialize states a and b', function() {
      var temp = new States();

      temp.on([
        'a',
        'b'
      ]);

      temp.on('a', {
        param: 'string'
      }, noop);

      temp.on('b', {
        param: 'integer'
      }, noop);

      temp.done();
    });

    it('should initialize the root properly', function() {
      // initialize the main state
      fsm.on([
        'see'
      ]);

    });

    it('should create a simple command' , function() {
      // A simple one line command -- no args taken
      fsm.on('help', noop);
    });

    it('should create a two arg command', function() {
      // A command with two args
      fsm.on('buy', {
        shares: 'integer',
        price: 'integer'
      }, noop);
    });

    it('should create a complex state', function() {
      // More complex command -- several different args
      // Also, notice the the last 'sell' option.
      // This is a state accessible only when we run 'see'.
      fsm.on('see', [
        {
          contractId: 'integer'
        },
        'buy',
        {
          contractId: 'string', // only strings and integers are supported.
          messengerId: 'integer'
        },
        'sell'
      ], noop);
    });

    it('should bind states to each other', function() {
      // Complete initialization
      fsm.done();
    });

  });

});
