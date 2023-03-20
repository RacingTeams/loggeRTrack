export const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      onCurrentPosition,
      onPositionError,
      {
        maximumAge: 5000,
        timeout: 30000,
        enableHighAccuracy: true,
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

export const onCurrentPosition =
  (setLocation, setTimeStamp, setGeolocation) => (position) => {
    setLocation(position.coords);
    setTimeStamp(position.timestamp);
    setGeolocation(position);
  };

export const onPositionError = (setError) => (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.log("User denied the request for Geolocation.");
      setError("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Location information is unavailable.");
      setError("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.log("The request to get user location timed out.");
      setError("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.log("An unknown error occurred.");
      setError("An unknown error occurred.");
      break;
    default:
      console.log("An unknown error occurred.");
      setError("An unknown error occurred.");
      break;
  }
};

export const printInfo = (msg, setInfo) => {
  setInfo(msg);
  setTimeout(() => {
    setInfo("");
  }, 3000);
};

export const releaseLock = (wakeLock, setWakeLock, setError) => {
  wakeLock?.release().then(() => {
    setWakeLock(null);
  });
  setTimeout(() => {
    setError("");
  }, 5000);
};
