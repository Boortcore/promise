function isThenable(value) {
  return value instanceof Promise;
}

function isArray(x) {
  return x.constructor === Array;
}

function AggregateError(message) {
  this.name = 'AggregateError';
  this.message = message || '';
}
AggregateError.prototype = Error.prototype;

const Status = {
  F: 'fulfilled',
  R: 'rejected',
  P: 'pending',
};

var invokeAsync = globalThis.setImmediate || setTimeout;
var arrayRequereMessage = 'Promise.any accepts an array';
var allPromisesRejectedMessage = 'All promises were rejected';

function Promise(callback) {
  this.state = Status.P;
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

var proto = Promise.prototype;

proto._addHandlers = function (handlers) {
  this.handlers.push(handlers);
};

proto._executeHandlers = function () {
  const self = this;
  if (self.state === Status.P) {
    return;
  }

  if (self.state === Status.R && !self.handlers.length) {
    invokeAsync(function () {
      if (!self._handled) {
        throw self.value;
      }
    });
  }
  self.handlers.forEach((handler) => {
    invokeAsync(function () {
      if (self.state === Status.F) {
        return handler.onSuccessHandler(self.value);
      }
      return handler.onFailHandler(self.value);
    });
  });

  self.handlers = [];
};

proto._updateResult = function (state, value) {
  const self = this;
  if (self.state !== Status.P) {
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
  this._updateResult(Status.F, value);
};

proto._reject = function (value) {
  this._updateResult(Status.R, value);
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

  return new Promise(function (resolve, reject) {
    self._addHandlers({
      onSuccessHandler: (value) => {
        try {
          resolve(onSuccess(value));
        } catch (e) {
          reject(e);
        }
      },
      onFailHandler: (value) => {
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
    return Promise.resolve(callback()).then(function () {
      return failed ? Promise.reject(result) : result;
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

Promise.resolve = function (value) {
  return isThenable(value)
    ? value
    : new Promise(function (resolve) {
        resolve(value);
      });
};

Promise.reject = function (value) {
  return new Promise((_, reject) => reject(value));
};

Promise.all = function (promises) {
  return new this((resolve, reject) => {
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequereMessage));
    }

    var promiseCount = 0;
    var results = [];

    promises.forEach((promise, index) => {
      promise
        .then((result) => {
          results[index] = result;
          promiseCount++;
          if (promiseCount === promises.length) resolve(results);
        })
        .catch(reject);
    });
  });
};

Promise.any = function (promises) {
  return new this((resolve, reject) => {
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequereMessage));
    }
    if (!promises.length) {
      return reject(new AggregateError(allPromisesRejectedMessage));
    }
    var promiseCount = 0;

    promises.forEach((promise) => {
      Promise.resolve(promise)
        .then((result) => resolve(result))
        .catch(() => {
          promiseCount++;
          if (promiseCount === promises.length) {
            reject(new AggregateError(allPromisesRejectedMessage));
          }
        });
    });
  });
};

Promise.race = function (promises) {
  return new this((resolve, reject) => {
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequereMessage));
    }
    promises.forEach((promise) => {
      promise.then(resolve).catch(reject);
    });
  });
};

Promise.allSettled = function (promises) {
  return new this((resolve, reject) => {
    if (!isArray(promises)) {
      return reject(new TypeError(arrayRequereMessage));
    }
    if (!promises.length) {
      resolve([]);
      return;
    }
    var promiseCount = 0;
    var results = [];

    function setResult(index, status, value) {
      results[index] = { status, value };
      promiseCount++;
      if (promiseCount === promises.length) resolve(results);
    }

    promises.forEach((promise, index) => {
      promise
        .then((result) => setResult(index, Status.F, result))
        .catch((e) => setResult(index, Status.R, e));
    });
  });
};

module.exports = Promise;
