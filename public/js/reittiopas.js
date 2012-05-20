var Templates = {};

var HOME = 'home';
var WORK = 'work';
var CITY = 'city';

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

  Handlebars.registerHelper('destination', function(type) {
      switch(type) {
        case HOME:
          return localStorage.home_address;
        case WORK:
          return localStorage.work_address;
        case CITY:
          return localStorage.city_address;
      }
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
  Handlebars.registerHelper('departureTime', function (leg) {
    return formatTime(leg.locs[0].depTime);
  });
  
  // departure time of a leg
  Handlebars.registerHelper('arrivalTime', function() {
    var leg = this.legs[this.legs.length-1];
    return formatTime(leg.locs[leg.locs.length-1].arrTime);
  });

  // departure time of a leg
  Handlebars.registerHelper('firstLineDeparture', function() {
    for (var i = 0; i < this.legs.length; i++) {
      var leg = this.legs[i];
      if(leg.type != "walk") {
        return formatTime(leg.locs[0].depTime);
      }
    }
  });
  
  // End arrival time
  Handlebars.registerHelper('lastLineArrival', function() {
    for (var i = this.legs.length - 1; i >= 0; i--) {
      var leg = this.legs[i];
      if(leg.type != "walk") {
        return formatTime(leg.locs[leg.locs.length - 1].arrTime);
      }
    }
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
      case 'walk':
        return 'walk';
      case '2':
        return 'tram';
      case '6':
        return 'metro';
      case '7':
        return 'ferry';
      case '12':
      case '13':
        return 'train';
      default:
        return 'bus';
    }
  });

  Handlebars.registerHelper('lineNumber', function() {
    switch(this.type) { // special cases
      case 'walk':
        return 'walk';
      case '7': // ferry
        return 'ferry';
      case '6': //metro
        return 'M';
      case '12': // train letter
        return this.code.substr(4,1);
      default:
        var code = this.code.substr(1,5);
        code = code.trim();
        //TODO remove spaces, zeroes and redundant last number
        return code;
    }
  });
}

/*
  This function should call the Reittiopas API (through our own proxy),
  then insert the fetched JSON into the page through a Handlebars.js template.
*/
function getRoutes(fromLong, fromLat, toLong, toLat, page) {

  $.mobile.showPageLoadingMsg(); // show spinner
  $.getJSON('/reittiopas',
    { request: 'route',
      format: 'json',
      epsg_in: 'wgs84',
      epsg_out: 'wgs84',
      from: fromLong + ',' + fromLat,
      to: toLong + ',' + toLat,
      show: 5
    }, function (json) {
      // add routes to page
      var content = Templates.routes(json);
      page.html(content).trigger('create');
      $.mobile.hidePageLoadingMsg(); // hide spinner
  });
}

// Get the name of your current position
function getPositionAddress(type) {
  getCurrentLocation( function (coords) {
    $.getJSON('/reittiopas',
      { request: 'reverse_geocode',
        format: 'json',
        epsg_in: 'wgs84',
        epsg_out: 'wgs84',
        coordinate: coords.longitude + ',' + coords.latitude,
      }, function (json) {
        json.type = type;
        // add routes to page
        var address = $('#' + type + ' .address');
        var content = Templates.fromToHeader(json);
        address.html(content).trigger('create');
    });
  });
}


function saveOptions() {
  if( $("#optHome").val() != localStorage.home_address ) {      
      resolveAddress( $("#optHome").val(),"Home" );
  } 
  if ( $("#optWork").val() != localStorage.work_address ){      
      resolveAddress(  $("#optWork").val(),"Work" );
  } 
  if ( $("#optCity").val() != localStorage.city_address ){      
      resolveAddress( $("#optCity").val(),"City" );
  } 
  
}

function resolveAddress( address , type ){
  var coords = null;
  if(address) {
    $.getJSON('/reittiopas',
      { request: 'geocode',
        format: 'json',
        epsg_in: 'wgs84',
        epsg_out: 'wgs84',
        key: address,
        disable_unique_stop_names: 0
      }, function(json) {
                          
        if(json == null) {
          alert('No address found that matches ' + address);          
        } 
        else if(json.length == 1) {
          coords = json[0].coords;     
          address = json[0].name;
          alert('Coords: ' + coords);
        } 
        else {
          var addressList = Templates.addressList(json);
          $('#options').simpledialog2({
            mode: 'blank',
            headerText: 'Select Address',
            headerClose: true,
            blankContent : addressList })
            coords = json[1].coords;     
            address = json[1].name; 
        }   
        if( type == "Home" ){
            localStorage.home_coords = coords;
            localStorage.home_address = address;    
        } if( type == "Work" ){
            localStorage.work_coords = coords;
            localStorage.work_address = address;    
        }if( type == "City" ){
            localStorage.city_coords = coords;
            localStorage.city_address = address;    
        }else
        {
            // should not reach here
        }
    });
  }
}

function restoreOptions() {
  $("#optHome").val(localStorage.home_address);
  $("#optWork").val(localStorage.work_address);
  $("#optCity").val(localStorage.city_address); 
}

function refreshRoutes() {
    // get gps location
  getCurrentLocation( function(currentCoords) {
  
    // Fill the content of the Home page with the routes
    if(localStorage.home_coords) {
      var destination = localStorage.home_coords.split(',')
      var home = $('#home [data-role="content"]');
      getPositionAddress(HOME);
      getRoutes(currentCoords.longitude, currentCoords.latitude, destination[0], destination[1], home);
    }
    
    // Fill the content of the Work page with the routes
    if(localStorage.work_coords) {
      var destination = localStorage.work_coords.split(',')
      var work = $('#work [data-role="content"]');
      getPositionAddress(WORK);
      getRoutes(currentCoords.longitude, currentCoords.latitude, destination[0], destination[1], work);
    }
    
    // Fill the content of the City page with the routes
    if(localStorage.city_coords) {
      var destination = localStorage.city_coords.split(',')
      var city = $('#city [data-role="content"]');
      getPositionAddress(CITY);
      getRoutes(currentCoords.longitude, currentCoords.latitude, destination[0], destination[1], city);
    }

  });
}


// on page init
$(document).bind('pageinit', function() {
      
  handlebarsInit();
  
  // Bindings for options
  $("#optButton").bind("click", function (event) {    
    restoreOptions(); 
  });

  // Bindings for options save
  $("#saveOpt").bind("click", function (event) {
    saveOptions();
  });
  
  // Bindings for options  cancel
  $("#cancelOpt").bind("click", function (event) {    
    restoreOptions(); 
  });

  refreshRoutes();    
});