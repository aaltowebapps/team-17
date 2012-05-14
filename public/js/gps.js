var myLatLng;
var map;
var marker;
                
function geoLocation() {
  //Get position fast and initialized google map
  navigator.geolocation.getCurrentPosition(function(geodata) {
    localStorage.latitude = geodata.coords.latitude;
    localStorage.longitude = geodata.coords.longitude;    
  });
};
   