let winston = require('winston')

module.exports = new winston.Logger({
  level: 'info',
  exitOnError: false,
  transports: [
    new(winston.transports.Console)({
      prettyPrint: true,
      colorize: true,
      json: false,
    })
  ]
})
