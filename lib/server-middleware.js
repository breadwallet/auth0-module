var express = require('express');
var cookieSession = require('cookie-session')
var JWT = require('jsonwebtoken');

module.exports = function(options) {
  var app = new express();

  var Auth0Strategy = require('passport-auth0'),
      passport = require('passport');

  var strategy = new Auth0Strategy(
    {
      domain:       options.domain,
      clientID:     options.clientID,
      clientSecret: options.clientSecret,
      callbackURL:  '/auth0/callback',
      scope: options.scope,
      state: true,
    },
    async function(accessToken, refreshToken, extraParams, profile, done) {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user

      var data;

      if(typeof options.callback == 'function') {
        try {
          data = await options.callback(accessToken,refreshToken,extraParams,profile);
        } catch(x) {
          return done(x);
        }
      } else {
        // default to setting the user data to be the contents of the
        // token:
        data = JWT.decode(extraParams.id_token);
      }
      
      if(data)
        done(null,data);
      else
        done('invalid jwt');
    }
  );

  passport.use(strategy);

  passport.serializeUser(options.serialize || function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(options.deserialize || function(user, done) {
    done(null, user);
  });

  app.use(cookieSession({
    name: options.cookie.name,
    maxAge: options.cookie.maxAge || 24*60*60*1000,
    keys: options.cookie.keys,
    httpOnly: true,
    signed: true,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/auth0/login',
          [ function(req,res,next)
            {
              req.session.then = req.query.then || '/';
              next();
            },
            passport.authenticate('auth0', {})
          ], function (req, res) {
            res.redirect("/");
          });

  app.get('/auth0/logout',function(req, res){
            req.logout();
            res.redirect('/');
          });

  app.get('/auth0/callback',
          passport.authenticate('auth0',/* { failureRedirect: '/failll' }*/),
          function(req, res) {
            if (!req.user) {
              throw new Error('user null');
            }
            var then = req.session.then;
            delete req.session.then;
            res.redirect(then || '/');
          }
         );

  return app;
};
