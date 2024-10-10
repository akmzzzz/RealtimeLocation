// Declare unityInstance in the global scope if not already defined
var unityInstance;

// Previous position and time to check for fluctuations
var previousPosition = null;
var previousTimestamp = null;

// Threshold values
var MAX_SPEED_MPS = 50; // Maximum speed in meters per second (e.g., 180 km/h)
var MAX_ACCURACY = 100; // Maximum acceptable accuracy in meters

// Function to calculate distance between two coordinates using the Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371e3; // Earth radius in meters
  var φ1 = (lat1 * Math.PI) / 180;
  var φ2 = (lat2 * Math.PI) / 180;
  var Δφ = ((lat2 - lat1) * Math.PI / 180);
  var Δλ = ((lon2 - lon1) * Math.PI / 180);
  var a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance; // in meters
}

function updateLocationDisplay(position) {
  var latitude = position.coords.latitude;
  var longitude = position.coords.longitude;
  var accuracy = position.coords.accuracy || 0; // Default to 0 if not available
  var heading = position.coords.heading || 0; // Default to 0 if not available
  var speed = position.coords.speed || 0; // Default to 0 if not available

  var currentTimestamp = Date.now();

  // If this is the first update, accept the position regardless of accuracy
  if (!previousPosition) {
    console.log("First position update received.");
  } else {
    // Ignore updates with poor accuracy
    if (accuracy > MAX_ACCURACY) {
      console.warn("Ignoring position update due to low accuracy:", accuracy, "meters");
      return;
    }

    // Compute distance and time difference
    var distance = haversineDistance(
      previousPosition.coords.latitude,
      previousPosition.coords.longitude,
      latitude,
      longitude
    );

    var timeDiff = (currentTimestamp - previousTimestamp) / 1000; // in seconds

    if (timeDiff > 0) {
      // Compute speed in m/s
      var computedSpeed = distance / timeDiff;

      // If speed is too high, ignore this update
      if (computedSpeed > MAX_SPEED_MPS) {
        console.warn(
          "Ignoring position update due to high computed speed:",
          computedSpeed.toFixed(2),
          "m/s"
        );
        return;
      }
    } else {
      console.warn(
        "Time difference is zero or negative, ignoring update to prevent division by zero"
      );
      return;
    }
  }

  // Update the previous position and timestamp
  previousPosition = position;
  previousTimestamp = currentTimestamp;

  // Update the HTML elements with the obtained coordinates and additional info
  if (document.getElementById("latitude")) {
    document.getElementById("latitude").innerText = latitude.toFixed(6);
  }
  if (document.getElementById("longitude")) {
    document.getElementById("longitude").innerText = longitude.toFixed(6);
  }
  if (document.getElementById("accuracy")) {
    document.getElementById("accuracy").innerText = accuracy.toFixed(2);
  }
  if (document.getElementById("heading")) {
    document.getElementById("heading").innerText = heading.toFixed(2);
  }
  if (document.getElementById("speed")) {
    document.getElementById("speed").innerText = speed.toFixed(2);
  }

  // Log the coordinates to the console for debugging
  console.log(
    "Latitude: " +
      latitude +
      ", Longitude: " +
      longitude +
      ", Accuracy: " +
      accuracy +
      ", Heading: " +
      heading +
      ", Speed: " +
      speed
  );

  // Send the location data to Unity
  var locationString =
    latitude +
    "," +
    longitude +
    "," +
    accuracy +
    "," +
    heading +
    "," +
    speed;

  // Check if unityInstance is defined
  if (typeof unityInstance !== "undefined" && unityInstance != null) {
    try {
      unityInstance.SendMessage(
        "WebGLGPSManager",
        "UpdateLocationFromJS",
        locationString
      );
      console.log("Location data sent to Unity: " + locationString);
    } catch (e) {
      console.error("Error sending location data to Unity:", e);
    }
  } else {
    console.error(
      "unityInstance is not defined. Unable to send data to Unity."
    );
  }
}

function handleError(error) {
  console.error("Error obtaining geolocation: ", error);
  if (document.getElementById("location-display")) {
    document.getElementById("location-display").innerText =
      "Error obtaining geolocation: " + error.message;
  }
}

function getLocation() {
  if (navigator.geolocation) {
    // Continuously watch the position for updates
    navigator.geolocation.watchPosition(updateLocationDisplay, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 27000,
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
    if (document.getElementById("location-display")) {
      document.getElementById("location-display").innerText =
        "Geolocation is not supported by this browser.";
    }
  }
}

// Initialize getLocation after the Unity instance is ready
function onUnityInstanceInitialized(instance) {
  unityInstance = instance;
  getLocation();
}
