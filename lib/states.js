const colors = require('colors')
  , readline = require('readline')
  , process = require('process')
  , invariant = require('invariant')
  ;

module.exports = states;

function State(name, fun, parent) {
  invariant(name, 'A State must have a name.');
  invariant(fn, 'A State must have a callback to be executed.');
  invariant(parent, 'A State must have a parent (root) state.');
  this.name = name;
  this.fn = fn;
  this.parent = parent;

  /**
   * The possible commands from this state.
   */
  this.accepts = {};

  /**
   * The other states accessible from this state.
   */
  this.branch = {};

  /**
   * Sets what possible commands are possible from this state.
   *
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  this.setAccepts = function(obj) {
    invariant(obj, 'The obj cannot be null.');
    var params = checkParameters(args);
    this.accepts = obj;
  }

  this.populateState = function(obj) {
    var paramList = [];
    if (!args || args.length == 0) {
      return;
    }

    for (var idx = 0, len = args.length; idx < len; idx++) {
      if (typeof args[idx] == 'object') {
        paramList.push(convertToParamList(args[idx]));
      } else if (typeof args[idx] == 'string') {
        paramList.push('-');
        addBranch(this.branch, args[idx]);
      } else {
        throw new Error('Unexpected state provided: \'' + args[idx] + '\'');
      }
    }

    var definitions = paramList.slice(0);
    ensureNoDuplicateArgs(definitions);
  }

  function addBranch(branches, name) {
    branches[name] = 1;
  }

  function ensureNoDuplicateArgs(inputDefinitionList) {
    var list = inputDefinitionList;
    if (list.length > 0) {
      list.sort();
      for (var i = 0, len = list.length; i < len; i++) {
        if (list[i + 1] == list[i] && list[i] != '-') {
          throw new Error('Found two parameters with the same signature:', args[i], args[i + 1]);
        }
      }
    }
  }

  function checkParameters(args) {



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
}

function states() {
  this.states = {};
  this.expecting = {};
  this.registering = true;
  this.replMode = true;
  const types = ['integer', 'string'];

  this.on = function(input) {
    var args = arguments;
    invariant(args.length > 0, 'No arguments.');

    // initialize the main module
    if (args.length == 1) {
      invariant(
        Array.isArray(args[0]) && args.length == 1,
        'Providing an Array as the first value should only be done to ' +
        'initiliaze all states. Only provide one argument in this case.'
      );
      invariant(
        Array.isArray(args[0]) && args.length == 1,
        'Expecting Array as first argument.'
      );
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
      var params = {};//checkParameters(accepts);
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
      var params = {};
      // var params = checkParameters(accepts);
      this.states[name] = {
        accepts: accepts,
        fn: fn,
        params: params
      };

      delete this.expecting[name];
    }
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
      if (this.replMode) {
        // evaluate as js
        return console.log(eval(arguments[0]));
      } else {
        throw new Error('No match found for command \'' + cmd +'\'.');
      }
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
    invariant(this.registering, 'Attempted to call \'done\' twice. You already called done.');
    this.registering = false;

    var listRemainingStates = Object.keys(this.expecting);
    if (listRemainingStates.length != 0) {
      throw new Error('Failed to register the following states:' +
        JSON.stringify(listRemainingStates));
    }
    linkStates(this.states);
  }

  function linkStates(states) {
    for (var idx = 0, len = states.length; idx < len; idx++) {
      if (states[idx].accepts) {

      }
    }
  }

  function getPossibleCommands(cmd, accepts) {
    var result = '';
    var stateful = [];
    var spaces = '   ';

    for (var idx = 0, len = accepts.length; idx < len; idx++) {
      if (typeof accepts[idx] == 'object') {
        var str = spaces + cmd + ' ';
        for (var q in accepts[idx]) {
          str += '[' + q + ' : ' + accepts[idx][q]+ '] ';
        }
        result += str;
      } else {
        stateful.push(accepts[idx])
      }
      result +='\n';
    }

    if (stateful.length > 0) {
      result += 'From ' + cmd + ' you can go these states:';
      for (var idx = 0, len = stateful.length; idx < len; idx++) {
        result += '\n' + spaces + stateful[idx];
      }
    }

    return result;
  }
}

var States = new states();

defineStates();

// States.input('list');
// States.input('buy 32 45');
// try {
//   States.input('sell');
// } catch(e) {
//   console.log(e);
// }


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  historySize: 1000
});

console.log(colors.yellow('Type help for more options'));

rl.setPrompt('>> ');
rl.prompt();

rl.on('line', function (cmd) {
  try {
    States.input(cmd);
  } catch(e) {
    console.log((e + '').red);
  }
  rl.prompt();
});