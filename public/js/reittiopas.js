var Templates = {};

/*
  This function should call the Reittiopas API (through our own proxy),
  then insert the fetched JSON into the page through a Handlebars.js template.
*/
function getRoutes(fromX, fromY, toX, toY, show) {
  $.getJSON('/reittiopas',
    { request: 'route',
      format: 'json',
      from: fromX + ',' + fromY,
      to: toX + ',' + toY,
      show: show
    }, function(json) {
      var content = Templates.routes(json);
      $("#routesList").html(content).trigger('create');
  });
}

$(function() {

  $('script[type="text/x-handlebars-template"]').each(function () {
    Templates[this.id] = Handlebars.compile($(this).html());
  });

  Handlebars.registerHelper('durationHMS', function() {
    // seconds to hh:mm:ss, from http://snipplr.com/view.php?codeview&id=20348
    d = Number(this.duration);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
  });

  getRoutes(2561133,6699755,2527815,6662705,5);
});