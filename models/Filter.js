"use strict";

/**
 * Filter model, which contains filter related database manipulations.
 * @class Filter
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {object} memberPath - 'path' module.
 * @property {object} memberPgConnectionPool - 'PgConnectionPool' module.
 * @property {json} memberFilterConfig - Filter configuration.
 * @property {json} memberTablesConfig - Tables configuration.
 */
var Filter = function() {

  // 'path' module
  var memberPath = require('path');
  // 'PgConnectionPool' module
  var memberPgConnectionPool = new (require(memberPath.join(__dirname, '../modules/PgConnectionPool.js')))();
  // Filter configuration
  var memberFilterConfig = require(memberPath.join(__dirname, '../configurations/Filter.json'));
  // Tables configuration
  var memberTablesConfig = require(memberPath.join(__dirname, '../configurations/Tables.json'));

  /**
   * Returns the count of the fires.
   * @param {string} dateFrom - Initial date
   * @param {string} dateTo - Final date
   * @param {json} options - Filtering options
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getFiresCount
   * @memberof Filter
   * @inner
   */
  this.getFiresCount = function(dateFrom, dateTo, options, callback) {
    // Counter of the query parameters
    var parameter = 1;

    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select count(*) as count from " + memberTablesConfig.Fires.Schema + "." + memberTablesConfig.Fires.TableName +
        " where (" + memberTablesConfig.Fires.DateFieldName + " between $" + (parameter++) + " and $" + (parameter++) + ")",
            params = [dateFrom, dateTo];

        // If the 'options.satellites' parameter exists, a satellites 'where' clause is created
        if(options.satellites !== undefined) {
          var satellitesArray = options.satellites.split(',');
          query += " and " + memberTablesConfig.Fires.SatelliteFieldName + " in (";

          for(var i = 0; i < satellitesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(satellitesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.biomes' parameter exists, a biomes 'where' clause is created
        if(options.biomes !== undefined) {
          var biomesArray = options.biomes.split(',');
          query += " and " + memberTablesConfig.Fires.BiomeFieldName + " in (";

          for(var i = 0; i < biomesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(biomesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.extent' parameter exists, a extent 'where' clause is created
        if(options.extent !== undefined) {
          query += " and ST_Intersects(" + memberTablesConfig.Fires.GeometryFieldName + ", ST_MakeEnvelope($" + (parameter++) + ", $" + (parameter++) + ", $" + (parameter++) + ", $" + (parameter++) + ", 4326))";
          params.push(options.extent[0], options.extent[1], options.extent[2], options.extent[3]);
        }

        // If the 'options.countries' parameter exists, a countries 'where' clause is created
        if(options.countries !== undefined) {
          var countriesArray = options.countries.split(',');
          query += " and " + memberTablesConfig.Fires.CountryFieldName + " in (";

          for(var i = 0; i < countriesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(countriesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.states' parameter exists, a states 'where' clause is created
        if(options.states !== undefined) {
          var statesArray = options.states.split(',');
          query += " and " + memberTablesConfig.Fires.StateFieldName + " in (";

          for(var i = 0; i < statesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(statesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a list of continents.
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getContinents
   * @memberof Filter
   * @inner
   */
  this.getContinents = function(callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select " + memberTablesConfig.Continents.IdFieldName + " as id, " + memberTablesConfig.Continents.NameFieldName +
        " as name from " + memberTablesConfig.Continents.Schema + "." + memberTablesConfig.Continents.TableName + " where lower(" + memberTablesConfig.Continents.NameFieldName +
        ") like '%america%' or lower(" + memberTablesConfig.Continents.NameFieldName + ") like '%europe%' or lower(" + memberTablesConfig.Continents.NameFieldName + ") like '%africa%' order by " +
        "case " +
        "when lower(" + memberTablesConfig.Continents.NameFieldName + ") like '%south_america%' then 1 " +
        "when lower(" + memberTablesConfig.Continents.NameFieldName + ") like '%america%' then 2 " +
        "when lower(" + memberTablesConfig.Continents.NameFieldName + ") like '%africa%' then 3 " +
        "when lower(" + memberTablesConfig.Continents.NameFieldName + ") like '%europe%' then 4 " +
        "else 5 " +
        "end, " + memberTablesConfig.Continents.NameFieldName + ";";

        // Execution of the query
        client.query(query, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a continent filtered by the received country id.
   * @param {string} country - Country id
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getContinentByCountry
   * @memberof Filter
   * @inner
   */
  this.getContinentByCountry = function(country, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select a." + memberTablesConfig.Continents.IdFieldName + " as id, a." + memberTablesConfig.Continents.NameFieldName + " as name from " + memberTablesConfig.Continents.Schema + "." + memberTablesConfig.Continents.TableName + " a inner join " + memberTablesConfig.Countries.Schema + "." + memberTablesConfig.Countries.TableName + " b on (a." + memberTablesConfig.Continents.IdFieldName + " = b." + memberTablesConfig.Countries.ContinentFieldName + ") where b." + memberTablesConfig.Countries.IdFieldName + " = $1;",
            params = [country];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a continent filtered by the received state id.
   * @param {string} state - State id
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getContinentByState
   * @memberof Filter
   * @inner
   */
  this.getContinentByState = function(state, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select a." + memberTablesConfig.Continents.IdFieldName + " as id, a." + memberTablesConfig.Continents.NameFieldName + " as name from " + memberTablesConfig.Continents.Schema + "." + memberTablesConfig.Continents.TableName + " a inner join " + memberTablesConfig.Countries.Schema + "." + memberTablesConfig.Countries.TableName + " b on (a." + memberTablesConfig.Continents.IdFieldName + " = b." + memberTablesConfig.Countries.ContinentFieldName + ") inner join " + memberTablesConfig.States.Schema + "." + memberTablesConfig.States.TableName + " c on (b." + memberTablesConfig.Countries.IdFieldName + " = c." + memberTablesConfig.Countries.IdFieldName + ") where c." + memberTablesConfig.States.IdFieldName + " = $1;",
            params = [state];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a list of countries filtered by the received states ids.
   * @param {array} states - States ids
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getCountriesByStates
   * @memberof Filter
   * @inner
   */
  this.getCountriesByStates = function(states, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        var parameter = 1;
        var params = [];

        // Creation of the query
        var query = "select a." + memberTablesConfig.Countries.IdFieldName + " as id, a." + memberTablesConfig.Countries.NameFieldName + " as name, a." +
                    memberTablesConfig.Countries.BdqNameFieldName + " as bdq_name, c." + memberTablesConfig.Continents.IdFieldName + " as continent from " +
                    memberTablesConfig.Countries.Schema + "." + memberTablesConfig.Countries.TableName + " a inner join " + memberTablesConfig.States.Schema + "." +
                    memberTablesConfig.States.TableName + " b on (a." + memberTablesConfig.Countries.IdFieldName + " = b." + memberTablesConfig.Countries.IdFieldName +
                    ") inner join " + memberTablesConfig.Continents.Schema + "." + memberTablesConfig.Continents.TableName +
                    " c on (a." + memberTablesConfig.Countries.ContinentFieldName + " = c." + memberTablesConfig.Continents.IdFieldName +
                    ") where b." + memberTablesConfig.States.IdFieldName + " in (";

        for(var i = 0; i < states.length; i++) {
          query += "$" + (parameter++) + ",";
          params.push(states[i]);
        }

        query = query.substring(0, (query.length - 1)) + ");";

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a list of countries filtered by the received continent id.
   * @param {string} continent - Continent id
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getCountriesByContinent
   * @memberof Filter
   * @inner
   */
  this.getCountriesByContinent = function(continent, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select " + memberTablesConfig.Countries.IdFieldName + " as id, " + memberTablesConfig.Countries.NameFieldName + " as name from " + memberTablesConfig.Countries.Schema + "." + memberTablesConfig.Countries.TableName + " where " + memberTablesConfig.Countries.ContinentFieldName + " = $1 order by " + memberTablesConfig.Countries.NameFieldName + " asc;",
            params = [continent];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a list of states filtered by the received country id.
   * @param {number} country - Country id
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getStatesByCountry
   * @memberof Filter
   * @inner
   */
  this.getStatesByCountry = function(country, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select " + memberTablesConfig.States.IdFieldName + " as id, " + memberTablesConfig.States.NameFieldName + " as name from " + memberTablesConfig.States.Schema + "." + memberTablesConfig.States.TableName + " where " + memberTablesConfig.Countries.IdFieldName + " = $1 order by " + memberTablesConfig.States.NameFieldName + " asc;",
            params = [country];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns a list of states filtered by the received countries ids.
   * @param {array} countries - Countries ids
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getStatesByCountries
   * @memberof Filter
   * @inner
   */
  this.getStatesByCountries = function(countries, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        var parameter = 1;
        var params = [];

        // Creation of the query
        var query = "select " + memberTablesConfig.States.IdFieldName + " as id, " + memberTablesConfig.States.NameFieldName + " as name from " +
        memberTablesConfig.States.Schema + "." + memberTablesConfig.States.TableName +
        " where " + memberTablesConfig.Countries.IdFieldName + " in (";

        for(var i = 0; i < countries.length; i++) {
          query += "$" + (parameter++) + ",";
          params.push(countries[i]);
        }

        query = query.substring(0, (query.length - 1)) + ") order by " + memberTablesConfig.Countries.NameFieldName + " asc, " + memberTablesConfig.States.NameFieldName + " asc;";

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the continent extent correspondent to the received id.
   * @param {number} continent - Continent id
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getContinentExtent
   * @memberof Filter
   * @inner
   */
  this.getContinentExtent = function(continent, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select ST_Extent(" + memberTablesConfig.Continents.GeometryFieldName + ") as extent from " + memberTablesConfig.Continents.Schema + "." + memberTablesConfig.Continents.TableName + " where " + memberTablesConfig.Continents.IdFieldName + " = $1;",
            params = [continent];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the countries extent correspondent to the received ids.
   * @param {array} countries - Countries ids
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getCountriesExtent
   * @memberof Filter
   * @inner
   */
  this.getCountriesExtent = function(countries, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        var parameter = 1;
        var params = [];

        // Creation of the query
        var query = "select ST_Extent(" + memberTablesConfig.Countries.GeometryFieldName + ") as extent from " + memberTablesConfig.Countries.Schema + "." +
        memberTablesConfig.Countries.TableName + " where " + memberTablesConfig.Countries.IdFieldName + " in (";

        for(var i = 0; i < countries.length; i++) {
          query += "$" + (parameter++) + ",";
          params.push(countries[i]);
        }

        query = query.substring(0, (query.length - 1)) + ")";

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the states extent correspondent to the received ids.
   * @param {array} states - States ids
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getStatesExtent
   * @memberof Filter
   * @inner
   */
  this.getStatesExtent = function(states, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        var parameter = 1;
        var params = [];

        // Creation of the query
        var query = "select ST_Extent(" + memberTablesConfig.States.GeometryFieldName + ") as extent from " + memberTablesConfig.States.Schema + "." +
        memberTablesConfig.States.TableName + " where " + memberTablesConfig.States.IdFieldName + " in (";

        for(var i = 0; i < states.length; i++) {
          query += "$" + (parameter++) + ",";
          params.push(states[i]);
        }

        query = query.substring(0, (query.length - 1)) + ")";

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the number of the fires located in the country correspondent to the received id.
   * @param {number} country - Country id
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getFiresCountByCountry
   * @memberof Filter
   * @inner
   */
  this.getFiresCountByCountry = function(country, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        // Creation of the query
        var query = "select count(*) as firescount from " + memberTablesConfig.Fires.Schema + "." + memberTablesConfig.Fires.TableName + " where " + memberTablesConfig.Fires.CountryFieldName + " = $1;",
            params = [country];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the data of the polygon that intersects with the received point.
   * @param {string} longitude - Longitude of the point
   * @param {string} latitude - Latitude of the point
   * @param {float} resolution - Current map resolution
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getDataByIntersection
   * @memberof Filter
   * @inner
   */
  this.getDataByIntersection = function(longitude, latitude, resolution, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        var key = "States";

        if(resolution >= memberFilterConfig.SpatialFilter.Continents.MinResolution)
          key = "Continents";
        else if(resolution >= memberFilterConfig.SpatialFilter.Countries.MinResolution && resolution < memberFilterConfig.SpatialFilter.Countries.MaxResolution)
          key = "Countries";

        // Creation of the query
        var query = "SELECT " + memberTablesConfig[key].IdFieldName + " as id, " + memberTablesConfig[key].NameFieldName + " as name, '" + key + "' as key";

        if(key !== "Continents") {
          query += ", " + memberTablesConfig[key].BdqNameFieldName + " as bdq_name";
        }

        query += " FROM " + memberTablesConfig[key].Schema + "." + memberTablesConfig[key].TableName + " WHERE ST_Intersects(" + memberTablesConfig[key].GeometryFieldName + ", ST_SetSRID(ST_MakePoint($1, $2), 4326));";

        var params = [longitude, latitude];

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the BDQ names of the received countries ids.
   * @param {array} countries - Countries ids
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getCountriesBdqNames
   * @memberof Filter
   * @inner
   */
  this.getCountriesBdqNames = function(countries, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        var parameter = 1;
        var params = [];

        // Creation of the query
        var query = "select " + memberTablesConfig.Countries.BdqNameFieldName + " as name from " + memberTablesConfig.Countries.Schema + "." +
                    memberTablesConfig.Countries.TableName + " where " + memberTablesConfig.Countries.IdFieldName + " in (";

        for(var i = 0; i < countries.length; i++) {
          query += "$" + (parameter++) + ",";
          params.push(countries[i]);
        }

        if(countries.length > 0) {
          query = query.substring(0, (query.length - 1)) + ") order by " + memberTablesConfig.Countries.BdqNameFieldName + " asc;";
        } else {
          query += "'0') order by " + memberTablesConfig.Countries.BdqNameFieldName + " asc;";
        }

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the BDQ names of the received states ids.
   * @param {array} states - States ids
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getStatesBdqNames
   * @memberof Filter
   * @inner
   */
  this.getStatesBdqNames = function(states, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        var parameter = 1;
        var params = [];

        // Creation of the query
        var query = "select " + memberTablesConfig.States.BdqNameFieldName + " as name from " + memberTablesConfig.States.Schema + "." +
                    memberTablesConfig.States.TableName + " where " + memberTablesConfig.States.IdFieldName + " in (";

        for(var i = 0; i < states.length; i++) {
          query += "$" + (parameter++) + ",";
          params.push(states[i]);
        }

        if(states.length > 0) {
          query = query.substring(0, (query.length - 1)) + ") order by " + memberTablesConfig.States.BdqNameFieldName + " asc;";
        } else {
          query += "'0') order by " + memberTablesConfig.States.BdqNameFieldName + " asc;";
        }

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };

  /**
   * Returns the satellites for the given filter.
   * @param {string} dateFrom - Initial date
   * @param {string} dateTo - Final date
   * @param {json} options - Filtering options
   * @param {function} callback - Callback function
   * @returns {function} callback - Execution of the callback function, which will process the received data
   *
   * @function getSatellites
   * @memberof Filter
   * @inner
   */
  this.getSatellites = function(dateFrom, dateTo, options, callback) {
    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        // Counter of the query parameters
        var parameter = 1;

        // Creation of the query
        var query = "select distinct " + memberTablesConfig.Fires.SatelliteFieldName + " from " + memberTablesConfig.Fires.Schema + "." + memberTablesConfig.Fires.TableName +
            " where (" + memberTablesConfig.Fires.DateFieldName + " between $" + (parameter++) + " and $" + (parameter++) + ")",
            params = [dateFrom, dateTo];

        // If the 'options.satellites' parameter exists, a satellites 'where' clause is created
        if(options.satellites !== undefined) {
          var satellitesArray = options.satellites.split(',');
          query += " and " + memberTablesConfig.Fires.SatelliteFieldName + " in (";

          for(var i = 0; i < satellitesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(satellitesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.biomes' parameter exists, a biomes 'where' clause is created
        if(options.biomes !== undefined) {
          var biomesArray = options.biomes.split(',');
          query += " and " + memberTablesConfig.Fires.BiomeFieldName + " in (";

          for(var i = 0; i < biomesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(biomesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.extent' parameter exists, a extent 'where' clause is created
        if(options.extent !== undefined) {
          query += " and ST_Intersects(" + memberTablesConfig.Fires.GeometryFieldName + ", ST_MakeEnvelope($" + (parameter++) + ", $" + (parameter++) + ", $" + (parameter++) + ", $" + (parameter++) + ", 4326))";
          params.push(options.extent[0], options.extent[1], options.extent[2], options.extent[3]);
        }

        // If the 'options.countries' parameter exists, a countries 'where' clause is created
        if(options.countries !== undefined) {
          var countriesArray = options.countries.split(',');
          query += " and " + memberTablesConfig.Fires.CountryFieldName + " in (";

          for(var i = 0; i < countriesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(countriesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.states' parameter exists, a states 'where' clause is created
        if(options.states !== undefined) {
          var statesArray = options.states.split(',');
          query += " and " + memberTablesConfig.Fires.StateFieldName + " in (";

          for(var i = 0; i < statesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(statesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // Execution of the query
        client.query(query, params, function(err, result) {
          done();
          if(!err) return callback(null, result);
          else return callback(err);
        });
      } else return callback(err);
    });
  };
};

module.exports = Filter;