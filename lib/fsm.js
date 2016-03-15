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
     * States that have yet to be formally registered.
     * @type {String}
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

    /**
     * Root State
     * {State}
     */
    this.root = new State('root', function(){}, null);

    /**
     * State Tracking
     */
    this.state = this.root;

    var self = this;

    this.q = new function() {

      this.goto = function(state, options) {
        debugger;
        return self.states[state].fn.apply(null, [self.q, options]);
      };

    };

    // TODO
    if (Array.isArray(states)) {
      this.on(states);
    }
  };

  this.on = function() {
    invariant(arguments.length > 0, `No arguments provided.`);
    invariant(arguments.length < 4, `Invalid number of arguments provided.`);

    var args = arguments,
      name = '',
      fn = function() {},
      accepts = {};

    // initialize the main module
    if (args.length == 1) {
      invariant(
        Array.isArray(args[0]),
        `Provide one argument of type Array to initialize all states.`
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
        throw new Error(`Initiliazing state that was not defined through state Array: ${name}`);
      }

      if (args.length == 2) {
        fn = args[1];

        invariant(
          typeof fn === 'function',
          'Second parameter must be a function callback.'
        );

        this.states[name] = new State(name, fn, this.root, []);
        delete this.expecting[name]; // check off the command
      }
      else if (args.length == 3) {
        accepts = args[1];
        fn = args[2];

        if (!accepts.length) {
          accepts = [accepts];
        }

        this.states[name] = new State(name, fn, this.root, accepts);
        delete this.expecting[name];
      }
    }
  };

  this.input = function() {
    invariant(!this.registering, `Call 'done' before recieving input.`);
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
      }
      else {
        throw new Error(`No match found for command '${cmd}'`);
      }
    }

    // if we're accessing a substate illegally
    if (this.root.branch[cmd] && this.root.branch[cmd] != this.state.name) {
      throw new Error(`Cannot run ${cmd} now, expecting ${this.root.branch[cmd]} beforehand.`);
    }

    if (state.accepts && args.indexOf('-h') >= 0) {
      return getPossibleCommands(cmd, state.accepts);
    }

    if (state.accepts) {
      var list = convertToParamListFromUnknown(args);
      var params = state.params;
      var paramIdx = -1;
      // you could have an auxilliary map with stringified params
      // speed vs memory

      for (var idx = 0, len = params.length; idx < len; idx++) {
        if (signatureMatch(list, params[idx])) {
          paramIdx = idx;
        }
      }

      if (paramIdx == -1 && state.params.length > 0) {
        throw new Error(`Illegal parameters specified for command '${cmd}'.\n
        Possible commands include: ${getPossibleCommands(cmd, state.accepts)}`);
      }

      var specificParam = state.accepts[paramIdx]; // these are the defined expected values
      var inject = {};
      var x = 0;

      // Type conversion of args
      for (var p in specificParam) {
        inject[p] = convertTo(list[x], args[x++]);
      }

      // execute the function
      var finalArgs = [this.q].concat(inject);

      // save current state
      this.state = this.states[cmd];

      return this.states[cmd].fn.apply(null, finalArgs);
    } else if (args.length == 0) {
      // no params specified + no params are accepted
      if (state.params.length == 0) {
        // singular command
        this.state = this.states[cmd];

        return this.states[cmd].fn.apply(null, [this.q]);
      } else {
        throw new Error(`Illegal parameters specified for command ${cmd}.\n
          Possible commands include: ${getPossibleCommands(cmd, state.accepts)}`);
      }
    }
  };

  function signatureMatch(input, signature) {
    for (var idx = 0, len = signature.length; idx < len; idx++) {
      var val = input[idx]; // default to empty string
      var sig = signature[idx];

      if (val != sig) {
        if (val == 0 && sig != 1) return false;
        if (val == 1 && sig != 0) return false;
        if (val == 2 && sig != 3) return false;
        if (val == 3 && sig != 2) return false;
      }
    }
    return true;
  }

  this.done = function() {
    invariant(this.registering, `Attempted to call 'done' twice. You already called done.`);
    this.registering = false;

    var listRemainingStates = Object.keys(this.expecting);
    if (listRemainingStates.length != 0) {
      throw new Error(
        `No definition provided for the following states: ${JSON.stringify(listRemainingStates)}`
      );
    }
  };

  function convertToParamListFromUnknown(arg) {
    var list = [];

    if (arg.length == 0) {
      list.push(3); // optional string
    }

    for (var k in arg) {
      var type = getUnknownType(arg[k]);
      list.push(type);
    }
    return list;
  }

  function getUnknownType(val) {
    if (!isNaN(val)) return 0;
    if (typeof val === 'string') return 2;
    throw new Error(`Unknown type specified for value ${val}`);
  }

  function convertTo(type, val) {
    if ((type == 0 || type == 1) && val)  return parseInt(val);
    if (type  == 1 && !val)               return undefined;
    if ((type == 2 || type == 3) && val)  return '' + val;
    if (type  == 3)                       return undefined;

    throw new Error(`Illegal type specified: type ${type}, val: ${val}`);
  }

  function getPossibleCommands(cmd, accepts) {
    var result = '';
    var stateful = [];
    var spaces = '   ';

    for (var i = 0, len = accepts.length; i < len; i++) {
      if (typeof accepts[i] == 'object') {
        var str = spaces + cmd + ' ';
        for (var q in accepts[i]) {
          str += `[ ${q} : ${accepts[i][q]} ]`;
        }
        result += str;
      } else {
        stateful.push(accepts[i]);
      }
      result +='\n';
    }

    if (stateful.length > 0) {
      result += `From ${cmd} you can go these states:`;
      for (var j = 0, jlen = stateful.length; j < jlen; j++) {
        result += `\n ${spaces + stateful[j]}`;
      }
    }

    return result;
  }

  this.construct(states);
}
