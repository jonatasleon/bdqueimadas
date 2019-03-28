"use strict";

/**
 * Access statistics class of the BDQueimadasAdmin.
 * @class AccessStatistics
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 */
define(
  ['components/Utils'],
  function(Utils) {

    var formatSeconds = function(seconds) {
      var result = "";

      if(seconds >= 3600) {
        var hours = parseInt(seconds / 3600);
        var hoursText = (hours > 1 ? " horas" : " hora");

        seconds -= (hours * 3600);

        if(seconds >= 60) {
          var minutes = parseInt(seconds / 60);
          var minutesText = (minutes > 1 ? " minutos" : " minuto");

          seconds -= (minutes * 60);

          if(seconds > 0) {
            var secondsText = (seconds > 1 ? " segundos" : " segundo");

            result = hours + hoursText + ", " + minutes + minutesText + ", " + seconds + secondsText;
          } else
            result = hours + hoursText + ", " + minutes + minutesText;
        } else if(seconds > 0) {
          var secondsText = (seconds > 1 ? " segundos" : " segundo");

          result = hours + hoursText + ", " + seconds + secondsText;
        } else {
          result = hours + hoursText;
        }
      } else if(seconds >= 60) {
        var minutes = parseInt(seconds / 60);
        var minutesText = (minutes > 1 ? " minutos" : " minuto");

        seconds -= (minutes * 60);

        if(seconds > 0) {
          var secondsText = (seconds > 1 ? " segundos" : " segundo");

          result = minutes + minutesText + ", " + seconds + secondsText;
        } else
          result = minutes + minutesText;
      } else {
        var secondsText = (seconds > 1 ? " segundos" : " segundo");
        result = seconds + secondsText;
      }

      return result;
    };

    var filterData = function () {
      $("#table-load-div").removeClass("hidden");
    };

    var loadEvents = function() {
      $("#filter-accesses").on("click", function() {
        filterData();
      });
    };

    /**
     * Initializes the necessary features.
     *
     * @function init
     * @memberof AccessStatistics
     * @inner
     */
    var init = function() {
      $(document).ready(function() {
        loadEvents();

        var datePickerOptions = {
          "maxDate": 0,
          "markerClassName": "hasDatepicker",
          "dateFormat": "yy/mm/dd",
          "dayNames": ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
          "dayNamesMin": ["D","S","T","Q","Q","S","S","D"],
          "dayNamesShort": ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],
          "monthNames": ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
          "monthNamesShort": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
          "nextText": "Próximo",
          "prevText": "Anterior"
        };

        $("#initial-date").datepicker(datePickerOptions);
        $("#final-date").datepicker(datePickerOptions);

        var date = new Date();
        var finalDate = date.getFullYear() + "/" + ('0' + (date.getMonth() + 1)).slice(-2) + "/" + ('0' + date.getDate()).slice(-2);
        date.setDate(date.getDate() - 1);
        var initialDate = date.getFullYear() + "/" + ('0' + (date.getMonth() + 1)).slice(-2) + "/" + ('0' + date.getDate()).slice(-2);

        $("#initial-date").val(initialDate);
        $("#final-date").val(finalDate);

        filterData();
      });
    };

    return {
    	init: init
    };
  }
);
