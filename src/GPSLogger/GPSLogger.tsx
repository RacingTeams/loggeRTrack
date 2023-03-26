/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import {
  GeoPosition,
  getCurrentPosition,
  stopObserving,
  watchPosition,
  GeoWatchOptions,
  clearWatch,
} from 'react-native-geolocation-service';
import {
  onCurrentPosition,
  onPositionError,
  printInfo,
  requestLocationPermission,
} from './helpers';
import {writeFirestoreDB, writeFirestoreDBRealtime} from '../firebase/firebase';
import {activateKeepAwake, deactivateKeepAwake} from 'expo-keep-awake';

const GEOLOCATION_OPTIONS: GeoWatchOptions = {
  enableHighAccuracy: true,
  distanceFilter: 0,
  interval: 1000,
  fastestInterval: 1000,
  showLocationDialog: true,
  forceRequestLocation: true,
  useSignificantChanges: false,
  forceLocationManager: false,
  showsBackgroundLocationIndicator: true,
};

const App = () => {
  const [timeStamp, setTimeStamp] = useState(null);
  const [geolocationWatcherId, setGeolocationWatcherId] = useState<number>(0);
  const [error, setError] = useState('');
  const [isAcquiring, setIsAcquiring] = useState('');
  const [, setInfo] = useState('');
  const [geolocation, setGeolocation] = useState<GeoPosition | null>(null);
  const [acquiringUID, setAcquiringUID] = useState(
    new Date().getTime().toString(),
  );
  const [name, setName] = useState('');

  useEffect(() => {
    // write to firebase realtime database
    if (acquiringUID && geolocation?.timestamp) {
      writeFirestoreDBRealtime(
        'testDevTeam',
        'testDevUser',
        name ? name + '-' + acquiringUID : acquiringUID,
        geolocation,
      );
      writeFirestoreDB(
        'testDevTeam',
        'testDevUser',
        name ? name + '-' + acquiringUID : acquiringUID,
        geolocation,
      );
    }
  }, [geolocation, acquiringUID, name]);

  useEffect(() => {
    geolocationWatcherId ?? setAcquiringUID(new Date().getTime().toString());
  }, [geolocationWatcherId]);

  const stopAcquiringLocation = useCallback(() => {
    if (geolocationWatcherId) {
      printInfo('Stopped Acquiring Location', setInfo);
      setIsAcquiring('');

      clearInterval(geolocationWatcherId);
      setGeolocationWatcherId(0);

      deactivateKeepAwake();
    }

    return () => {
      if (geolocationWatcherId) {
        clearWatch(geolocationWatcherId);
      }
    };
  }, [geolocationWatcherId]);

  useEffect(() => {
    error && stopAcquiringLocation();
  }, [error, stopAcquiringLocation]);

  const startAcquiringLocation = async () => {
    printInfo('Started Acquiring Location', setInfo);
    setIsAcquiring('polling');

    stopObserving();
    setGeolocationWatcherId(setInterval(getLocation, 250));

    activateKeepAwake();
  };

  const startWatchingLocation = async () => {
    stopAcquiringLocation();
    setIsAcquiring('watching');
    printInfo('Started Watching Location', setInfo);
    getCurrentPosition(
      () => {},
      () => {},
      GEOLOCATION_OPTIONS,
    );
    setGeolocationWatcherId(
      watchPosition(
        onCurrentPosition(setGeolocation, setTimeStamp, setGeolocation),
        onPositionError(setError),
        GEOLOCATION_OPTIONS,
      ),
    );
    activateKeepAwake();
  };

  const stopWatchingLocation = () => {
    setIsAcquiring('');
    printInfo('Stopped Watching Location', setInfo);
    stopObserving();
    clearInterval(geolocationWatcherId);
    setGeolocationWatcherId(0);
    deactivateKeepAwake();
  };

  const getLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      // console.log('res is:', res);
      if (res) {
        getCurrentPosition(
          position => {
            // console.log(position);
            setGeolocation(position);
          },
          err => {
            // See err code charts below.
            console.log(err.code, err.message);
            setGeolocation(null);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      }
    });
    // console.log(geolocation);
  };

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
        }}>
        <View
          style={{
            padding: 10,
            margin: 20,
          }}>
          <Text style={{color: 'blue', fontSize: 24}}>GPS Logger</Text>
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 20,
          }}>
          <TextInput
            onChangeText={value => setName(value)}
            id="session-name"
            placeholder="Session name"
          />
        </View>
        <Text style={{color: 'blue', fontSize: 16}}>
          Lat: {geolocation ? geolocation.coords.latitude : 0}
        </Text>
        <Text style={{color: 'blue', fontSize: 16}}>
          Long: {geolocation ? geolocation.coords.longitude : 0}
        </Text>
        <Text style={{color: 'blue', fontSize: 16}}>
          Acc: {geolocation ? geolocation.coords.accuracy : 0}
        </Text>
        <Text style={{color: 'blue', fontSize: 16}}>
          Head: {geolocation ? geolocation.coords.heading : 0} °North
        </Text>
        <Text style={{color: 'blue', fontSize: 16}}>
          Speed: {geolocation ? geolocation.coords.speed : 0} m/s
        </Text>
        <Text style={{color: 'blue', fontSize: 16}}>
          Timestamp: {timeStamp || 0} s
        </Text>
        <View style={{flexDirection: 'row', marginTop: 20}}>
          {isAcquiring === '' && (
            <TouchableOpacity
              style={{
                backgroundColor: 'green',
                padding: 10,
                width: 200,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={startAcquiringLocation}>
              <Text style={{color: 'white', fontSize: 16}}>
                {'Start acquiring location'}
              </Text>
            </TouchableOpacity>
          )}
          {isAcquiring === 'polling' && (
            <TouchableOpacity
              style={{
                backgroundColor: 'red',
                padding: 10,
                width: 200,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={stopAcquiringLocation}>
              <Text style={{color: 'white', fontSize: 16}}>
                {'Stop acquiring location'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{flexDirection: 'row', marginVertical: 20}}>
          {isAcquiring === '' && (
            <TouchableOpacity
              disabled={!name}
              style={{
                backgroundColor: 'blue',
                padding: 20,
                width: 200,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={startWatchingLocation}>
              <Text style={{color: 'white', fontSize: 16}}>
                {'Start watching location'}
              </Text>
            </TouchableOpacity>
          )}
          {isAcquiring === 'watching' && (
            <TouchableOpacity
              style={{
                backgroundColor: 'red',
                padding: 20,
                width: 200,
                height: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={stopWatchingLocation}>
              <Text style={{color: 'white', fontSize: 16}}>
                {'Stop watching location'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default App;
