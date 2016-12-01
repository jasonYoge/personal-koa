;(function (name, definition) {
    var hasDefine = typeof define === 'function';
    var hasModule = typeof module !== 'undefined' && module.exports;

    if (hasDefine) {
        define(definition);
    } else if (hasModule) {
        //  这里写的这么古怪就只是想在es6的模块引入时更加舒服一些
        var co = definition();
        module.exports = co['default'] = co.co = co;
    } else {
        this[name] = definition;
    }
})('co', function () {
    var slice = Array.prototype.slice;
    //将传入的generator函数包装成一个返回promise的方法
    //这是一个独立的方法，就是将传入的函数包装成了co执行前的形式
    co.wrap = function (fn) {
        //存了一个指针指向原generator函数
        createPromise.__generatorFunction__ = fn;
        return createPromise;
        function createPromise () {
            //返回的方法调用就会直接执行co。
            return co.call(this, fn.apply(this, arguments));
        }
    }

    function co (gen) {
        var ctx = this;
        var args = slice.call(arguments, 1);
        //执行generator或者generator函数然后返回一个promise
        return new Promise(function (resolve, reject) {
            if (typeof gen === 'function') gen = gen.apply(ctx, args);
            if (!gen || typeof gen.next !== 'function' ) return resolve(gen);
            onFulfilled();
            function onFulfilled(res) {
                var ret;
                try {
                    ret = gen.next(res);
                } catch (e) {
                    return reject(e);
                }
            }

            function onRejected(err) {
                var ret;
                try {
                    ret = gen.throw(err);
                } catch (e) {
                    return reject(e);
                }
                next(ret);
            }

            function next(ret) {
                if (ret.done) return resolve(ret.value);
                var value = toPromise.call(ctx, ret.value);

                if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
                return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
                        + 'but the following object was passed: "' + String(ret.value) + '"'))
            }
        });
    }

    function toPromise (obj) {
        if (!obj) return obj;
        if (isPromise(obj)) return obj;
        if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
        if ('function' == typeof obj) return thunkToPromise.call(this, obj);
        if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
        if (isObject(obj)) return objectToPromise.call(this, obj);

        return obj;
    }

    function thunkToPromise (fn) {
        var ctx = this;
        return new Promise(function (resolve, reject) {
            fn.call(ctx, function (err, res) {
                if (err) return reject(err);
                if (arguments.length > 2) res = slice.call(arguments, 1);
                resolve(res);
            });
        });
    }

    function arrayToPromise(obj) {
        return Promise.all(obj.map(toPromise, this));
    }

    function objectToPromise(obj) {
        var results = new obj.constructor();
        var keys = Object.keys(obj);
        var promises = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var promise = toPromise.call(this, obj[key]);
            if (promise && isPromise(promise)) defer(promise, key);
            else results[key] = obj[key];
        }
        return Promise.all(promises).then(function () {
            return results;
        });
        function defer(promise, key) {
            results[key] = undefined;
            promises.push(promise.then(function (res) {
                results[key] = res;
            }));
        }
    }

    function isPromise(obj) {
        return 'function' === typeof obj.then;
    }

    function isGenerator (obj) {
        return 'function' === typeof obj.next && 'function' == typeof obj.throw;
    }

    function isGeneratorFunction(obj) {
        var constructor = obj.constructor;
        if (!constructor) return false;
        if ('GeneratorFunciton' === constructor.name || 'GeneratorFunction'
                === constructor.displayname)
            return true;
        return isGenerator(constructor.prototype.prototype);
    }

    function isObject(val) {
        return Object === val.constructor;
    }
});
