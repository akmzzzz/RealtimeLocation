// Declare unityInstance in the global scope if not already defined
var unityInstance;

// Previous position and time to check for fluctuations
var previousPosition = null;
var previousTimestamp = null;

// Heading history for smoothing
var headingHistory = [];

// Threshold values
var MAX_SPEED_MPS = 50;    // Maximum speed in meters per second (e.g., 180 km/h)
var MAX_ACCURACY = 10;     // Maximum acceptable accuracy in meters
var MIN_DISTANCE = 0.5;    // Minimum distance in meters to consider an update
var MIN_TIME_DIFF_MS = 500; // Minimum time difference in milliseconds

// Function to calculate distance between two coordinates using the Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371e3; // Earth radius in meters
  var φ1 = (lat1 * Math.PI) / 180;
  var φ2 = (lat2 * Math.PI) / 180;
  var Δφ = ((lat2 - lat1) * Math.PI) / 180;
  var Δλ = ((lon2 - lon1) * Math.PI) / 180;
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
  var heading = position.coords.heading;
  var speed = position.coords.speed || 0; // Default to 0 if not available

  var currentTimestamp = Date.now();

  // If this is the first update, accept the position regardless of accuracy
  if (!previousPosition) {
    console.log("First position update received.");
    previousPosition = position;
    previousTimestamp = currentTimestamp;
  } else {
    // Time difference in milliseconds
    var timeDiff = currentTimestamp - previousTimestamp;

    // Ignore updates that are less than 500ms apart
    if (timeDiff < MIN_TIME_DIFF_MS) {
      console.log("Ignoring position update due to time interval less than 500ms");
      return;
    }

    // Compute distance
    var distance = haversineDistance(
      previousPosition.coords.latitude,
      previousPosition.coords.longitude,
      latitude,
      longitude
    );

    // Ignore updates if distance moved is less than 0.5 meters
    if (distance < MIN_DISTANCE) {
      console.log("Ignoring position update due to distance moved less than 0.5 meters");
      return;
    }

    // Ignore updates with poor accuracy
    if (accuracy > MAX_ACCURACY) {
      console.warn("Ignoring position update due to low accuracy:", accuracy, "meters");
      return;
    }
  }

  // Update the previous position and timestamp
  previousPosition = position;
  previousTimestamp = currentTimestamp;

  // Smooth heading
  var smoothedHeading = 0;
  if (typeof heading === 'number' && !isNaN(heading)) {
    // Keep a history of heading values
    headingHistory.push(heading);

    // Keep only the last 5 heading values
    if (headingHistory.length > 5) {
      headingHistory.shift(); // Remove the oldest value
    }

    // Compute average heading
    var sumHeading = headingHistory.reduce(function (a, b) {
      return a + b;
    }, 0);
    smoothedHeading = sumHeading / headingHistory.length;
  } else {
    // Heading not available; use the last smoothed heading if available
    if (headingHistory.length > 0) {
      smoothedHeading = headingHistory[headingHistory.length - 1];
    }
  }

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
    document.getElementById("heading").innerText = smoothedHeading.toFixed(2);
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
      smoothedHeading +
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
    smoothedHeading +
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
      timeout: 5000, // Lower timeout to 5 seconds
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
