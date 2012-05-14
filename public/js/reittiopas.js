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

  $.mobile.showPageLoadingMsg(); // show spinner
  $.getJSON('/reittiopas',
    { request: 'route',
      format: 'json',
      from: fromX + ',' + fromY,
      to: toX + ',' + toY,
      show: 5
    }, function(json) {
      // add routes to page
      var content = Templates.routes(json);
      page.html(content).trigger('create');
      $.mobile.hidePageLoadingMsg(); // hide spinner
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


// on page init
$(document).bind('pageinit', function() {
      
  handlebarsInit();
  
  // Bindings for options
  $("#optButton").bind("click", function(event) {    
    restoreOptions(); 
  });

  // Bindings for options save
  $("#saveOpt").bind("click", function(event) {
    saveOptions();
  });
  
  // Bindings for options  cancel
  $("#cancelOpt").bind("click", function(event) {    
    restoreOptions(); 
  });

  // Fill the content of the Home page with the routes
  var home = $('#home [data-role="content"]');
  getRoutes(2561133,6699755,2527815,6662705,home);
  
});