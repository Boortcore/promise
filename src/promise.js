const {
  allPromisesRejectedMessage,
  arrayRequeredMessage,
  Status,
} = require('./constants');

function isThenable(value) {
  return value instanceof Promise;
}

function isArray(x) {
  return x && x.constructor === Array;
}

function AggregateError(message) {
  this.name = 'AggregateError';
  this.message = message || '';
}
AggregateError.prototype = Object.create(Error.prototype);
AggregateError.prototype.constructor = AggregateError;

var invokeAsync = globalThis.setImmediate || setTimeout;

function Promise(callback) {
  this.state = Status.PENDING;
  this._resolve = this._resolve.bind(this);
  this._reject = this._reject.bind(this);
  this._handled = false;
  this.handlers = [];
  try {
    callback(this._resolve, this._reject);
  } catch (e) {
    this._reject(e);
  }
}
var P = Promise;
var proto = P.prototype;

proto._addHandlers = function (handlers) {
  this.handlers.push(handlers);
};

proto._executeHandlers = function () {
  const self = this;
  if (self.state === Status.PENDING) {
    return;
  }

  if (self.state === Status.REJECTED && !self._handled) {
    invokeAsync(function () {
      if (!self._handled) {
        throw self.value;
      }
    });
  }

  var handlers = self.handlers;
  self.handlers = [];

  invokeAsync(function () {
    handlers.forEach(function (handler) {
      if (self.state === Status.FULFILLED) {
        return handler.onSuccessHandler(self.value);
      }
      return handler.onFailHandler(self.value);
    });
  });
};

proto._updateResult = function (state, value) {
  const self = this;
  if (self.state !== Status.PENDING) {
    return;
  }

  if (isThenable(value)) {
    value.then(self._resolve, self._reject);
    return;
  }

  self.state = state;
  self.value = value;

  self._executeHandlers();
};

proto._resolve = function (value) {
  this._updateResult(Status.FULFILLED, value);
};

proto._reject = function (value) {
  this._updateResult(Status.REJECTED, value);
};

proto.then = function (onSuccess, onFail) {
  onSuccess =
    typeof onSuccess === 'function'
      ? onSuccess
      : function (v) {
          return v;
        };
  onFail =
    typeof onFail === 'function'
      ? onFail
      : function (e) {
          throw e;
        };
  var self = this;
  self._handled = true;

  return new P(function (resolve, reject) {
    self._addHandlers({
      onSuccessHandler: function(value) {
        try {
          resolve(onSuccess(value));
        } catch (e) {
          reject(e);
        }
      },
      onFailHandler: function(value) {
        try {
          resolve(onFail(value));
        } catch (e) {
          reject(e);
        }
      },
    });
    self._executeHandlers();
  });
};

proto.catch = function (onFail) {
  return this.then(0, onFail);
};

proto.finally = function (callback) {
  var call = function (result, failed) {
    return P.resolve(callback()).then(function () {
      return failed ? P.reject(result) : result;
    });
  };
  return this.then(
    function (value) {
      return call(value);
    },
    function (reason) {
      return call(reason, true);
    }
  );
};

P.resolve = function (value) {
  return isThenable(value)
    ? value
    : new P(function (resolve) {
        resolve(value);
      });
};

P.reject = function (value) {
  return new P(function (_, reject) {
    reject(value)
  });
};

P.all = function (promises) {
  return new P(function (resolve, reject) {
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequeredMessage));
    }
    if (!promises.length) return resolve([]);
    var promiseCount = 0;
    var results = [];
    promises.forEach(function (promise, index) {
      promise
        .then(function(result) {
          results[index] = result;
          promiseCount++;
          if (promiseCount === promises.length) resolve(results);
        })
        .catch(reject);
    });
  });
};

P.any = function (promises) {
  return new P(function (resolve, reject) {
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequeredMessage));
    }
    if (!promises.length) {
      return reject(new AggregateError(allPromisesRejectedMessage));
    }
    var promiseCount = 0;
    promises.forEach(function (promise) {
      P.resolve(promise)
        .then(function (result) {
          resolve(result)
        })
        .catch(function () {
          promiseCount++;
          if (promiseCount === promises.length) {
            reject(new AggregateError(allPromisesRejectedMessage));
          }
        });
    });
  });
};

P.race = function (promises) {
  return new P(function (resolve, reject){
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequeredMessage));
    }
    promises.forEach(function (promise) {
      P.resolve(promise).then(resolve).catch(reject);
    });
  });
};

P.allSettled = function (promises) {
  if (!isArray(promises)) {
    return P.reject(new TypeError(arrayRequeredMessage));
  }
  return P.all(
    promises.map(function(p) {
      return P.resolve(p)
      .then(function (value) { 
        return { status: Status.FULFILLED, value }
      })
      .catch(function (reason) {
        return { status: Status.REJECTED, reason }
      })
    })
  );
};

P.try = function (value) {
  return new P(function (resolve) {
    resolve(value)
  });
};

P.withResolvers = function () {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

module.exports = Promise;
