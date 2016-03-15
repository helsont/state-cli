const invariant = require('invariant');
const types = ['integer', 'string'];

module.exports = function State(name, fn, parent, accepts) {
  invariant(name, 'A State must have a name.');
  invariant(fn, 'A State must have a callback to be executed.');
  // invariant(!parent && name == 'root', 'A State must have a parent (root) state.');

  this.construct = function(name, fn, parent, accepts) {
    this.name = name;
    this.fn = fn;
    this.parent = parent;

    /**
     * The paramters with their signatures in object notation as defined
     * by the user.
     */
    this.accepts = {};

    /**
     * The other states accessible from this state.
     */
    this.branch = {};

    /**
     * The method table that matches in index with the `accepts` object. Only
     * has the typefied methods.
     */
    this.params = [];


    if (accepts) {
      invariant(Array.isArray(accepts), '`accepts` must be an Array.');

      this.accepts = accepts;
      this.params = this.populate(accepts);
    }
  };

  /**
   * Returns an Array with the method signatures of each method.
   * Abstract:
   * [ method, method, method ]
   *
   * If a method has multiple parameters, the result is a an Array in integers.
   * Ex:
   * [ [0, 1, 1], [1, 1]]
   *
   * If no paramter is specified for a command, then the character `-` is placed.
   * Ex:
   * [ [1], '-']
   *
   * @param  {Object} args  User defined method object.
   * @return {Array}        Signature list for methods.
   */
  this.populate = function populate(args) {
    if (!args || args.length == 0) {
      return [];
    }
    var map = {};
    var signatures = [];

    for (var idx = 0, len = args.length; idx < len; idx++) {
      if (typeof args[idx] == 'object') {
        var signature = this.toTypeList(args[idx]);

        // already defined this signature
        if (map[signature]) {
          throw new Error(
            'Found two argument definitions with the same signature:' + args[idx]
          );
        }

        map[signature] = 1;
        signatures.push(signature);
      }
      else if (typeof args[idx] == 'string') {
        // a sub-command
        this.branch[args[idx]] = 1;
        this.parent.branch[args[idx]] = this.name;
      }
      else {
        // perhaps they provided a number as a state. no bueno
        throw new Error('Unexpected state provided: \'' + args[idx] + '\'');
      }
    }

    return signatures;
  };

  /**
   * Converts an object to an array of integers which match the type specified
   * above.
   *
   * @param  {[type]} arg [description]
   * @return {[type]}     [description]
   */
  this.toTypeList = function(arg) {
    var list = [];
    for (var k in arg) {
      var type = this.isType(arg[k]);
      list.push(type);
    }
    return list;
  };

  /**
   * If the String represents a legal type.
   *
   * @param  {String} type  A String type. Possible values: `string`, `integer`
   * @return {Integer}      The index of the type according to the array `types`
   */
  this.isType = function(type) {
    var t = type.toLowerCase().trim();
    var idx = types.indexOf(t);
    if (idx < 0) {
      throw new Error('Illegal type specified: ' + type);
    }
    return idx;
  };

  this.construct(name, fn, parent, accepts);
};
