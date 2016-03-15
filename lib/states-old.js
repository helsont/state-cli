var colors = require('colors');
var readline = require('readline');
var process = require('process');

module.exports = states;

function states() {
  this.states = {};
  this.expecting = {};
  this.registering = true;
  const types = ['integer', 'string'];

  this.on = function(input) {
    var args = arguments;
    if (args.length == 0) {
      throw new Error('No arguments.');
    }

    // initialize the main module
    if (args.length == 1) {
      if (Array.isArray(args[0]) && args.length != 1) {
        throw new Error('Unexpected argument count');
      }
      else if (!Array.isArray(args[0]) && args.length == 1) {
        throw new Error('Expecting Array as first argument.');
      }
      var list = args[0];
      // Now we know what commands are coming our way.
      for (var idx = 0, len = list.length; idx < len; idx++) {
        this.expecting[list[idx]] = true;
      }
    }
    else if (args.length == 2) {
      var name = args[0]; // simple command

      if (!accepts) {
        accepts = [];
      } else if (!accepts.length) {
        accepts = [accepts];
      }
      debugger;
      var params = checkParameters(accepts);
      this.states[name] = {
        fn: args[1],
        accepts: accepts,
        params: ['-'] // empty command list
      };

      delete this.expecting[name]; // check off the command
    }
    else if (args.length == 3) {
      var name = args[0];
      var accepts = args[1];
      var fn = args[2];

      if (!accepts.length) {
        accepts = [accepts];
      }
      var params = checkParameters(accepts);
      this.states[name] = {
        accepts: accepts,
        fn: fn,
        params: params
      };

      delete this.expecting[name];
    }
  }

  function checkParameters(args) {
    var paramList = [];
    if (!args || args.length == 0) {
      return;
    }

    for (var idx = 0, len = args.length; idx < len; idx++) {
      if (typeof args[idx] == 'object') {
        paramList.push(convertToParamList(args[idx]));
      } else {
        paramList.push('-');
      }
    }
    debugger;
    var copy = paramList.slice(0);

    if (paramList.length > 0) {
      paramList.sort();
      for (var i = 0, len = paramList.length; i < len; i++) {
        if (paramList[i + 1] == paramList[i] && paramList[i] != '-') {
          throw new Error('Found two parameters with the same signature:');//, args[i], args[i + 1]);
        }
      }
    }

    return copy;
  }

  function convertToParamList(arg) {
    var list = [];
    var curr = '';
    for (var k in arg) {
      var type = isLegal(arg[k]);
      list.push(type);
    }
    return list;
  }

  function convertToParamListFromUnknown(arg) {
    var list = [];
    var curr = '';
    for (var k in arg) {
      var type = getUnknownType(arg[k]);
      list.push(type);
    }
    return list;
  }

  function getUnknownType(val) {
    if (!isNaN(val)) return 0;
    if (typeof val === 'string') return 1;
    throw new Error('Unknown type specified for value', val);
  }

  function convertTo(type, val) {
    if (type == 0) return parseInt(val);
    if (type == 1) return '' + val;
    throw new Error('Illegal type specified: type', type, 'val:', val);
  }

  function isLegal(type) {
    var t = type.toLowerCase();
    var idx = types.indexOf(t);
    if (idx < 0) {
      throw new Error('Illegal type specified', type);
    }
    return idx;
  }

  this.input = function() {
    var args = arguments;
    var explode = args[0].trim().split(' ');
    var cmd = explode[0];
    if (cmd == '') {
      return;
    }
    explode.shift();
    var args = explode;
    var state = this.states[cmd];
    if (!state) {
      debugger;
      // State does not exist.
      console.log(eval(arguments[0]));
      return;
      // throw new Error('No match found for command \'' + cmd +'\'.');
    }
    if (state.accepts && args.indexOf('-h') >= 0) {
      console.log(getPossibleCommands(cmd, state.accepts));
      return;
    }
    if (state.accepts && args.length > 0) {
      var list = convertToParamListFromUnknown(args);
      var params = state.params;
      for (var idx = 0, len = params.length; idx < len; idx++) {
        if (JSON.stringify(list) == JSON.stringify(params[idx])) {
          var specificParam = state.accepts[idx]; // these are the defined expected values
          var inject = {};
          var x = 0;

          // Type conversion of args
          for (var p in specificParam) {
            inject[p] = convertTo(list[x], args[x++]);
          }

          // execute the function
          var finalArgs = [].concat(inject);
          this.states[cmd].fn.apply(null, finalArgs);
          return;
        }
      }
      throw new Error('Illegal parameters specified for command ' + cmd + '.\nPossible ' +
        'commands include: \n' + getPossibleCommands(cmd, state.accepts));
    } else if (args.length == 0) {
      if (state.accepts.length == 0 || state.params.indexOf(['-']) > 0) {
        // singular command
        this.states[cmd].fn.apply(null, []);
      } else {
        throw new Error('Illegal parameters specified for command ' + cmd + '.\nPossible ' +
          'commands include: \n' + getPossibleCommands(cmd, state.accepts));
      }
    }
  }

  this.done = function() {
    if (!this.registering) {
      throw new Error('You already called done');
    }
    this.registering = false;
    if (Object.keys(this.expecting).length > 0) {
      throw new Error('Failed to register the following states:' +
        JSON.stringify(Object.keys(this.expecting)));
    }
  }

  function getPossibleCommands(cmd, accepts) {
    var result = '';
    for (var idx = 0, len = accepts.length; idx < len; idx++) {
      if (typeof accepts[idx] == 'object') {
        var str = cmd + ' ';
        for (var q in accepts[idx]) {
          str += '[' + q + ' : ' + accepts[idx][q]+ '] ';
        }
        result += str;
      } else {
        result += cmd + ' ' + accepts[idx];
      }
      result +='\n';
    }

    return result;
  }
}

var States = new states();

function defineStates() {
  // If it's just an array, this is the main module.
  States.on([
    'see',
    'list'
  ])

  States.on('see', [
    {
      contractId: 'integer'
    },
    {
      messengerId: 'integer'
    },
    'buy',
    'sell'
  ], function(q) {
    console.log(q);
    // load data
    // return data
  });

  States.on('buy', {
    shares: 'integer',
    price: 'integer'
  }, function(q) {
    console.log('buy', q.shares, q.price);
  })

  States.on('sell', {
    shares: 'integer',
    price: 'integer'
  }, function(q) {
    debugger;
    console.log('sell', q.shares, q.price);
  })

  States.on('help', function(q) {
    console.log('Commands: ' + 'see, list, sell, buy.');
  });

  // auto parameter inference
  States.on('list', function(q) {

    // display the market shares
    console.log('we\'ve arrived at the list');
  });

  States.done();
}

defineStates();

States.input('list');
States.input('buy 32 45');
try {
  States.input('sell');
} catch(e) {
  console.log(e);
}
