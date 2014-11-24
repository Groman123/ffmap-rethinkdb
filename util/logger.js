'use strict';

var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './logs/info.log',
            handleExceptions: true,
            json: true,
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;

module.exports.stream = {
    write: function (message) {
        logger.info(message);
    }
};
