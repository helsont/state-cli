const invariant = require('invariant');
const types = ['integer', 'string'];

module.exports = function State(name, fn, parent) {
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

  this.populate = function(args) {
    if (!args || args.length == 0) {
      return;
    }
    var map = {};

    for (var idx = 0, len = args.length; idx < len; idx++) {
      if (typeof args[idx] == 'object') {
        var signature = this.toTypeList(args[idx]);

        if (map[signature]) {
          throw new Error(
            'Found two argument definitions with the same signature:' + args[idx]
          );
        }

        map[this.toTypeList(args[idx])] = 1;

      }
      else if (typeof args[idx] == 'string') {
        addBranch(this.branch, args[idx]);
      }
      else {
        throw new Error('Unexpected state provided: \'' + args[idx] + '\'');
      }
    }
  };

  function addBranch(branches, name) {
    branches[name] = 1;
  }

  this.toTypeList = function(arg) {
    var list = [];
    for (var k in arg) {
      var type = this.isType(arg[k]);
      list.push(type);
    }
    return list;
  };

  this.isType = function(type) {
    var t = type.toLowerCase().trim();
    var idx = types.indexOf(t);
    if (idx < 0) {
      throw new Error('Illegal type specified: ' + type);
    }
    return idx;
  };
};
