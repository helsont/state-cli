const invariant = require('invariant')
  , State = require('./state');

module.exports = FSM;

function FSM(states) {
  invariant(
    arguments.length == 0 || Array.isArray(states),
    'Specify an Array as the state initializer.'
  );

  this.construct = function() {
    /**
     * All possible States
     * @type {State}
     */
    this.states = {};

    /**
     * Uninitili
     * @type {Object}
     */
    this.expecting = {};

    /**
     * Whether we're in registering mode or not.
     */
    this.registering = true;

    /**
     * Allow JS execution from `input` method.
     */
    this.replMode = true;

    // TODO
    if (Array.isArray(states)) {
      this.on(states);
    }
  };

  this.on = function() {
    invariant(arguments.length > 0, 'No arguments provided.');

    var args = arguments,
      name = '',
      fn = function() {},
      accepts = {};

    // initialize the main module
    if (args.length == 1) {
      invariant(
        Array.isArray(args[0]),
        'Provide one argument of type Array to initialize all states.'
      );

      // Now we know what commands are coming our way.
      var stateList = args[0];
      for (var idx = 0, len = stateList.length; idx < len; idx++) {
        this.expecting[stateList[idx]] = true;
      }
    }
    else {
      name = args[0]; // state name
      invariant(
        typeof name === 'string',
        'First parameter must be a string, the name of the state.'
      );

      if (this.expecting[name] == undefined) {
        throw new Error('Initiliazing state that was not defined through state Array: ' + name);
      }

      if (args.length == 2) {
        fn = args[1];

        invariant(
          typeof fn === 'function',
          'Second parameter must be a function callback.'
        );

        this.states[name] = new State(name, fn, this, []);
        delete this.expecting[name]; // check off the command
      }
      else if (args.length == 3) {
        accepts = args[1];
        fn = args[2];

        if (!accepts.length) {
          accepts = [accepts];
        }

        this.states[name] = new State(name, fn, this, accepts);
        delete this.expecting[name];
      }
    }
  };

  function convertToParamListFromUnknown(arg) {
    var list = [];
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

  this.input = function() {
    invariant(!this.registering, 'Call `done` before recieving input.');
    var args = arguments;
    var explode = args[0].trim().split(' ');
    var cmd = explode[0];
    if (cmd == '') {
      return;
    }
    explode.shift();
    args = explode;
    var state = this.states[cmd];

    if (!state) {
      if (this.replMode) {
        // evaluate as js
        return eval(arguments[0]);
      } else {
        throw new Error('No match found for command \'' + cmd +'\'.');
      }
    }

    if (state.accepts && args.indexOf('-h') >= 0) {
      return getPossibleCommands(cmd, state.accepts);
    }

    if (state.accepts && args.length > 0) {
      var list = convertToParamListFromUnknown(args);
      var params = state.params;
      var paramIdx = -1;

      // you could have an auxilliary map with stringified params
      // speed vs memory

      for (var idx = 0, len = params.length; idx < len; idx++) {
        if (JSON.stringify(list) == JSON.stringify(params[idx])) {
          paramIdx = idx;
        }
      }

      if (paramIdx == -1) {
        throw new Error('Illegal parameters specified for command ' + cmd + '.\nPossible ' +
          'commands include: \n' + getPossibleCommands(cmd, state.accepts));
      }

      var specificParam = state.accepts[paramIdx]; // these are the defined expected values
      var inject = {};
      var x = 0;

      // Type conversion of args
      for (var p in specificParam) {
        inject[p] = convertTo(list[x], args[x++]);
      }

      // execute the function
      var finalArgs = [].concat(inject);
      return this.states[cmd].fn.apply(null, finalArgs);
    } else if (args.length == 0) {
      if (state.accepts.length == 0 || state.params.indexOf(['-']) > 0) {
        // singular command
        return this.states[cmd].fn.apply(null, []);
      } else {
        throw new Error('Illegal parameters specified for command ' + cmd + '.\nPossible ' +
          'commands include: \n' + getPossibleCommands(cmd, state.accepts));
      }
    }
  };

  this.done = function() {
    invariant(this.registering, 'Attempted to call \'done\' twice. You already called done.');
    this.registering = false;

    var listRemainingStates = Object.keys(this.expecting);
    if (listRemainingStates.length != 0) {
      throw new Error('No definition provided for the following states:' +
        JSON.stringify(listRemainingStates));
    }
  };

  function getPossibleCommands(cmd, accepts) {
    var result = '';
    var stateful = [];
    var spaces = '   ';

    for (var i = 0, len = accepts.length; i < len; i++) {
      if (typeof accepts[i] == 'object') {
        var str = spaces + cmd + ' ';
        for (var q in accepts[i]) {
          str += '[' + q + ' : ' + accepts[i][q]+ '] ';
        }
        result += str;
      } else {
        stateful.push(accepts[i]);
      }
      result +='\n';
    }

    if (stateful.length > 0) {
      result += 'From ' + cmd + ' you can go these states:';
      for (var j = 0, jlen = stateful.length; j < jlen; j++) {
        result += '\n' + spaces + stateful[j];
      }
    }

    return result;
  }

  this.construct(states);
}
