'use strict'

const express = require('express')
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

const keys = {}

function getPublicKey(kid) {
  return Promise.resolve().then(() => {
    if (keys[kid]) {
      return keys[kid];
    }
    return fetch('https://www.gstatic.com/iap/verify/public_key')
      .then((response) => response.json())
      .then((newKeys) => {
        Object.assign(keys, newKeys)
        return keys[kid];
      });
  });
}

const router = express.Router()

router.use((request, response, next) => {
  // IPv6 and IPv4 mapped loopback addresses; ::1, ::ffff:127.0.0.1, or matching /^\:\:ffff\:10\./
  if (
    request.connection.remoteAddress.match(/^::(1$|ffff:(10\.|127.0.0.1$))/) &&
    request.headers['x-forwarded-for'] === undefined
  ) {
    return next();
  }

  const token = request.headers['x-goog-iap-jwt-assertion'];
  const decoded = jwt.decode(token, { complete: true }) || {};

  let kid;
  try {
    ({
      header: { kid },
    } = decoded);
  } catch (err) {
    return response.status(403).send(`FORBIDDEN`);
  }

  return getPublicKey(kid)
    .then((key) => {
      const { email, sub } = jwt.verify(token, key);
      request.headers.auth = request.headers.auth || {};
      request.headers.auth.requestedEmail = email;

      request.headers.auth.verifiedEmail = email;
      request.headers.auth.verifiedSub = sub;
      next();
    })
    .catch((error) => {
      return response.status(403).send(`FORBIDDEN (BADCOM). ${error.message}`);
    });
})

router.use((req, res, next) => {
  const {
    auth: {
      verifiedEmail: email,
      verifiedSub: userId
    } = {}
  } = req.headers || {}

  req.userInfo = {
    email,
    userId,
  }
  next()
})

module.exports = router
