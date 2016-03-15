var FSM = require('../index');
var States = new FSM();

States.on([
  'sayHi',
  'doSomething',
  'help'
]);

States.on('doSomething', {
  a: 'integer',
  b: 'integer'
}, function(q, input) {
  console.log(input.a + input.b);
});

States.on('sayHi', [{
  name: 'string?'
}, {
  name: 'string',
  age: 'integer'
}
],
function(q, input) {
  if (input.age) {
    console.log(`${input.name} is ${input.age} years old `);
  } else {
    console.log(`Hi ${input.name || 'Fred'}`);
  }
});

States.on('help', function() {
  console.log('Commands: ' + 'sayHi, doSomething.');
});

States.done();

States.input('help');
States.input('doSomething 3 100');
States.input('sayHi');
States.input('sayHi Obama');
States.input('sayHi Tom 58');

// errors:
try {
  States.input('doSomething thomas');
} catch(e) {
  console.log(e);
}

try {
  States.input('sayHi 4000');
} catch(e) {
  console.log(e);
}
