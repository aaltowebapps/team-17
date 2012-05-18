// Gets the current coordinates and passes them to the callback function.
function getCurrentLocation(callback) {
   if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
         callback(position.coords);
       });
    }
    else {
       throw new Error("Your browser does not support geolocation.");
    }
}