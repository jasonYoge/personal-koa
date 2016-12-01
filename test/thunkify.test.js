var thunkify = require('../utils/thunkify');
var assert = require('assert');
var result;

function text_fn (number, callback) {
    return callback(number);
}

describe('thunkify', function () {
    it('should return a thunk function', function () {
        result = thunkify(text_fn);
        assert(typeof result === 'function', 'thunkify return should be a function');
    });
    it('should return a function contains arguments', function () {
        assert.equal(typeof result(1), 'function', 'function should return 1');
    });
})
