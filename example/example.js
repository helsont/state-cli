var FSM = require('../index');
var CLI = require('../lib/cli');

var States = new FSM();
var main = {};
var db = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D'
};

var myDb = {
  1: 'X',
  2: 'Y'
};

main.db = db;
main.myDb = myDb;

States.on([
  'see',
  'list',
  'buy',
  'sell',
  'confirm',
  'create',
  'help'
]);

States.on('see', [
  {
    contractId: 'integer'
  },
  'buy',
  'sell'
], function(q, input) {
  q.contractId = input.contractId;
  console.log('You can purchase ' + input.contractId);
});

States.on('buy', {
  id: 'integer'
}, function(q, input) {
  myDb[input.id].id = db[input.id];
  delete db[input.id];
});

States.on('sell', [
  {
    id: 'integer'
  },
  'confirm'
], function(q, input) {
  q.goto('confirm', input.id);
});

States.on('confirm', function(q, id) {
  console.log('Are you sure you want to purchase this?');
  console.log('Going to assume yes...');
  db[id] = myDb[id];
  delete myDb[id];
});

States.on('help', function() {
  console.log('Commands: ' + 'see, list, sell, create, buy.');
});

States.on('create', {
  id: 'integer',
  value: 'string'
}, function(q, input) {
  console.log(input);
  myDb[input.id] = input.value;
});

// auto parameter inference
States.on('list', [{
  which: 'string?',
  who: 'string?'
}],
function(q, input) {
  var value = input.which || 'myDb';
  var db = main[value];
  if (!db) {
    throw new Error(`Could not find ${value}, try 'myDb' or 'db'`);
  }

  var obj = Object.keys(main[value]);
  for (var idx = 0, len = obj.length; idx < len; idx++) {
    var res = main[value][obj[idx]];
    console.log(obj[idx] + ' : ' + res);
  }
  console.log();
});

States.done();

new CLI(States);
// States.input('list who');
// States.input('sell 10 92');
