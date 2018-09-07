'use strict';

const request = require('request');
const async = require('async');
const config = require('./config/config');
const fs = require('fs');

let log = null;
let requestWithDefaults;
let previousDomainRegexAsString = '';
let domainBlacklistRegex = null;

// Maximum number of results to return in a singel request
const PAGE_LIMIT = 10;

function startup(logger) {
  log = logger;

  let requestOptions = {};

  if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
    requestOptions.cert = fs.readFileSync(config.request.cert);
  }

  if (typeof config.request.key === 'string' && config.request.key.length > 0) {
    requestOptions.key = fs.readFileSync(config.request.key);
  }

  if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
    requestOptions.passphrase = config.request.passphrase;
  }

  if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
    requestOptions.ca = fs.readFileSync(config.request.ca);
  }

  if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
    requestOptions.proxy = config.request.proxy;
  }

  if (typeof config.request.rejectUnauthorized === 'boolean') {
    requestOptions.rejectUnauthorized = config.request.rejectUnauthorized;
  }

  requestWithDefaults = request.defaults(requestOptions);
}

function _setupRegexBlacklists(options) {
  if (
    options.domainBlacklistRegex !== previousDomainRegexAsString &&
    options.domainBlacklistRegex.length === 0
  ) {
    log.debug('Removing Domain Blacklist Regex Filtering');
    previousDomainRegexAsString = '';
    domainBlacklistRegex = null;
  } else {
    if (options.domainBlacklistRegex !== previousDomainRegexAsString) {
      previousDomainRegexAsString = options.domainBlacklistRegex;
      log.debug(
        { domainBlacklistRegex: previousDomainRegexAsString },
        'Modifying Domain Blacklist Regex'
      );
      domainBlacklistRegex = new RegExp(options.domainBlacklistRegex, 'i');
    }
  }
}

function doLookup(entities, options, cb) {
  const lookupResults = [];

  log.trace({ entities: entities, options: options }, 'Entities');

  _setupRegexBlacklists(options);

  async.each(
    entities,
    function(entityObj, next) {
      if (domainBlacklistRegex !== null) {
        if (domainBlacklistRegex.test(entityObj.value)) {
          log.debug({ domain: entityObj.value }, 'Blocked BlackListed Domain Lookup');
          return next(null);
        }
      }

      _lookupEntity(entityObj, options, function(err, result) {
        if (err) {
          next(err);
        } else {
          lookupResults.push(result);
          next(null);
        }
      });
    },
    function(err) {
      log.debug({lookupResults:lookupResults}, 'Lookup Results');
      cb(err, lookupResults);
    }
  );
}

function _lookupEntity(entityObj, options, cb) {
  const requestOptions = {
    uri: options.baseUrl + '/api/v2/search.json',
    method: 'GET',
    auth: {
      user: options.username + '/token',
      pass: options.apiToken
    },
    qs: {
      query: _createQuery(entityObj, options),
      per_page: PAGE_LIMIT
    },
    json: true
  };

  log.trace({ requestOptions: requestOptions }, 'Request Options');

  requestWithDefaults(requestOptions, function(err, response, body) {
    // check for a request error
    if (err) {
      log.error({ err: err, body: body }, 'Error making HTTP Request');
      return cb({
        detail: 'Error Making HTTP Request',
        debug: err
      });
    }

    // If we get a 404 then cache a miss
    if (response.statusCode === 404 || response.statusCode === 400) {
      return cb(null, {
        entity: entityObj,
        data: null // setting data to null indicates to the server that this entity lookup was a "miss"
      });
    }

    if (response.statusCode === 409) {
      return cb({
        detail: 'You have reach your per-minute query limit'
      });
    }

    if (response.statusCode !== 200) {
      return cb({
        detail: 'Unexpected HTTP Status Code Received',
        statusCode: response.statusCode,
        debug: body
      });
    }

    if (!body || !Array.isArray(body.results) || body.results.length === 0) {
      cb(null, {
        entity: entityObj,
        data: null // setting data to null indicates to the server that this entity lookup was a "miss"
      });
      return;
    }

    // The lookup results returned is an array of lookup objects with the following format
    cb(null, {
      // Required: This is the entity object passed into the integration doLookup method
      entity: entityObj,
      // Required: An object containing everything you want passed to the template
      data: {
        // Required: These are the tags that are displayed in your template
        summary: _getTags(body),
        // Data that you want to pass back to the notification window details block
        details: body.results
      }
    });
  });
}

function _getTags(body) {
  const tags = [];
  tags.push(`${body.count} tickets`);
  return tags;
}

function _createQuery(entityObj, options) {
  let statuses = '';
  let order = 'order_by:updated_at sort:desc';
  let assignee = options.assigneeOnly ? 'assignee:me' : '';

  options.statuses.forEach((status) => {
    statuses += `status:${status.value} `;
  });

  return `type:ticket ${order} ${assignee} ${statuses} "${entityObj.value}"`;
}

module.exports = {
  doLookup: doLookup,
  startup: startup
};
