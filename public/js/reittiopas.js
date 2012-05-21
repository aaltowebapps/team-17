var Templates = {};

var HOME = 'home';
var WORK = 'work';
var CITY = 'city';
var PLACES = [HOME, WORK, CITY];

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

  Handlebars.registerHelper('destination', function(place) {
      switch(place) {
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
        var code = this.code.substr(1,5).replace(/^0+/, ''); //trim zeroes
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
function getPositionAddress(coords) {
  $.getJSON('/reittiopas',
  { request: 'reverse_geocode',
    format: 'json',
    epsg_in: 'wgs84',
    epsg_out: 'wgs84',
    coordinate: coords.longitude + ',' + coords.latitude,
  }, function (json) {
    // add place names to pages
    for(var i in PLACES) {
      json.place = PLACES[i];
      var address = $('#' + PLACES[i] + ' .address');
      var content = Templates.fromToHeader(json);
      address.html(content).trigger('create');
    }
  });
}


function saveOptions() {

  for (var i in PLACES) {
    var place = PLACES[i];
    var address;
    var coords;
    if($('#opt_' + place).is('select')) { // list selection

      address = $('#opt_' + place + ' option:selected').text().trim();
      coords = $('#opt_' + place).val();
      storeAddress(coords, address, place);
      $('#opt_form > *').has('#opt_' + place).replaceWith($('<input>').attr({type: 'text', id: 'opt_' + place, name: place}));
      $('#opt_' + place).textinput().val(address);

    } else { // text input

      address = $('#opt_' + place).val();
      if( address != localStorage[place + '_address'] ) {
        var storePlace = place;
        resolveAddress( address, storePlace, function ( coords, address, choicesLeft ) {
          storeAddress(coords, address, storePlace);
        });
      }

    }
    
  }

  //$.mobile.changePage('#home'); //DEBUG
}

function storeAddress(coords, address, place) {
  // store in local storage
  localStorage[place + '_coords'] = coords;
  localStorage[place + '_address'] = address;
}

function resolveAddress( address , place , callback ){
  var coords = null;
  var choicesLeft;
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
        choicesLeft = true;
      } 
      else if(json.length == 1) {
        coords = json[0].coords;     
        address = json[0].name;
        choicesLeft = false;
        $('#opt_' + place).val(address);
      } 
      else {
        json.place = place;
        var addressList = Templates.addressList(json);
        $('#opt_' + place).replaceWith(addressList);
        $('#opt_' + place).selectmenu();

        // placeholder from first option to keep stuff working
        coords = json[0].coords;
        address = json[0].name;
        choicesLeft = true;
      }

      // callback with needed arguments
      callback( coords, address, choicesLeft );
    });
  }
}

function restoreOptions() {
  for(var i in PLACES) {
    var place = PLACES[i];
    $('#opt_' + place).val(localStorage[place + '_address']);
  }
}

function refreshRoute(place) {
    // get gps location
  getCurrentLocation( function(currentCoords) {

    getPositionAddress(currentCoords);

    if(localStorage[place + '_coords']) {
      var destination = localStorage[place + '_coords'].split(',')
      var page = $('#' + place + ' [data-role="content"]');
      getRoutes(currentCoords.longitude, currentCoords.latitude, destination[0], destination[1], page);
    }
  });
}


// on page init
$(document).ready( function() {
  
  console.log('pageinit'); //DEBUG

  handlebarsInit();
  
  restoreOptions();

  // Stay on page and save options
  $("#opt_save").bind("click", function (event) {
    event.preventDefault();
    saveOptions();
  });
  
  // Restore options when canceled
  $("#opt_cancel").bind("click", function (event) {    
    restoreOptions();
  });

  // Restore when opening options
  $("#options").bind('pagebeforeshow', function (event) {    
    restoreOptions();
  });

  // Refresh on buttons
  $(document).delegate('#btn_home', 'click', function(event){
      refreshRoute(HOME);
  }).delegate('#btn_work', 'click', function(event){
      refreshRoute(WORK);
  }).delegate('#btn_city', 'click', function(event){
      refreshRoute(CITY);
  });
});
