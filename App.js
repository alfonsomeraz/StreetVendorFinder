import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import locations from './fakeDatabase';

import { getDistance } from 'geolib'; // import the geolib library for calculating distance




const vendorFoodTypes = ['Tacos', 'Elotes', 'Raspados', 'Hot Dogs', 'Arepas'];


export default function App() {
  const [location, setLocation] = useState(null);
  const [selectedFoodType, setSelectedFoodType] = useState(null);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);


  const handleVendorTypeSelection = (type) => {
    setSelectedFoodType(type);
    const selectedVendor = locations.find((vendor) => vendor.type === type);
    if (selectedVendor) {
      const { name, type, latitude, longitude } = selectedVendor;
      setSelectedVendorDetails({ name, type, latitude, longitude });
  
      // Call the Google Maps Directions API here
      const startLoc = `${location.coords.latitude},${location.coords.longitude}`;
      const endLoc = `${latitude},${longitude}`;
      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${endLoc}&key=YOUR_API_KEY`;
  
      fetch(apiUrl)
        .then((response) => response.json())
        .then((responseJson) => {
          const points = Polyline.decode(responseJson.routes[0].overview_polyline.points);
          const coords = points.map((point) => {
            return {
              latitude: point[0],
              longitude: point[1],
            };
          });
          setRouteCoordinates(coords);
        })
        .catch((error) => {
          console.error('Error fetching directions:', error);
        });
  
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const handleMapRegionChange = (region) => {
    setMapRegion(region);
  };

  const handleZoomIn = () => {
    if (mapRegion) {
      setMapRegion({
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta / 2,
        longitudeDelta: mapRegion.longitudeDelta / 2,
      });
    }
  };

  const handleZoomOut = () => {
    if (mapRegion) {
      setMapRegion({
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 2,
        longitudeDelta: mapRegion.longitudeDelta * 2,
      });
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChange={handleMapRegionChange}
        >
          {locations.map((vendor) => (
            <Marker
              key={vendor.id}
              coordinate={{ latitude: vendor.latitude, longitude: vendor.longitude }}
              title={vendor.name}
              description={vendor.type}
            >
              <Image
                source={getMarkerImage(vendor.type)}
                style={{ width: 40, height: 40 }}
              />
            </Marker>
          ))}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
          >
            <Image
              source={require('./assets/person-marker.png')}
              style={{ width: 40, height: 40 }}
            />
          </Marker>
        </MapView>
      )}
      {location && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleZoomIn}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleZoomOut}>
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.locateButton}
            onPress={() =>
              setMapRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              })
            }
          >
            <Text style={styles.locateButtonText}>Locate Me</Text>
          </TouchableOpacity>
        </View>
      )}
      {location && (
        <View style={styles.panel}>
          <Text style={styles.panelText}>Select a vendor food type:</Text>
          <FlatList
            style={styles.list}
            data={vendorFoodTypes}
            horizontal={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.foodTypeButton,
                  {
                    backgroundColor:
                      selectedFoodType === item ? '#ff6347' : '#e0e0e0',
                  },
                ]}
                onPress={() => handleVendorTypeSelection(item)}
              >
                <Text style={styles.buttonText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
          />
          {selectedFoodType && (
            <Text style={styles.selectedFoodType}>
              Selected Food Type: {selectedFoodType}
            </Text>
          )}
        </View>
      )}
      {selectedVendorDetails && (
        <View style={styles.panel}>
          <Text style={styles.panelText}>Vendor Details:</Text>
          <Text>Name: {selectedVendorDetails.name}</Text>
          <Text>Type: {selectedVendorDetails.type}</Text>
          <Text>Latitude: {selectedVendorDetails.latitude}</Text>
          <Text>Longitude: {selectedVendorDetails.longitude}</Text>
        </View>
      )}
      <View style={styles.panelSelection}>
        <Text style={styles.panelText}>Select a vendor food type:</Text>
        <FlatList
          style={styles.list}
          data={vendorFoodTypes}
          horizontal={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.foodTypeButton,
                {
                  backgroundColor:
                    selectedFoodType === item ? '#ff6347' : '#e0e0e0',
                },
              ]}
              onPress={() => handleVendorTypeSelection(item)}
            >
              <Text style={styles.buttonText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    minHeight: 200, // Adjust the minimum height of the panel
  },
  panelSelection: {
    position: 'absolute',
    bottom: 200, // Adjust the position of the panel
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  panelText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10, // Add margin to separate text from details
  },
  list: {
    marginTop: 10,
    marginBottom: 10,
  },
  foodTypeButton: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedFoodType: {
    marginTop: 10,
    fontSize: 16,
  },
  buttonsContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ff6347',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
  },
  locateButton: {
    backgroundColor: '#ff6347',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  locateButtonText: {
    color: '#fff',
  },
});


function getMarkerImage(type) {
  switch (type) {
    case 'Tacos':
      return require('./assets/taco-marker.png');
    case 'Elotes':
      return require('./assets/elote-marker.png');
    case 'Raspados':
      return require('./assets/raspado-marker.png');
    case 'Hot Dogs':
      return require('./assets/hotdog-marker.png');
    case 'Arepas':
      return require('./assets/arepa-marker.png');
    default:
      return require('./assets/favicon.png');
  }
}


