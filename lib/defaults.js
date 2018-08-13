var crypto = require('crypto');

module.exports = {
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  baseUrl: process.env.BASE_URL,
  callbackURL: process.env.BASE_URL + '/auth0/callback',
  callback: null,
  scope: 'openid app_metadata',
  algorithms: ['RS256'],
  cookie: {
    name: 'token',
    maxAge: 24*60*60*1000,
    keys: [ process.env.COOKIE_SECRET || crypto.randomBytes(64).toString('hex') ],
    options: {
      path: '/'
    }
  }
}
