"use strict";

/**
 * Module responsible for handling the Queimadas Api requests.
 * @class QueimadasApi
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {object} memberPath - 'path' module.
 * @property {object} memberHttp - 'http' module.
 * @property {object} memberHttps - 'https' module.
 * @property {json} memberApiConfigurations - Api configurations.
 */
var QueimadasApi = function() {

  // 'path' module
  var memberPath = require('path');
  // 'http' module
  var memberHttp = require('http');
  // 'https' module
  var memberHttps = require('https');
  // Api configurations
  var memberApiConfigurations = require(memberPath.join(__dirname, '../configurations/Api'));

  /**
   * Returns the data received from the request.
   * @param {string} request - Request to be executed
   * @param {json} parameters - Request parameters
   * @param {array} urlParameters - Url parameters (http://localhost/url/example/{PARAMETER_1}/{PARAMETER_2})
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getData
   * @memberof QueimadasApi
   * @inner
   */
  this.getData = function(request, parameters, urlParameters, callback) {
    var request = memberApiConfigurations.Requests[request];

    for(var i = 0; i < urlParameters.length; i++) {
      request = request.replace("{" + i + "}", urlParameters[i]);
    }

    var url = memberApiConfigurations.Protocol + "://" + memberApiConfigurations.URL + request + memberApiConfigurations.Token;

    for(var i = 0; i < parameters.length; i++) {
      url += "&" + parameters[i].Key + "=" + parameters[i].Value;
    }

    var protocol = memberApiConfigurations.Protocol === "http" ? memberHttp : memberHttps;

    protocol.get(url, function(res) {
      var body = '';

      res.on('data', function(chunk) {
        body += chunk;
      });

      res.on('end', function() {
        try {
          var jsonData = JSON.parse(body);
        } catch(ex) {
          var jsonData = {};
        }

        callback(null, jsonData);
      });
    }).on('error', function(err) {
      callback(err, null);
    });
  };
};

module.exports = QueimadasApi;
