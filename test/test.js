/*global describe, it*/

var States = require('../index')
  , chai = require('chai')
  , should = chai.should();

const noop = function() { };

describe('states fsm', function() {

  describe('initialization', function() {
    var fsm = new States();

    it('should initialize the root properly', function() {
      // initialize the main state
      fsm.on([
        'see',
        'list'
      ]);
      
    });

    it('should create a simple command' , function() {
      // A simple one line command -- no args taken
      fsm.on('help', noop);
    });

    it('should create a two arg command', function() {
      // A command with two args
      States.on('buy', {
        shares: 'integer',
        price: 'integer'
      }, noop);
    });

    it('should create a complex state', function() {
      // More complex command -- several different args
      // Also, notice the the last 'sell' option.
      // This is a state accessible only when we run 'see'.
      States.on('see', [
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
      States.done();
    });

  });

});
