var arrayRequeredMessage = 'The method of Promise requires an array';
var allPromisesRejectedMessage = 'All promises were rejected';
var Status = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending',
};

module.exports = {
  allPromisesRejectedMessage,
  arrayRequeredMessage,
  Status,
};
