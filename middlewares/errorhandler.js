'use strict';

module.exports = function (err, req, res, next) {
  res.status(500).send({
    error: {
      message: err.message
    }
  });
  console.log(err.stack);
}