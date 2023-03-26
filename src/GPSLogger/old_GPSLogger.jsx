import React, { useEffect, useState, useCallback } from "react";
import { Alert, Box, Stack, TextField, Typography } from "@mui/material";
import { Button, Grid } from "@mui/material";
import {
  writeFirestoreDB,
  writeFirestoreDBRealtime,
} from "../../config/firebase";
import {
  getLocation,
  onCurrentPosition,
  onPositionError,
  printInfo,
  releaseLock,
} from "./helpers";

const enableAquiring = false;

const GPSLogger = () => {
  const [location, setLocation] = useState({});
  const [timeStamp, setTimeStamp] = useState(null);
  const [geolocationWatcherId, setGeolocationWatcherId] = useState(null);
  const [error, setError] = useState("");
  const [wakeLock, setWakeLock] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState("");
  const [info, setInfo] = useState("");
  const [geolocation, setGeolocation] = useState({});
  const [acquiringUID, setAcquiringUID] = useState(
    new Date().getTime().toString()
  );
  const [name, setName] = useState("");

  useEffect(() => {
    // write to firebase realtime database
    if (acquiringUID && geolocation?.timestamp) {
      writeFirestoreDBRealtime(
        "testDevTeam",
        "testDevUser",
        name ? name + "-" + acquiringUID : acquiringUID,
        geolocation
      );
      writeFirestoreDB(
        "testDevTeam",
        "testDevUser",
        name ? name + "-" + acquiringUID : acquiringUID,
        geolocation
      );
    }
  }, [geolocation, acquiringUID]); // eslint-disable-line

  useEffect(() => {
    geolocationWatcherId ?? setAcquiringUID(new Date().getTime().toString());
  }, [geolocationWatcherId]);

  const setLock = async () => {
    try {
      setWakeLock(await navigator.wakeLock.request("screen"));
      printInfo("Wake Lock is active!", setInfo);
    } catch (err) {
      printInfo(err.message, setInfo);
    }
  };

  useEffect(() => {
    if (navigator.wakeLock) {
      printInfo("Screen Wake Lock API supported!", setInfo);
    } else {
      printInfo("Screen Wake Lock API not supported!", setInfo);
    }
  }, []);

  const stopAcquiringLocation = useCallback(() => {
    printInfo("Stopped Acquiring Location", setInfo);
    setIsAcquiring("");

    clearInterval(geolocationWatcherId);
    setGeolocationWatcherId(null);

    releaseLock(wakeLock, setWakeLock, setError);
  }, [geolocationWatcherId, wakeLock]);

  useEffect(() => {
    error && stopAcquiringLocation();
  }, [error, stopAcquiringLocation]);

  const startAcquiringLocation = async () => {
    printInfo("Started Acquiring Location", setInfo);
    setIsAcquiring("polling");

    navigator.geolocation.clearWatch(geolocationWatcherId);
    setGeolocationWatcherId(null);
    setGeolocationWatcherId(setInterval(getLocation, 250));

    // lock screen
    setLock();
  };

  const startWatchingLocation = async () => {
    stopAcquiringLocation();
    setIsAcquiring("watching");
    printInfo("Started Watching Location", setInfo);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {});
      setGeolocationWatcherId(
        navigator.geolocation.watchPosition(
          onCurrentPosition(setLocation, setTimeStamp, setGeolocation),
          onPositionError(setError),
          {
            maximumAge: 5000,
            timeout: 30000,
            enableHighAccuracy: true,
          }
        )
      );
      // lock screen
      setLock();
    } else {
      printInfo("Geolocation is not supported by this browser.", setInfo);
    }
  };

  const stopWatchingLocation = () => {
    setIsAcquiring("");
    printInfo("Stopped Watching Location", setInfo);
    navigator.geolocation.clearWatch(geolocationWatcherId);
    setGeolocationWatcherId(null);
    releaseLock(wakeLock, setWakeLock, setError);
  };

  return (
    <Grid
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "100vh",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            padding: "10px",
            margin: "20px",
          }}
        >
          <Typography color="primary" variant="h4">
            GPS Logger
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
          margin={5}
        >
          <TextField
            onChange={(e) => setName(e.target.value)}
            color="primary"
            id="session-name"
            label="Session name"
            required
          />
        </Box>
        <Typography color="primary" variant="body1">
          Lat: {location.latitude || 0}
        </Typography>
        <Typography color="primary" variant="body1">
          Long: {location.longitude || 0}
        </Typography>
        <Typography color="primary" variant="body1">
          Acc: {location.accuracy || 0}
        </Typography>
        <Typography color="primary" variant="body1">
          Head: {location.heading || 0} °North
        </Typography>
        <Typography color="primary" variant="body1">
          Speed: {location.speed || 0} m/s
        </Typography>
        <Typography color="primary" variant="body1">
          Timestamp: {timeStamp || 0} s
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          marginTop={2}
        >
          {enableAquiring && isAcquiring === "" && (
            <Button
              sx={{
                backgroundColor: "green",
                padding: "10px",
                width: "200",
                height: "60px",
              }}
              onClick={startAcquiringLocation}
            >
              <Typography variant="button">
                {"Start acquiring location"}
              </Typography>
            </Button>
          )}
          {enableAquiring && isAcquiring === "polling" && (
            <Button
              size="large"
              sx={{
                backgroundColor: "red",
                padding: "10px",
                width: "200",
                height: "60px",
              }}
              onClick={stopAcquiringLocation}
            >
              <Typography variant="button">
                {"Stop acquiring location"}{" "}
              </Typography>
            </Button>
          )}
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} margin={2}>
          {isAcquiring === "" && (
            <Button
              disabled={!name}
              variant="outlined"
              sx={{
                backgroundColor: "primary",
                padding: "20px",
                width: "200",
                height: "60px",
              }}
              onClick={startWatchingLocation}
            >
              <Typography variant="button">
                {"Start watching location"}
              </Typography>
            </Button>
          )}
          {isAcquiring === "watching" && (
            <Button
              size="large"
              sx={{
                backgroundColor: "red",
                padding: "10px",
                width: "200",
                height: "60px",
              }}
              onClick={stopWatchingLocation}
            >
              <Typography variant="button">
                {"Stop watching location"}
              </Typography>
            </Button>
          )}
        </Stack>
        <Box sx={{ height: "60px" }}>
          {info && (
            <Alert hidden={!info} severity="info">
              Info: {info}
            </Alert>
          )}
          {error && (
            <Alert hidden={!error} severity="error">
              Error: {error}
            </Alert>
          )}
        </Box>
      </Box>
    </Grid>
  );
};

export default GPSLogger;
