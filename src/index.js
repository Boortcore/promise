const Promise = require('./promise');

var globalNS = (function () {
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (typeof globalNS['Promise'] !== 'function') {
  globalNS['Promise'] = Promise;
} else {
  if (!globalNS.Promise.prototype['finally']) {
    globalNS.Promise.prototype['finally'] = Promise.finally;
  }
  if (!globalNS.Promise.allSettled) {
    globalNS.Promise.allSettled = Promise.allSettled;
  }
  if (!globalNS.Promise.any) {
    globalNS.Promise.any = Promise.any;
  }
}
module.exports = Promise;
