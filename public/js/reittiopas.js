var Templates = {};

// returns meters if less than 1 km, otherwise km with one decimal
function formatDistance(m) {
  var km = parseFloat( (m / 1000).toFixed(1) );
  return (m < 1000 ? m + " m" : km + " km");
}

// from format YYYYMMDDHHMM to HH:MM
function formatTime(time) {
  var timeString = time.toString();
  return timeString.substr(8,2) + ":" + timeString.substr(10,2);
}

/* Compile Handlebars templates and register helpers */
function handlebarsInit() {
  $('script[type="text/x-handlebars-template"]').each(function () {
    Templates[this.id] = Handlebars.compile($(this).html());
  });

  // seconds to hours and minutes
  Handlebars.registerHelper('duration', function() {
    var d = Number(this.duration);
    var h = Math.floor(d / 3600);
    var m = Math.round(d % 3600 / 60);
    return (h > 0 ? h + " h " : "") + m + " min";
  });

  Handlebars.registerHelper('length', function() {
      return formatDistance(this.length);
  });

  // departure time of a leg
  Handlebars.registerHelper('departureTime', function(leg) {
    return formatTime(leg.locs[0].depTime);
  });
  
  // departure time of a leg
  Handlebars.registerHelper('arrivalTime', function() {
    var leg = this.legs[this.legs.length-1];
    return formatTime(leg.locs[leg.locs.length-1].arrTime);
  });
  // departure time of a leg
  Handlebars.registerHelper('firstLineTime', function(leg) {
    return formatTime(leg.locs[0].depTime);
  });
  
  // End arrival time
  Handlebars.registerHelper('endLineTime', function(leg) {
    return formatTime(leg.locs[leg.locs.length-1].arrTime);
  });
    // Total walking time
  Handlebars.registerHelper('totalWalkingDistance', function() {
  	var l = 0;
  	for (i=0;i<this.legs.length;i++)
  	{
      if(this.legs[i].type == 'walk')
  		{
  		    l += this.legs[i].length;
  		}
  	}
    return formatDistance(l);
  });

    // Icon for specific line
  Handlebars.registerHelper('iconClass', function() {
    switch(this.type) {
      case "walk":
        return "walk";
      case 2:
        return "tram";
      case 6:
        return "metro";
      case 7:
        return "ferry";
      case 12:
      case 13:
        return "train";
      default:
        return "bus";
    }
  });
}

/*
  This function should call the Reittiopas API (through our own proxy),
  then insert the fetched JSON into the page through a Handlebars.js template.
*/
function getRoutes(fromX, fromY, toX, toY, page) {

  $.getJSON('/reittiopas',
    { request: 'route',
      format: 'json',
      from: fromX + ',' + fromY,
      to: toX + ',' + toY,
      show: 5
    }, function(json) {
      var content = Templates.routes(json);
      page.html(content).trigger('create');
  });
}


function saveOptions() {

  var address = $("#optHome").val();
  var coords = null;

  if(address) {
    $.getJSON('/reittiopas',
      { request: 'geocode',
        format: 'json',
        key: address,
        disable_unique_stop_names: 0
      }, function(json) {

        if(json == null) {
          alert('No address found that matches ' + address);
        } 
        else if(json.length == 1) {
          coords = json[0].coords;
          alert('Coords: ' + coords);
        } 
        else {
          var addressList = Templates.addressList(json);
          $('#options').simpledialog2({
            mode: 'blank',
            headerText: 'Select Address',
            headerClose: true,
            blankContent : addressList })
        }
    });
  }
}

// on document ready
$(function() {

  handlebarsInit();

  // Bindings for options
  $("#saveOpt").bind("click", function(event) { 
    event.preventDefault();
    saveOptions(); 
  });

  // Fill the content of the Home page with the routes
  var home = $('#home [data-role="content"]');
  getRoutes(2561133,6699755,2527815,6662705,home);
  
});