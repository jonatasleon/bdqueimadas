"use strict";

/**
 * Graphics model, which contains graphics related database manipulations.
 * @class Graphics
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {object} memberPath - 'path' module.
 * @property {object} memberPgConnectionPool - 'PgConnectionPool' module.
 * @property {json} memberTablesConfig - Tables configuration.
 */
var Graphics = function() {

  // 'path' module
  var memberPath = require('path');
  // 'PgConnectionPool' module
  var memberPgConnectionPool = new (require(memberPath.join(__dirname, '../modules/PgConnectionPool.js')))();
  // Tables configuration
  var memberTablesConfig = require(memberPath.join(__dirname, '../configurations/Tables.json'));

  /**
   * Callback of the database operations.
   * @callback Graphics~databaseOperationCallback
   * @param {error} err - Error
   * @param {json} result - Result of the operation
   */

  /**
   * Returns the count of the fires grouped by the received key.
   * @param {string} dateFrom - Initial date
   * @param {string} dateTo - Final date
   * @param {string} key - Key
   * @param {json} filterRules - Filter rules
   * @param {json} options - Filtering options
   * @param {databaseOperationCallback} callback - Callback function
   * @returns {databaseOperationCallback} callback - Execution of the callback function, which will process the received data
   *
   * @function getFiresCount
   * @memberof Graphics
   * @inner
   */
  this.getFiresCount = function(dateFrom, dateTo, key, filterRules, options, callback) {
    // Counter of the query parameters
    var parameter = 1;

    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {

        var fields = key + ", count(*) as count";
        var group = key;

        if(options.y !== undefined) {
          var yFields = options.y.match(/[^{\}]+(?=})/g);
          var index = yFields.indexOf(key);
          if(index > -1) yFields.splice(index, 1);

          if(yFields.length > 0) {
            fields += ", " + yFields.toString();
            group += ", " + yFields.toString();
          }
        }

        // Creation of the query
        var query = "select " + fields + " from " +
        memberTablesConfig.Fires.Schema + "." + memberTablesConfig.Fires.TableName +
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

        // If the 'options.countries' parameter exists, a countries 'where' clause is created
        if(options.countries !== undefined && !filterRules.ignoreCountryFilter) {
          var countriesArray = options.countries.split(',');
          query += " and " + memberTablesConfig.Fires.CountryFieldName + " in (";

          for(var i = 0; i < countriesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(countriesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.states' parameter exists, a states 'where' clause is created
        if(options.states !== undefined && !filterRules.ignoreStateFilter) {
          var statesArray = options.states.split(',');
          query += " and " + memberTablesConfig.Fires.StateFieldName + " in (";

          for(var i = 0; i < statesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(statesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        query += " group by " + group + " order by count desc, " + key + " asc";

        // If the 'options.limit' parameter exists, a limit clause is created
        if(options.limit !== undefined) {
          query += " limit $" + (parameter++);
          params.push(options.limit);
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
   * Returns the count of the fires.
   * @param {string} dateFrom - Initial date
   * @param {string} dateTo - Final date
   * @param {json} filterRules - Filter rules
   * @param {json} options - Filtering options
   * @param {databaseOperationCallback} callback - Callback function
   * @returns {databaseOperationCallback} callback - Execution of the callback function, which will process the received data
   *
   * @function getFiresTotalCount
   * @memberof Graphics
   * @inner
   */
  this.getFiresTotalCount = function(dateFrom, dateTo, filterRules, options, callback) {
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

        // If the 'options.countries' parameter exists, a countries 'where' clause is created
        if(options.countries !== undefined && !filterRules.ignoreCountryFilter) {
          var countriesArray = options.countries.split(',');
          query += " and " + memberTablesConfig.Fires.CountryFieldName + " in (";

          for(var i = 0; i < countriesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(countriesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.states' parameter exists, a states 'where' clause is created
        if(options.states !== undefined && !filterRules.ignoreStateFilter) {
          var statesArray = options.states.split(',');
          query += " and " + memberTablesConfig.Fires.StateFieldName + " in (";

          for(var i = 0; i < statesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(statesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.limit' parameter exists, a limit clause is created
        if(options.limit !== undefined) {
          query += " limit $" + (parameter++);
          params.push(options.limit);
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
   * Returns the count of the fires grouped by week.
   * @param {string} dateFrom - Initial date
   * @param {string} dateTo - Final date
   * @param {json} filterRules - Filter rules
   * @param {json} options - Filtering options
   * @param {databaseOperationCallback} callback - Callback function
   * @returns {databaseOperationCallback} callback - Execution of the callback function, which will process the received data
   *
   * @function getFiresCountByWeek
   * @memberof Graphics
   * @inner
   */
  this.getFiresCountByWeek = function(dateFrom, dateTo, filterRules, options, callback) {
    // Counter of the query parameters
    var parameter = 1;

    // Connection with the PostgreSQL database
    memberPgConnectionPool.getConnectionPool().connect(function(err, client, done) {
      if(!err) {
        // Creation of the query
        var query = "select TO_CHAR(date_trunc('week', " + memberTablesConfig.Fires.DateFieldName + ")::date, 'YYYY/MM/DD') as start, " +
        "TO_CHAR((date_trunc('week', " + memberTablesConfig.Fires.DateFieldName + ") + '6 days')::date, 'YYYY/MM/DD') as end, count(*) AS count " +
        "from " + memberTablesConfig.Fires.Schema + "." + memberTablesConfig.Fires.TableName +
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

        // If the 'options.countries' parameter exists, a countries 'where' clause is created
        if(options.countries !== undefined && !filterRules.ignoreCountryFilter) {
          var countriesArray = options.countries.split(',');
          query += " and " + memberTablesConfig.Fires.CountryFieldName + " in (";

          for(var i = 0; i < countriesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(countriesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        // If the 'options.states' parameter exists, a states 'where' clause is created
        if(options.states !== undefined && !filterRules.ignoreStateFilter) {
          var statesArray = options.states.split(',');
          query += " and " + memberTablesConfig.Fires.StateFieldName + " in (";

          for(var i = 0; i < statesArray.length; i++) {
            query += "$" + (parameter++) + ",";
            params.push(statesArray[i]);
          }

          query = query.substring(0, (query.length - 1)) + ")";
        }

        query += "group by 1, 2 order by 1, 2";

        // If the 'options.limit' parameter exists, a limit clause is created
        if(options.limit !== undefined) {
          query += " limit $" + (parameter++);
          params.push(options.limit);
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

module.exports = Graphics;