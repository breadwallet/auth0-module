const { resolve , join } = require('path')
const defaults = require('./defaults')
const serverMiddleware = require('./server-middleware');

module.exports = function module (moduleOptions) {
  const options = Object.assign({}, defaults, moduleOptions, this.options.auth)

  this.options.serverMiddleware.push(
    { path: '/' , handler: serverMiddleware(options) }
  );
  
}
