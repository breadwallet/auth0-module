# nuxt-module-auth0
[![npm (scoped with tag)](https://img.shields.io/npm/v/nuxt-module-auth0/latest.svg?style=flat-square)](https://npmjs.com/package/nuxt-module-auth0)
[![npm](https://img.shields.io/npm/dt/nuxt-module-auth0.svg?style=flat-square)](https://npmjs.com/package/nuxt-module-auth0)
[![CircleCI](https://img.shields.io/circleci/project/github/breadwallet/nuxt-module-auth0.svg?style=flat-square)](https://circleci.com/gh/breadwallet/nuxt-module-auth0)
[![Codecov](https://img.shields.io/codecov/c/github/breadwallet/nuxt-module-auth0.svg?style=flat-square)](https://codecov.io/gh/breadwallet/nuxt-module-auth0)
[![Dependencies](https://david-dm.org/breadwallet/nuxt-module-auth0/status.svg?style=flat-square)](https://david-dm.org/breadwallet/nuxt-module-auth0)
[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com)

> Module for integrating auth0.

[📖 **Release Notes**](./CHANGELOG.md)

## Features

Use auth0 for login/auth in the simplest possible way.  Hooks and configuration for progressive increases in complexity.

## Setup
- Add `nuxt-module-auth0` dependency using yarn or npm to your project
- Add `nuxt-module-auth0` to `modules` section of `nuxt.config.js`

- Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET environment variables (or set these via config arguments).

```js
{
  modules: [
    // Simple usage
    'nuxt-module-auth0',

    // With options
    ['nuxt-module-auth0', { /* module options */ }],
 ]
}
```

You will likely want to set a cookie secret - either by setting the
COOKIE_SECRET environment variable, or passing it in as an option
(`cookie.keys: [ 'active-secret','old-secret' ]`).  If you do neither,
it makes up a random cookie signing thing, which means that every time
the server restarts, all old sessions are invalidated.  Not a terrible
security default, but will certainly annoy some people.

## Usage

Once you have added this module (and restarted nuxt), you'll have two
new URLs you can hit:

- /auth0/login?then=<urlencoded-link>
- /auth0/logout

If you want a particular page/layout/etc to require authentication,
simply add middleware to it:

```
export default {
  middleware: ['admin-only'],
}
```

and add the middleware itself:

```
export default async function(ctx) {
  let user;
  
  if(process.server) {
    var session = ctx.req.session
    user = session && session.passport && session.passport.user
    
  } else {
    user = ctx.store.state.user
  }

  if(!user || user['https://brd.com/role'] != 'administrator') {
    ctx.redirect(`/please-login?as=administrator&then=${encodeURIComponent(ctx.route.path)}`);
  }
}

```

This particular example stores user data in the store, like so (this would be store/index.js):

```
export const state = () => ({
  user: null,
})

export const mutations = {
  user(state,val) {
    state.user = val;
  }
}

export const actions = {
  nuxtServerInit ({ commit }, { req }) {
    console.log("SESSION: ",req.session);
    if (req.session.passport && req.session.passport.user) {
      commit('user', req.session.passport.user)
    }
  }
}
```

It also depends on a `/pages/please-login.vue` file to handle redirected "not-authorized" users:

```
<template>
  <div>
    <p>
      Please log in!  You need the role of {{ $route.query.as }}.
    </p>
    <p>
      <a :href="`/auth0/login?then=${encodeURIComponent($route.query.then)}`">Log In</a>
    </p>
  </div>  
</template>
<script>

export default {

}
  
</script>
```

The idea here is to minimize integration pain, and make it really easy
to keep track of how things are integrating.  We could in principle
add these files to the module itself, but they're basically guaranteed
to need changing, and often they'll have app-specific logic around them.

If you want to customize how the module adds cookie data, you can add
a callback.  By default, it stores everything from the JWT in the
cookie.  If you just want the highlights:

```
  modules: [
    ['nuxt-module-auth0',{
      callback: (accessToken,refreshToken,params,profile) => profile._json
    }],
  ],
```

Anything returned from the callback will be stored in the cookie, so
feel free to customize.

## RBAC

I want roles!  How do I get roles to work in Auth0?  Here's an example
rule you could add, which automatically provisions user accounts with
a certain email domain administrative access:

```
function (user, context, callback) {
  user.app_metadata = user.app_metadata || {};
  // You can add a Role based on what you want
  // In this case I check domain
  var addRolesToUser = function(user, cb) {
    if (user.email && user.email.indexOf('@example.com') > -1) {
      cb(null, 'administrator');
    } else {
      cb(null, 'user');
    }
  };

  addRolesToUser(user, function(err, role) {
    if (err) {
      callback(err);
    } else {
      user.app_metadata.role = role;
      auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
        .then(function(){
          context.idToken['https://example.com/role'] = user.app_metadata.role;
          callback(null, user, context);
        })
        .catch(function(err){
          callback(err);
        });
    }
  });
}
```


## Development

- Clone this repository
- Install dependnecies using `yarn install` or `npm install`
- Start development server using `npm run dev`

## License

[MIT License](./LICENSE)

Copyright (c) Daniel Staudigel
