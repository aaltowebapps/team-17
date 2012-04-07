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
      $("#routesList").html(content).find("ul").listview();
  });
}

$(function() {

  $('script[type="text/x-handlebars-template"]').each(function () {
    Templates[this.id] = Handlebars.compile($(this).html());
  });

  getRoutes(2561133,6699755,2527815,6662705,5);
});