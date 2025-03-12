const Promise = require('../dist/polyfill.js');
const {
  allPromisesRejectedMessage,
  arrayRequeredMessage,
  Status,
} = require('../src/constants');

describe('Promise', () => {
  it('should resolve correctly', (done) => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('Success'), 100);
    });

    promise.then((result) => {
      expect(result).toBe('Success');
      done();
    });
  });

  it('should reject correctly', (done) => {
    const promise = new Promise((_, reject) => {
      setTimeout(() => reject('Error'), 100);
    });

    promise.catch((error) => {
      expect(error).toBe('Error');
      done();
    });
  });

  it('should chain then calls', (done) => {
    const promise = new Promise((resolve) => {
      resolve(2);
    });

    promise
      .then((result) => result * 2)
      .then((result) => {
        expect(result).toBe(4);
        done();
      });
  });

  it('should call finally after resolve', (done) => {
    const promise = new Promise((resolve) => {
      resolve('Final');
    });

    let calledFinally = false;

    promise
      .finally(() => {
        calledFinally = true;
      })
      .then((result) => {
        expect(result).toBe('Final');
        expect(calledFinally).toBe(true);
        done();
      });
  });

  it('should call finally after reject', (done) => {
    const promise = new Promise((_, reject) => {
      reject('Final Error');
    });

    let calledFinally = false;

    promise
      .finally(() => {
        calledFinally = true;
      })
      .catch((error) => {
        expect(error).toBe('Final Error');
        expect(calledFinally).toBe(true);
        done();
      });
  });

  describe('Static Methods', () => {
    it('Promise.resolve should resolve with the given value', (done) => {
      Promise.resolve('Resolved Value').then((result) => {
        expect(result).toBe('Resolved Value');
        done();
      });
    });

    it('Promise.reject should reject with the given value', (done) => {
      Promise.reject('Rejected Value').catch((error) => {
        expect(error).toBe('Rejected Value');
        done();
      });
    });

    it('Promise.all should resolve when all promises resolve', (done) => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
      ];

      Promise.all(promises).then((results) => {
        expect(results).toEqual([1, 2, 3]);
        done();
      });
    });

    it('Promise.all should reject if one promise rejects', (done) => {
      const promises = [
        Promise.resolve(1),
        Promise.reject('Error'),
        Promise.resolve(3),
      ];

      Promise.all(promises).catch((error) => {
        expect(error).toBe('Error');
        done();
      });
    });

    it('Promise.all should reject if it does not receive an array', (done) => {
      const promises = null;

      Promise.all(promises).catch((error) => {
        expect(error.message).toBe(arrayRequeredMessage);
        done();
      });
    });

    it('Promise.all should resolve with an empty array', (done) => {
      const promises = [];

      Promise.all(promises).then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('Promise.any should resolve with the first resolved value', (done) => {
      const promises = [
        Promise.reject('Error1'),
        Promise.resolve('First Success'),
        Promise.resolve('Second Success'),
      ];

      Promise.any(promises).then((result) => {
        expect(result).toBe('First Success');
        done();
      });
    });

    it('Promise.any should reject if all promises reject', (done) => {
      const promises = [Promise.reject('Error1'), Promise.reject('Error2')];

      Promise.any(promises).catch((error) => {
        expect(error.message).toBe('All promises were rejected');
        done();
      });
    });

    it('Promise.any should reject if it does not receive an array', (done) => {
      const promises = null;

      Promise.any(promises).catch((error) => {
        expect(error.message).toBe(arrayRequeredMessage);
        done();
      });
    });

    it('Promise.any should reject if it receives an empty array', (done) => {
      const promises = [];

      Promise.any(promises).catch((error) => {
        expect(error.message).toBe(allPromisesRejectedMessage);
        done();
      });
    });

    it('Promise.race should resolve with the first resolved promise', (done) => {
      const promises = [
        new Promise((resolve) => setTimeout(() => resolve('First'), 100)),
        new Promise((resolve) => setTimeout(() => resolve('Second'), 200)),
      ];

      Promise.race(promises).then((result) => {
        expect(result).toBe('First');
        done();
      });
    });

    it('Promise.race should reject with the first rejected promise', (done) => {
      const promises = [
        new Promise((_, reject) => setTimeout(() => reject('Error'), 100)),
        new Promise((resolve) => setTimeout(() => resolve('Second'), 200)),
      ];

      Promise.race(promises).catch((error) => {
        expect(error).toBe('Error');
        done();
      });
    });

    it('Promise.race should reject if it does not receive an array', (done) => {
      const promises = null;

      Promise.race(promises).catch((error) => {
        expect(error.message).toEqual(arrayRequeredMessage);
        done();
      });
    });

    it('Promise.allSettled should return the result as an array of objects with properties status (fulfilled) and value', (done) => {
      const promises = [
        Promise.resolve('First Success'),
        Promise.resolve('Second Success'),
        Promise.resolve('Third Success'),
      ];

      Promise.allSettled(promises).then((result) => {
        expect(result).toEqual([
          { status: Status.FULFILLED, value: 'First Success' },
          { status: Status.FULFILLED, value: 'Second Success' },
          { status: Status.FULFILLED, value: 'Third Success' },
        ]);
        done();
      });
    });

    it('Promise.allSettled should return the result as an array of objects with properties status and value or status and reason', (done) => {
      const promises = [
        Promise.reject('Error1'),
        Promise.resolve('First Success'),
        Promise.resolve('Second Success'),
      ];

      Promise.allSettled(promises).then((result) => {
        expect(result).toEqual([
          { status: Status.REJECTED, reason: 'Error1' },
          { status: Status.FULFILLED, value: 'First Success' },
          { status: Status.FULFILLED, value: 'Second Success' },
        ]);
        done();
      });
    });

    it('Promise.allSettled should reject if it does not receive an array', (done) => {
      const promises = null;

      Promise.allSettled(promises).catch((error) => {
        expect(error.message).toEqual(arrayRequeredMessage);
        done();
      });
    });

    it('Promise.allSettled should resolve with an empty array', (done) => {
      const promises = [];

      Promise.allSettled(promises).then((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
