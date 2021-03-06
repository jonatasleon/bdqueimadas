"use strict";

/**
 * Graphics class of the BDQueimadas.
 * @class Graphics
 * @variation 2
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {object} memberFiresCountGraphics - Graphics of fires count.
 * @property {integer} memberContinent - Current continent filter.
 * @property {string} memberCountries - Current countries filter.
 * @property {string} memberStates - Current states filter.
 * @property {string} memberCities - Current cities filter.
 * @property {array} memberSpecialRegions - Current special regions.
 * @property {integer} memberLoadingCounter - Counter that indicates how many graphics are loading.
 * @property {boolean} memberUseGraphicsFilter - Flag that indicates if the last filter used was the one present in the graphics page.
 */
define(
  ['components/Utils', 'components/Filter', 'components/Map', 'TerraMA2WebComponents'],
  function(Utils, Filter, Map, TerraMA2WebComponents) {

    // Graphics of fires count
    var memberFiresCountGraphics = {};
    // Current continent filter
    var memberContinent = null;
    // Current countries filter
    var memberCountries = null;
    // Current states filter
    var memberStates = null;
    // Current cities filter
    var memberCities = null;
    // Current special regions
    var memberSpecialRegions = null;
    // Counter that indicates how many graphics are loading
    var memberLoadingCounter = 0;
    // Flag that indicates if the last filter used was the one present in the graphics page
    var memberUseGraphicsFilter = false;

    /**
     * Activates or deactivates the time series tool.
     *
     * @function setTimeSeriesTool
     * @memberof Graphics(2)
     * @inner
     */
    var setTimeSeriesTool = function() {
      if($('#show-time-series-graphic').hasClass('active')) {
        Map.resetMapMouseTools();
        Map.activateMoveMapTool();
      } else {
        Map.resetMapMouseTools();
        $('#show-time-series-graphic').addClass('active');
        $('#terrama2-map').addClass('cursor-pointer');
        TerraMA2WebComponents.MapDisplay.setMapSingleClickEvent(function(longitude, latitude) {
          showTimeSeriesGraphic(longitude, latitude, "2000-01", "2000-12");
        });
      }
    };

    /**
     * Shows the time series graphic to the received parameters.
     * @param {float} longitude - Received longitude
     * @param {float} latitude - Received latitude
     * @param {string} start - Time series start month (YYYY-MM)
     * @param {string} end - Time series end month (YYYY-MM)
     *
     * @private
     * @function showTimeSeriesGraphic
     * @memberof Graphics(2)
     * @inner
     */
    var showTimeSeriesGraphic = function(longitude, latitude, start, end) {
      var wtssObj = new wtss(Utils.getConfigurations().graphicsConfigurations.TimeSeries.URL);

      wtssObj.time_series({
        coverage: Utils.getConfigurations().graphicsConfigurations.TimeSeries.Coverage,
        attributes: Utils.getConfigurations().graphicsConfigurations.TimeSeries.Attributes,
        longitude: longitude,
        latitude: latitude,
        start: start,
        end: end
      }, function(data) {
        if(data.result !== undefined) {
          var graphicData = {
            labels: data.result.timeline,
            datasets: [
              {
                label: "Séries Temporais",
                fillColor: "rgb(220,75,56)",
                strokeColor: "rgb(220,75,56)",
                pointColor: "rgb(220,75,56)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgb(220,75,56)",
                data: data.result.attributes[0].values
              }
            ]
          };

          $('#time-series-dialog').dialog({
            width: 855,
            height: 480,
            resizable: false,
            closeOnEscape: true,
            closeText: "",
            position: { my: 'top', at: 'top+15' }
          });

          var htmlElement = $("#time-series").get(0).getContext("2d");

          if(memberFiresCountGraphics["timeSeries"] !== undefined && memberFiresCountGraphics["timeSeries"] !== null)
            memberFiresCountGraphics["timeSeries"].destroy();

          memberFiresCountGraphics["timeSeries"] = new Chart(htmlElement).Line(graphicData, { responsive : true, maintainAspectRatio: true });
        } else {
          throw new Error("Time Series Server Error!");
        }
      });
    };

    /**
     * Returns the countries, states, cities and special regions to be filtered.
     * @param {function} callback - Callback function
     * @returns {function} callback - Execution of the callback function, which will process the received data
     *
     * @private
     * @function getSpatialFilterData
     * @memberof Graphics(2)
     * @inner
     */
    var getSpatialFilterData = function(callback) {
      var continent = $('#continents-graphics').val();
      var countries = $('#countries-graphics').val() === null || (Utils.stringInArray($('#countries-graphics').val(), "") || $('#countries-graphics').val().length === 0) ? [] : $('#countries-graphics').val();
      var states = $('#states-graphics').val() === null || Utils.stringInArray($('#states-graphics').val(), "") || $('#states-graphics').val().length === 0 ? [] : $('#states-graphics').val();

      var filterStates = [];
      var specialRegions = [];

      $('#states-graphics > option').each(function() {
        if(Utils.stringInArray(states, $(this).val()) && $(this).data('special-region') !== undefined && $(this).data('special-region')) {
          specialRegions.push($(this).val());
        } else if(Utils.stringInArray(states, $(this).val()) && ($(this).data('special-region') === undefined || !$(this).data('special-region'))) {
          filterStates.push($(this).val());
        }
      });

      var city = Filter.getCity() !== null ? Filter.getCity() : "";

      callback(continent.toString(), countries.toString(), filterStates.toString(), city, specialRegions.toString());
    };

    /**
     * Updates all the graphics.
     * @param {boolean} useGraphicsFilter - Flag that indicates if the graphics filter should be used
     *
     * @function updateGraphics
     * @memberof Graphics(2)
     * @inner
     */
    var updateGraphics = function(useGraphicsFilter) {
      memberUseGraphicsFilter = useGraphicsFilter;

      $('#filter-error-dates-graphics').text('');

      var dates = Utils.getFilterDates(true, true, true, (useGraphicsFilter ? 2 : 0));
      var times = Utils.getFilterTimes(true, (useGraphicsFilter ? 2 : 0));

      if(dates !== null && times !== null) {
        if(dates.length === 0) {
          $('#filter-error-dates-graphics').text('Datas inválidas!');
        } else if(times.length === 0) {
          $('#filter-error-dates-graphics').text('Horas inválidas!');
        } else {
          var dateTimeFrom = Utils.dateToString(Utils.stringToDate(dates[0], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[0];
          var dateTimeTo = Utils.dateToString(Utils.stringToDate(dates[1], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[1];

          if(useGraphicsFilter) {
            var satellites = (Utils.stringInArray($('#filter-satellite-graphics').val(), "all") ? '' : $('#filter-satellite-graphics').val().toString());
            var biomes = (Utils.stringInArray($('#filter-biome-graphics').val(), "all") ? '' : $('#filter-biome-graphics').val().toString());
          } else {
            if(Filter.isInitialFilter()) {
              var satellites = Filter.getInitialSatellites().toString();
            } else {
              var satellites = Utils.stringInArray(Filter.getSatellites(), "all") ? '' : Filter.getSatellites().toString();
            }

            var biomes = Utils.stringInArray(Filter.getBiomes(), "all") ? '' : Filter.getBiomes().toString();
          }

          var risk = $('#risk-graphics').val();

          var protectedArea = Filter.getProtectedArea();

          var industrialFires = Filter.getIndustrialFires();

          if(!useGraphicsFilter) {
            $('#filter-date-from-graphics').val(Filter.getFormattedDateFrom('YYYY/MM/DD'));
            $('#filter-date-to-graphics').val(Filter.getFormattedDateTo('YYYY/MM/DD'));
          }

          Filter.updateSatellitesSelect(2, Utils.stringToDate(dates[0], 'YYYY/MM/DD'), Utils.stringToDate(dates[1], 'YYYY/MM/DD'));

          getSpatialFilterData(function(continent, countries, states, cities, specialRegions) {
            memberContinent = continent;
            memberCountries = countries;
            memberStates = states;
            memberSpecialRegions = specialRegions;
            memberCities = cities;

            var firesCountGraphicsConfig = Utils.getConfigurations().graphicsConfigurations.FiresCount;
            var firesCountGraphicsConfigLength = firesCountGraphicsConfig.length;

            for(var i = 0; i < firesCountGraphicsConfigLength; i++) {

              var loadGraphic = true;

              if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsACountryFiltered && memberCountries === '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              } else if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoCountryFiltered && memberCountries !== '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              } else if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsAStateFiltered && memberStates === '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              } else if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoStateFiltered && memberStates !== '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              }

              if(loadGraphic) {
                if(memberFiresCountGraphics[firesCountGraphicsConfig[i].Id] === undefined) {
                  if(firesCountGraphicsConfig[i].Expanded) {
                    var htmlElements = "<div data-sort=\"" + firesCountGraphicsConfig[i].Order + "\" class=\"box box-default graphic-item\" style=\"display: none;\"><div class=\"box-header with-border\"><h3 class=\"box-title\">" +
                                       firesCountGraphicsConfig[i].Title + "<span class=\"additional-title\"> | 0 focos, de " + $('#filter-date-from-graphics').val() + " a " +
                                       $('#filter-date-to-graphics').val() + "</span></h3><div class=\"box-tools pull-right\">" +
                                       "<button type=\"button\" class=\"btn btn-box-tool collapse-btn\" data-widget=\"collapse\">Minimizar</button></div></div>" +
                                       "<div class=\"box-body\" style=\"display: block;\"><div class=\"chart\">" +
                                       "<canvas id=\"fires-count-" + firesCountGraphicsConfig[i].Id + "-graphic\"></canvas>" +
                                       "<a href=\"#\" class=\"btn btn-app graphic-button export-graphic-data\" data-id=\"" + firesCountGraphicsConfig[i].Id +
                                       "\"><i class=\"fa fa-download\"></i>Exportar Dados em CSV</a>";

                    if(firesCountGraphicsConfig[i].PAGraphic)
                      htmlElements += "<a href=\"https://dev-queimadas.dgi.inpe.br/estatisticas/ucs_tis/repositorio_relat/relatorio.html\" target=\"_blank\" class=\"btn btn-app graphic-button\"><i class=\"fa fa-plus\"></i>Mais Detalhes</a>";

                    htmlElements += "<div id=\"fires-count-" + firesCountGraphicsConfig[i].Id +
                                    "-graphic-message-container\" class=\"text-center\">" +
                                    "</div></div></div></div>";
                  } else {
                    var htmlElements = "<div data-sort=\"" + firesCountGraphicsConfig[i].Order + "\" class=\"box box-default graphic-item collapsed-box\" style=\"display: none;\"><div class=\"box-header with-border\"><h3 class=\"box-title\">" +
                                       firesCountGraphicsConfig[i].Title + "<span class=\"additional-title\"> | 0 focos, de " + $('#filter-date-from-graphics').val() + " a " +
                                       $('#filter-date-to-graphics').val() + "</span></h3><div class=\"box-tools pull-right\">" +
                                       "<button type=\"button\" class=\"btn btn-box-tool collapse-btn\" data-widget=\"collapse\">Expandir</button></div></div>" +
                                       "<div class=\"box-body\" style=\"display: none;\"><div class=\"chart\">" +
                                       "<canvas id=\"fires-count-" + firesCountGraphicsConfig[i].Id + "-graphic\"></canvas>" +
                                       "<a href=\"#\" class=\"btn btn-app graphic-button export-graphic-data\" data-id=\"" + firesCountGraphicsConfig[i].Id +
                                       "\"><i class=\"fa fa-download\"></i>Exportar Dados em CSV</a>";

                    if(firesCountGraphicsConfig[i].PAGraphic)
                      htmlElements += "<a href=\"https://dev-queimadas.dgi.inpe.br/estatisticas/ucs_tis/repositorio_relat/relatorio.html\" target=\"_blank\" class=\"btn btn-app graphic-button\"><i class=\"fa fa-plus\"></i>Mais Detalhes</a>";

                    htmlElements += "<div id=\"fires-count-" + firesCountGraphicsConfig[i].Id + "-graphic-message-container\" class=\"text-center\"></div></div></div></div>";
                  }

                  insertGraphicAtPosition(htmlElements);
                  memberFiresCountGraphics[firesCountGraphicsConfig[i].Id] = null;
                }

                memberLoadingCounter++;
                $('#loading-span-graphics-background').removeClass('hide');
                $('#graph-box').addClass('overflow-hidden');

                Utils.getSocket().emit(
                  'graphicsFiresCountRequest',
                  {
                    dateTimeFrom: dateTimeFrom,
                    dateTimeTo: dateTimeTo,
                    id: firesCountGraphicsConfig[i].Id,
                    y: firesCountGraphicsConfig[i].Y,
                    key: firesCountGraphicsConfig[i].Key,
                    limit: firesCountGraphicsConfig[i].Limit,
                    title: firesCountGraphicsConfig[i].Title,
                    satellites: satellites,
                    biomes: biomes,
                    risk: risk,
                    continent: memberContinent,
                    countries: memberCountries,
                    states: memberStates,
                    cities: memberCities,
                    specialRegions: memberSpecialRegions,
                    industrialFires: industrialFires,
                    protectedArea: protectedArea,
                    filterRules: {
                      ignoreCountryFilter: firesCountGraphicsConfig[i].IgnoreCountryFilter,
                      ignoreStateFilter: firesCountGraphicsConfig[i].IgnoreStateFilter,
                      ignoreCityFilter: firesCountGraphicsConfig[i].IgnoreCityFilter,
                      showOnlyIfThereIsACountryFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsACountryFiltered,
                      showOnlyIfThereIsNoCountryFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoCountryFiltered,
                      showOnlyIfThereIsAStateFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsAStateFiltered,
                      showOnlyIfThereIsNoStateFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoStateFiltered
                    }
                  }
                );
              }
            }
          });
        }
      }
    };

    /**
     * Inserts a new graphic div in the right order.
     * @param {string} newDiv - New graphic div
     *
     * @private
     * @function insertGraphicAtPosition
     * @memberof Graphics(2)
     * @inner
     */
    var insertGraphicAtPosition = function(newDiv) {
      newDiv = $(newDiv);

      var count = $("div.graphic-item").length;

      if(count > 0) {
        var newDivOrder = parseInt(newDiv.attr("data-sort"));

        $("div.graphic-item").each(function(index) {
          var currentItemOrder = parseInt($(this).attr("data-sort"));

          if(index < count - 1) {
            var nextItemOrder = parseInt($(this).next().attr("data-sort"));

            if(newDivOrder < currentItemOrder) {
              newDiv.insertBefore($(this));
              return false;
            } else if(currentItemOrder == newDivOrder || (newDivOrder > currentItemOrder && newDivOrder < nextItemOrder)) {
              newDiv.insertAfter($(this));
              return false;
            }
          } else {
            newDiv.insertAfter($(this));
            return false;
          }
        });
      } else {
        $("#graphics-container").append(newDiv);
      }
    };

    /**
     * Loads a given graphic of fires count.
     * @param {json} firesCount - Data to be used in the graphic
     *
     * @function loadFiresCountGraphic
     * @memberof Graphics(2)
     * @inner
     */
    var loadFiresCountGraphic = function(firesCount) {
      memberLoadingCounter--;

      if(memberLoadingCounter === 0) {
        $('#loading-span-graphics-background').addClass('hide');
        $('#graph-box').removeClass('overflow-hidden');
      }

      var graphHeight = (firesCount.firesCount.rowCount * 20) + 100;
      var labels = [];
      var values = [];

      var yFields = firesCount.y.match(/[^{\}]+(?=})/g);
      var y = firesCount.y;
      var firesCountItems = firesCount.firesCount.rows;
      var firesCountItemsLength = firesCountItems.length;

      for(var i = 0; i < firesCountItemsLength; i++) {
        var label = y;

        for(var j = 0, count = yFields.length; j < count; j++) {
          var field = (firesCountItems[i][yFields[j]] !== null && firesCountItems[i][yFields[j]] !== undefined && firesCountItems[i][yFields[j]] !== "" ? firesCountItems[i][yFields[j]] : "Não Identificado");

          label = label.replace("{" + yFields[j] + "}", field);
        }

        var percentage = ((parseFloat(firesCountItems[i].count) / parseFloat(firesCount.firesTotalCount.rows[0].count)) * 100).toFixed(1);

        labels.push(label + ' (' + firesCountItems[i].count + ' F | ' + percentage + '%)');
        values.push(firesCountItems[i].count);
      }

      var firesCountGraphicData = {
        labels : labels,
        datasets : [
          {
            backgroundColor : "rgba(220,75,56,0.5)",
            borderColor : "rgba(220,75,56,0.8)",
            hoverBackgroundColor : "rgba(220,75,56,0.75)",
            hoverBorderColor : "rgba(220,75,56,1)",
            data : values
          }
        ]
      };

      if(memberFiresCountGraphics[firesCount.id] !== undefined && memberFiresCountGraphics[firesCount.id] !== null)
        memberFiresCountGraphics[firesCount.id].destroy();

      $("#fires-count-" + firesCount.id + "-graphic").attr('height', graphHeight + 'px');
      $("#fires-count-" + firesCount.id + "-graphic").css('min-height', graphHeight + 'px');
      $("#fires-count-" + firesCount.id + "-graphic").css('max-height', graphHeight + 'px');
      $("#fires-count-" + firesCount.id + "-graphic-message-container").hide();
      $("#fires-count-" + firesCount.id + "-graphic").show();

      var htmlElement = $("#fires-count-" + firesCount.id + "-graphic").get(0).getContext("2d");

      memberFiresCountGraphics[firesCount.id] = new Chart(htmlElement, {
        type: 'horizontalBar',
        data: firesCountGraphicData,
        options: {
          responsive : true,
          maintainAspectRatio: false,
          tooltips: {
            callbacks: {
              label: function(tooltipItems, data) {
                var percentage = ((parseFloat(tooltipItems.xLabel) / parseFloat(firesCount.firesTotalCount.rows[0].count)) * 100).toFixed(1);
                return tooltipItems.xLabel + ' F | ' + percentage + '%';
              }
            }
          },
          legend: {
            display: false
          },
          scales: {
            xAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  stepSize: 5,
                  maxTicksLimit: 20
                }
              }
            ]
          }
        }
      });

      var graphicTotalCount = Utils.sumIntegerArrayItems(values);

      var additionalTitle = " | " + graphicTotalCount + " focos, de " + $('#filter-date-from-graphics').val() + " a " + $('#filter-date-to-graphics').val();
      $("#fires-count-" + firesCount.id + "-graphic").parents('.graphic-item').find('.box-title > .additional-title').text(additionalTitle);
      $("#fires-count-" + firesCount.id + "-graphic").parent().children('.export-graphic-data').show();
      $("#fires-count-" + firesCount.id + "-graphic").parents('.graphic-item').show();

      if(firesCount.firesCount.rowCount <= 1) hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsACountryFiltered && memberCountries === '') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsNoCountryFiltered && memberCountries !== '') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsAStateFiltered && memberStates === '') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsNoStateFiltered && memberStates !== '') hideGraphic(firesCount.id);

      if($('#graphics-container > .graphic-item:visible').length > 0) $('#graphics-no-data').hide();
      else $('#graphics-no-data').show();
    };

    /**
     * Hides the graphic with the given id.
     * @param {string} id - Graphic id
     *
     * @private
     * @function hideGraphic
     * @memberof Graphics(2)
     * @inner
     */
    var hideGraphic = function(id) {
      $("#fires-count-" + id + "-graphic").parent().children('.export-graphic-data').hide();
      $("#fires-count-" + id + "-graphic").parents('.graphic-item').find('.box-title > .additional-title').text(" | 0 focos, de " + $('#filter-date-from-graphics').val() + " a " + $('#filter-date-to-graphics').val());
      $("#fires-count-" + id + "-graphic").hide();
      $("#fires-count-" + id + "-graphic-message-container").show();
      $("#fires-count-" + id + "-graphic-message-container").html('Não existem dados a serem exibidos!');
      $("#fires-count-" + id + "-graphic").parents('.graphic-item').hide();
    };

    /**
     * Exports graphic data in csv format.
     * @param {string} id - Graphic id
     *
     * @function exportGraphicData
     * @memberof Graphics(2)
     * @inner
     */
    var exportGraphicData = function(id) {
      $('#filter-error-dates-graphics').text('');

      var dates = Utils.getFilterDates(true, true, true, (memberUseGraphicsFilter ? 2 : 0));
      var times = Utils.getFilterTimes(true, (memberUseGraphicsFilter ? 2 : 0));

      if(dates !== null && times !== null) {
        if(dates.length === 0) {
          $('#filter-error-dates-graphics').text('Datas inválidas!');
        } else if(times.length === 0) {
          $('#filter-error-dates-graphics').text('Horas inválidas!');
        } else {
          var dateTimeFrom = Utils.dateToString(Utils.stringToDate(dates[0], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[0];
          var dateTimeTo = Utils.dateToString(Utils.stringToDate(dates[1], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[1];

          if(memberUseGraphicsFilter) {
            var satellites = (Utils.stringInArray($('#filter-satellite-graphics').val(), "all") ? '' : $('#filter-satellite-graphics').val().toString());
            var biomes = (Utils.stringInArray($('#filter-biome-graphics').val(), "all") ? '' : $('#filter-biome-graphics').val().toString());
          } else {
            if(Filter.isInitialFilter()) {
              var satellites = Filter.getInitialSatellites().toString();
            } else {
              var satellites = Utils.stringInArray(Filter.getSatellites(), "all") ? '' : Filter.getSatellites().toString();
            }

            var biomes = Utils.stringInArray(Filter.getBiomes(), "all") ? '' : Filter.getBiomes().toString();
          }

          var risk = $('#risk-graphics').val();
          var protectedArea = Filter.getProtectedArea() !== null ? Filter.getProtectedArea() : '';
          var industrialFires = Filter.getIndustrialFires();

          getSpatialFilterData(function(continent, countries, states, cities, specialRegions) {
            var exportLink = Utils.getBaseUrl() + "export-graphic-data?dateTimeFrom=" + dateTimeFrom + "&dateTimeTo=" + dateTimeTo + "&satellites=" + satellites + "&biomes=" + biomes + "&risk=" + risk + "&continent=" + continent + "&countries=" + countries + "&states=" + states + "&cities=" + cities + "&specialRegions=" + specialRegions + "&id=" + id + "&protectedArea=" + protectedArea + "&industrialFires=" + industrialFires;
            location.href = exportLink;
          });
        }
      }
    };

    /**
     * Initializes the necessary features.
     *
     * @function init
     * @memberof Graphics(2)
     * @inner
     */
    var init = function() {
      $(document).ready(function() {
        updateGraphics(false);
        Utils.getSocket().emit('countriesByContinentRequest', { continent: Utils.getConfigurations().applicationConfigurations.InitialContinentToFilter, filter: 2 });
        $('#continents-graphics').val(Utils.getConfigurations().applicationConfigurations.InitialContinentToFilter);
      });
    };

    return {
      setTimeSeriesTool: setTimeSeriesTool,
      updateGraphics: updateGraphics,
      loadFiresCountGraphic: loadFiresCountGraphic,
      exportGraphicData: exportGraphicData,
      init: init
    };
  }
);
