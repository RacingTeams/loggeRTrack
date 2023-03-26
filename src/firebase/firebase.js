import {doc, getFirestore, setDoc} from 'firebase/firestore';
import {initializeApp} from 'firebase/app';
import {getDatabase, ref, set} from 'firebase/database';

// $FIREBASE_TOKEN= "1//09ouc-LuBvYvxCgYIARAAGAkSNwF-L9IrZ7z5XxOPqEydiT14Dt5J0yBSR2BNPgsBDGLk1q2xEk49lKcofC22nfAIrGOtWaHwIwk"

const firebaseConfig = {
  apiKey: 'AIzaSyAryKPLZir8Gw3nuQmw6Run-rsI_aOvBw4',
  authDomain: 'racing-teams.firebaseapp.com',
  projectId: 'racing-teams',
  storageBucket: 'racing-teams.appspot.com',
  messagingSenderId: '982715894258',
  appId: '1:982715894258:web:ecf578ca5170578640c36b',
  measurementId: 'G-SB3XCK6V4S',
  databaseURL:
    'https://racing-teams-default-rtdb.europe-west1.firebasedatabase.app/',
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDB = getFirestore();
const rtDB = getDatabase();

const writeRtDB = (teamId, userId, value) => {
  set(ref(rtDB, `${teamId}/${userId}/`), value);
};

const writeFirestoreDBRealtime = async (
  teamId,
  userId,
  acquiringUID,
  value,
) => {
  const coords = {
    latitude: value.coords.latitude,
    longitude: value.coords.longitude,
    accuracy: value.coords.accuracy,
    altitude: value.coords.altitude,
    altitudeAccuracy: value.coords.altitudeAccuracy,
    heading: value.coords.heading,
    speed: value.coords.speed,
  };
  const docRef = doc(
    firestoreDB,
    teamId,
    userId,
    'mobileGPSRealtimeAcquisition',
    acquiringUID,
  );
  try {
    await setDoc(docRef, {timestamp: value.timestamp, coords}, {merge: true});
  } catch (error) {
    console.log('🚀 ~ file: firebase.js:31 ~ writeFirestoreDB ~ error:', error);
  }
};
const writeFirestoreDB = async (teamId, userId, acquiringUID, value) => {
  const coords = {
    latitude: value.coords.latitude,
    longitude: value.coords.longitude,
    accuracy: value.coords.accuracy,
    altitude: value.coords.altitude,
    altitudeAccuracy: value.coords.altitudeAccuracy,
    heading: value.coords.heading,
    speed: value.coords.speed,
  };
  const docRef = doc(
    firestoreDB,
    teamId,
    userId,
    'mobileGPSAcquisition',
    acquiringUID,
  );
  try {
    await setDoc(docRef, {[value.timestamp]: coords}, {merge: true});
  } catch (error) {
    console.log('🚀 ~ file: firebase.js:78 ~ writeFirestoreDB ~ error:', error);
  }
};

export {
  firebaseConfig,
  firestoreDB as db,
  firebaseApp,
  writeRtDB,
  writeFirestoreDB,
  writeFirestoreDBRealtime,
};
