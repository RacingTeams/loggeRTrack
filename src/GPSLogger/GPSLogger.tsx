/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import {
  GeoPosition,
  getCurrentPosition,
  stopObserving,
  watchPosition,
  GeoWatchOptions,
} from 'react-native-geolocation-service';
import {onCurrentPosition, onPositionError, printInfo} from './helpers';
import {writeFirestoreDBRealtime} from '../firebase/firebase';
// import {
//   activateKeepAwake,
//   deactivateKeepAwake,
// } from '@sayem314/react-native-keep-awake';
import {TextInput, Button, Text, Stack} from '@react-native-material/core';

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

const theme = {
  primary: '#feda3b',
  secondary: '#000',
  primaryText: '#000',
  secondaryText: '#fff',
  inputBG: 'rgba(255, 255, 255, 0.15)',
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
      //       writeRtDB(
      //         'testDevTeam',
      //         'testDevUser',
      // // name ? name + '-' + acquiringUID : acquiringUID,

      //         geolocation,
      //       );
    }
  }, [geolocation, acquiringUID, name]);

  useEffect(() => {
    geolocationWatcherId ?? setAcquiringUID(new Date().getTime().toString());
  }, [geolocationWatcherId]);

  const startWatchingLocation = async () => {
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
    // activateKeepAwake();
  };

  const stopWatchingLocation = () => {
    setIsAcquiring('');
    printInfo('Stopped Watching Location', setInfo);
    stopObserving();
    clearInterval(geolocationWatcherId);
    setGeolocationWatcherId(0);
    // deactivateKeepAwake();
  };

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor: theme.secondary,
      }}>
      <Stack
        style={{
          height: '20 %',
          display: 'flex',
          justifyContent: 'center',
        }}>
        <Text color={theme.primary} variant="h4">
          GPS Data Logger
        </Text>
      </Stack>

      <Stack
        m={30}
        style={{
          backgroundColor: theme.inputBG,
          padding: 30,
          borderRadius: 18,
          width: '70 %',
        }}>
        <Text style={{color: theme.secondaryText, fontSize: 16}}>
          Lat: {geolocation ? geolocation.coords.latitude : 0}
        </Text>
        <Text style={{color: theme.secondaryText, fontSize: 16}}>
          Long: {geolocation ? geolocation.coords.longitude : 0}
        </Text>
        <Text style={{color: theme.secondaryText, fontSize: 16}}>
          Acc: {geolocation ? geolocation.coords.accuracy : 0}
        </Text>
        <Text style={{color: theme.secondaryText, fontSize: 16}}>
          Head: {geolocation ? geolocation.coords.heading : 0} °North
        </Text>
        <Text style={{color: theme.secondaryText, fontSize: 16}}>
          Speed: {geolocation ? geolocation.coords.speed : 0} m/s
        </Text>
        <Text style={{color: theme.secondaryText, fontSize: 16}}>
          Time: {timeStamp || 0} s
        </Text>
      </Stack>

      <Stack style={{width: '70%'}} m={4}>
        <TextInput
          id="session-name"
          // label="Session name"
          onChange={e => setName(e.nativeEvent.text)}
          placeholder="Session name *"
          color={theme.primary}
          variant="outlined"
          inputContainerStyle={{backgroundColor: theme.inputBG, height: 60}}
          inputStyle={{color: theme.secondaryText, height: 80}}
          helperText="The name is required for the session"
        />
      </Stack>

      <View style={{flexDirection: 'row', marginVertical: 20}}>
        <Button
          title={
            isAcquiring === 'watching' ? 'Stop acquiring' : 'Acquire GPS Data'
          }
          disabled={!name}
          titleStyle={{color: theme.primaryText}}
          style={{
            backgroundColor: theme.primary,
            minWidth: '70%',
            padding: 20,
            width: 200,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={
            isAcquiring === 'watching'
              ? stopWatchingLocation
              : startWatchingLocation
          }
        />
      </View>
    </View>
  );
};

export default App;
