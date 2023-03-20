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

import {
  GeolocationReturnType,
  GeolocationError,
  GeolocationWatchOptions,
  Geolocation,
} from '@react-native-community/geolocation';

const enableAquiring = false;

const GPSLogger = () => {
    const [location, setLocation] = useState<GeolocationReturnType>({});
    const [timeStamp, setTimeStamp] = useState<number | null>(null);
    const [geolocationWatcherId, setGeolocationWatcherId] = useState<number | null>(null);
    const [error, setError] = useState<string>("");
    const [wakeLock, setWakeLock] = useState(null);
    const [isAcquiring, setIsAcquiring] = useState<string>("");
    const [info, setInfo] = useState<string>("");
    const [geolocation, setGeolocation] = useState<GeolocationReturnType>({});
    const [acquiringUID, setAcquiringUID] = useState<string>(
      new Date().getTime().toString()
    );
    const [name, setName] = useState<string>("");

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
    Geolocation.requestAuthorization();
    Geolocation.setRNConfiguration({ skipPermissionRequests: true });
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

    Geolocation.clearWatch(geolocationWatcherId);
    setGeolocationWatcherId(null);
    setGeolocationWatcherId(setInterval(getLocation, 250));

    // lock screen
    setLock();
  };

  const startWatchingLocation = async () => {
    stopAcquiringLocation();
    setIsAcquiring("watching");
    printInfo("Started Watching Location", setInfo);
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            (position) => {
              setLocation(position.coords);
              setTimeStamp(position.timestamp);
              setGeolocation(position);
            },
            (error) => onPositionError(setError, error),
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 1000,
            }
          );
          setGeolocationWatcherId(
            Geolocation.watchPosition(
              (position) => {
                setLocation(position.coords);
                setTimeStamp(position.timestamp);
                setGeolocation(position);
              },
              (error) => onPositionError(setError, error),
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000,
              }
            )
          );
          setLock();
        } else {
          printInfo("Location permission denied", setInfo);
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      Geolocation.requestAuthorization();
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: "whenInUse",
      });
      Geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          setTimeStamp(position.timestamp);
          setGeolocation(position);
        },
        (error) => onPositionError(setError, error),
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
        }
      );
      setGeolocationWatcherId(
        Geolocation.watchPosition(
          (position) => {
            setLocation(position.coords);
            setTimeStamp(position.timestamp);
            setGeolocation(position);
          },
          (error) => onPositionError(setError, error),
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 1000,
          }
        )
      );
      setLock();
    }
  };
  
