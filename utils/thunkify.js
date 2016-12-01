;(function (name, definition) {
    var hasDefine = typeof define === 'function',
           hasExports = typeof module !== 'undefined' && module.exports;

    if (hasDefine) {
        define('assert', definition);
        define(['assert'], definition);
    } else if (hasExports) {
        module.exports = definition(require('assert'));
    } else {
        this[name] = definition();
    }
})('thunkify', function (assert) {
    assert = assert || function (text) { console.log(text); };
    return function (fn) {
        assert('function' === typeof fn, 'function required');
        return function () {
            var args = new Array(arguments.length);
            var ctx = this;
            for (var i = 0; i < args.length; ++i) {
                args[i] = arguments[i];
            }
            return function (done) {
                var called;
                args.push(function () {
                    if (called) return;
                    called = true;
                    done.apply(null, arguments);
                });
                try {
                    fn.apply(ctx, args);
                } catch (err) {
                    done(err);
                }
            }
        }
    }
});
