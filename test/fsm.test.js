/*global describe, it*/

const States = require('../index')
  , chai = require('chai')
  , expect = chai.expect
  , noop = function() { };

describe('states fsm', function() {

  describe('construction', function() {

    it('should expect an array constructor', function() {
      // why you want this, idk. but here it is.
      expect(function() {
        new States(null);
      }).to.throw('Specify an Array as the state initializer.');
    });

    it('should allow empty states', function() {
      // why you want this, idk. but here it is.
      var state = new States([
      ]);
      state.done();
    });

  });

  describe('initiliazation', function() {
    it('should detect a previously unseen state and fail initiliazation', function() {
      var state = new States([
        'a',
        'b'
      ]);
      expect(function() {
        state.on('c', noop);
      }).to.throw('Initiliazing state that was not defined through state Array');
    });

    it('should fail to initialize states with no definition', function() {
      var temp = new States();

      temp.on([
        'a',
        'b'
      ]);

      expect(function() {
        temp.done();
      }).to.throw('No definition provided for the following states:');

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
      }).to.throw('No definition provided for the following states:');
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

    it('should fail to find a state definition', function() {
      var fsm = new States();
      // initialize the main state
      fsm.on([
        'see'
      ]);

      expect(function() {
        fsm.done();
      }).to.throw('No definition provided for the following states');

    });

    it('should create a simple command' , function() {
      var fsm = new States(['help']);
      // A simple one line command -- no args taken
      fsm.on('help', noop);
      fsm.done();
    });

    it('should create a two arg command', function() {
      var fsm = new States();
      fsm.on(['buy']);
      // A command with two args
      fsm.on('buy', {
        shares: 'integer',
        price: 'integer'
      }, noop);
      fsm.done();
    });

    it('should create a complex state', function() {
      var fsm = new States([
        'see',
        'buy'
      ]);
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
  });

  describe('state input', function() {
    it('should complain about bad input types', function() {
      var fsm = new States([
        'see'
      ]);
      // More complex command -- several different args
      // Also, notice the the last 'sell' option.
      // This is a state accessible only when we run 'see'.
      fsm.on('see', [
        {
          contractId: 'integer'
        }
      ], noop);

      fsm.done();
      expect(function() {
        fsm.input('see');
      }).to.throw('Illegal parameters specified for command see.');
    });

    it('should complain when no params are specified', function() {
      var fsm = new States([
        'see'
      ]);

      fsm.on('see', function() {
      });

      fsm.done();
      expect(function() {
        fsm.input('see 24').to.throw('Illegal parameters specified for command see.');
      });
    });
  });

  describe('events', function() {

    it('should trigger a callback on an event', function(done) {

      var fsm = new States([
        'see'
      ]);

      fsm.on('see', function() {
        done();
      });

      fsm.done();
      fsm.input('see');
    });

    it('should trigger a callback on an event', function(done) {
      var q = new States([
        'see'
      ]);

      q.on('see', [
        {
          contractId: 'integer'
        }
      ], function(q, input) {
        expect(input.contractId).to.equal(24);
        done();
        return 0;
      });

      q.done();
      expect(q.input('see 24')).to.equal(0);
    });

    it('shouldn\'t allow illegal state access', function() {
      var fsm = new States([
        'PURCHASE',
        'LIST'
      ]);

      fsm.on('LIST', ['PURCHASE'], function() {
      });

      fsm.on('PURCHASE', {
        itemId: 'integer'
      }, function() {
      });

      fsm.done();
      expect(function() {
        fsm.input('PURCHASE 81');
      }).to.throw('Cannot run PURCHASE');

    });

    it('should allow legal state access', function(done) {
      var fsm = new States([
        'PURCHASE',
        'LIST'
      ]);

      fsm.on('LIST', ['PURCHASE'], function() {
      });

      fsm.on('PURCHASE', {
        itemId: 'integer'
      }, function(q, input) {
        expect(input.itemId).to.equal(81);
        done();
      });

      fsm.done();
      fsm.input('LIST');
      fsm.input('PURCHASE 81');
    });

    it('should keep track of state between calls', function(done) {
      var fsm = new States([
        'use',
        'show'
      ]);

      var dbs = {
        local: {
          id: ['1', '2', '3']
        },
        test: {
          name: ['testing database']
        }
      };

      fsm.on('use', [
        {
          dbName: 'string'
        },
        'show'
      ], function(q, input) {
        q.dbName = input.dbName;
      });

      fsm.on('show', {
        column: 'string'
      }, function(q, input) {
        var result = dbs[q.dbName][input.column];
        expect(result).to.deep.equal(['1', '2', '3']);
        done();
      });

      fsm.done();

      fsm.input('use local');
      fsm.input('show id');
    });
  });
});
