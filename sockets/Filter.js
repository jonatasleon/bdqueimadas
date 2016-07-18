"use strict";

/**
 * Socket responsible for processing filter related requests.
 * @class Filter
 * @variation 3
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {object} memberSockets - Sockets object.
 * @property {object} memberFilter - Filter model.
 */
var Filter = function(io) {

  // Sockets object
  var memberSockets = io.sockets;
  // Filter model
  var memberFilter = new (require('../models/Filter.js'))();

  // Socket connection event
  memberSockets.on('connection', function(client) {

    // Spatial filter request event
    client.on('spatialFilterRequest', function(json) {
      var functionName = "get" + json.key + "Extent";
      memberFilter[functionName](json.ids, function(err, extent) {
        if(err) return console.error(err);

        client.emit('spatialFilterResponse', { key: json.key, ids: json.ids, extent: extent });
      });
    });

    // Data by intersection request event
    client.on('dataByIntersectionRequest', function(json) {
      memberFilter.getDataByIntersection(json.longitude, json.latitude, json.resolution, function(err, data) {
        if(err) return console.error(err);

        client.emit('dataByIntersectionResponse', { data: data });
      });
    });

    // Continent by country request event
    client.on('continentByCountryRequest', function(json) {
      memberFilter.getContinentByCountry(json.country, function(err, continent) {
        if(err) return console.error(err);

        client.emit('continentByCountryResponse', { continent: continent });
      });
    });

    // Continent by state request event
    client.on('continentByStateRequest', function(json) {
      memberFilter.getContinentByState(json.state, function(err, continent) {
        if(err) return console.error(err);

        client.emit('continentByStateResponse', { continent: continent });
      });
    });

    // Country by state request event
    client.on('countriesByStatesRequest', function(json) {
      memberFilter.getCountriesByStates(json.states, function(err, countriesByStates) {
        if(err) return console.error(err);

        memberFilter.getCountriesByContinent(countriesByStates.rows[0].continent, function(err, countries) {
          if(err) return console.error(err);

          client.emit('countriesByStatesResponse', { countriesByStates: countriesByStates, countries: countries });
        });
      });
    });

    // Countries by continent request event
    client.on('countriesByContinentRequest', function(json) {
      memberFilter.getCountriesByContinent(json.continent, function(err, countries) {
        if(err) return console.error(err);

        client.emit('countriesByContinentResponse', { countries: countries });
      });
    });

    // States by country request event
    client.on('statesByCountryRequest', function(json) {
      memberFilter.getStatesByCountry(json.country, function(err, states) {
        if(err) return console.error(err);

        client.emit('statesByCountryResponse', { states: states });
      });
    });

    // States by countries request event
    client.on('statesByCountriesRequest', function(json) {
      memberFilter.getStatesByCountries(json.countries, function(err, states) {
        if(err) return console.error(err);

        client.emit('statesByCountriesResponse', { states: states });
      });
    });

    // Get satellites request event
    client.on('getSatellitesRequest', function(json) {
      // Object responsible for keep several information to be used in the database query
      var options = {};

      // Verifications of the 'options' object items
      if(json.satellites !== '') options.satellites = json.satellites;
      if(json.biomes !== '') options.biomes = json.biomes;
      if(json.extent !== '') options.extent = json.extent;
      if(json.countries !== null && json.countries !== '') options.countries = json.countries;
      if(json.states !== null && json.states !== '') options.states = json.states;

      memberFilter.getSatellites(json.dateFrom, json.dateTo, options, function(err, satellitesList) {
        if(err) return console.error(err);

        client.emit('getSatellitesResponse', { satellitesList: satellitesList });
      });
    });
  });
};

module.exports = Filter;
