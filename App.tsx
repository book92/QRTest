import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { captureRef } from 'react-native-view-shot';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBtuPDLaq8rAROLCelAthvRzLA0lz3qThU',
  projectId: 'testqr-f7520',
  storageBucket: 'testqr-f7520.appspot.com',
  appId: 'com.qrcode',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const AddDevice = ({ route = { params: {} }, navigation }: any) => {
  const { setDevices } = route.params;
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceRoom, setDeviceRoom] = useState<string>('');
  const [deviceSpecs, setDeviceSpecs] = useState<string>('');
  const [qrData, setQRData] = useState<string | null>(null);
  const qrRef = useRef<View>(null);

  const handleGenerateQR = async () => {
    if (deviceName && deviceRoom && deviceSpecs) {
      const deviceInfoURL = `https://book92.github.io/ListU_AddUser/deviceinfo.html?deviceName=${encodeURIComponent(deviceName)}&deviceRoom=${encodeURIComponent(deviceRoom)}&deviceSpecs=${encodeURIComponent(deviceSpecs)}`;
      setQRData(deviceInfoURL);

      // Wait for the QR data state to update
      setTimeout(async () => {
        if (qrRef.current) {
          try {
            const uri = await captureRef(qrRef.current, {
              format: 'png',
              quality: 1.0
            });

            const refImage = storage().ref('/QR/' + Date.now() + '.png');
            await refImage.putFile(uri);
            const link = await refImage.getDownloadURL();

            firestore().collection('SERVICES').add({
              deviceName,
              deviceRoom,
              deviceSpecs,
              image: link
            })
            .then(response => {
              firestore().collection('SERVICES').doc(response.id).update({ id: response.id });
              Alert.alert('Add new service success');
              navigation.goBack();
            })
            .catch(e => Alert.alert('Add new service fail'));
          } catch (e) {
            console.log(e.message);
            Alert.alert('Error', 'Failed to upload QR code');
          }
        }
      }, 1000);
    } else {
      Alert.alert('Error', 'All fields are required to generate QR code');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Device Name</Text>
      <TextInput
        style={styles.input}
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder="Enter device name"
      />
      <Text style={styles.label}>Device Room</Text>
      <TextInput
        style={styles.input}
        value={deviceRoom}
        onChangeText={setDeviceRoom}
        placeholder="Enter device room"
      />
      <Text style={styles.label}>Device Specs</Text>
      <TextInput
        style={styles.input}
        value={deviceSpecs}
        onChangeText={setDeviceSpecs}
        placeholder="Enter device specs"
      />
      <Button title="Generate QR Code" onPress={handleGenerateQR} />
      {qrData && (
        <View style={styles.qrContainer} collapsable={false} ref={qrRef}>
          <Text>Scan this QR code:</Text>
          <QRCode value={qrData} size={200} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
  qrContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddDevice;
