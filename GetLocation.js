// Declare unityInstance in the global scope if not already defined
var unityInstance;

function updateLocationDisplay(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;

  // Update the HTML elements with the obtained coordinates
  document.getElementById('latitude').innerText = latitude.toFixed(6);
  document.getElementById('longitude').innerText = longitude.toFixed(6);

  // Log the coordinates to the console for debugging
  console.log("Latitude: " + latitude + ", Longitude: " + longitude);

  // Send the location data to Unity
  var locationString = latitude + "," + longitude;

  // Check if unityInstance is defined
  if (typeof unityInstance !== 'undefined' && unityInstance != null) {
    try {
      unityInstance.SendMessage('WebGLGPSManager', 'UpdateLocationFromJS', locationString);
      console.log("Location data sent to Unity: " + locationString);
    } catch (e) {
      console.error("Error sending location data to Unity:", e);
    }
  } else {
    console.error("unityInstance is not defined. Unable to send data to Unity.");
  }
}

function handleError(error) {
  console.error("Error obtaining geolocation: ", error);
  document.getElementById('location-display').innerText = "Error obtaining geolocation: " + error.message;
}

function getLocation() {
  if (navigator.geolocation) {
    // Continuously watch the position for updates
    navigator.geolocation.watchPosition(updateLocationDisplay, handleError, { enableHighAccuracy: true });
  } else {
    console.error("Geolocation is not supported by this browser.");
    document.getElementById('location-display').innerText = "Geolocation is not supported by this browser.";
  }
}

// Initialize getLocation after the Unity instance is ready
function onUnityInstanceInitialized(instance) {
  unityInstance = instance;
  getLocation();
}
