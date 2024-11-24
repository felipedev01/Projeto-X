import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Button, View, Text } from 'react-native';
import { Audio } from 'expo-av';
import React, { useState, useEffect } from 'react';

const GEOFENCE_TASK_NAME = 'GEOFENCE_TASK';

// Definindo o tipo para a localização
type GeofenceRegion = {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
};

// Função para carregar e tocar o som de alarme
const playAlarmSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(require('../../assets/alarm.mp3'));
    await sound.playAsync();
  } catch (error) {
    console.error('Erro ao tocar o som de alarme:', error);
  }
};

// Registrando a tarefa de geofencing em segundo plano
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
  if (error) {
    console.error('Erro na tarefa de geofencing:', error.message);
    return;
  }
  
  if (data) {
    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: GeofenceRegion;
    };
    console.log('Geofencing event:', eventType, region);
    
    if (eventType === Location.GeofencingEventType.Enter) {
      // Registra o ponto quando o usuário entra na região
      Alert.alert('Ponto registrado', `Você entrou na região ${region.identifier}`);
      await playAlarmSound(); // Tocar alarme quando o ponto for registrado
      // Aqui você pode adicionar a lógica para registrar o ponto no backend
    }
  } else {
    console.error('Dados de geofencing inválidos:', data);
  }
});

// Função para truncar coordenadas para 4 casas decimais
const truncateCoordinate = (value: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// Componente principal que mantém a região do Geofencing
const GeofenceComponent: React.FC = () => {
  const [region, setRegion] = useState<GeofenceRegion | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  // Função para definir a localização atual como ponto de geofencing
  const setGeofenceLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permissão de localização é necessária para definir o ponto.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
    const newRegion: GeofenceRegion = {
      identifier: 'WorkLocation',
      latitude: truncateCoordinate(location.coords.latitude, 4),
      longitude: truncateCoordinate(location.coords.longitude, 4),
      radius: 5, // Raio reduzido para aumentar a precisão do geofencing
    };
    setRegion(newRegion);
    Alert.alert(
      'Localização definida',
      `A localização do ponto foi definida com sucesso: Latitude ${newRegion.latitude}, Longitude ${newRegion.longitude}`
    );
  };

  // Função para iniciar o monitoramento de geofencing
  const startGeofencing = async () => {
    if (!region) {
      Alert.alert('Erro', 'Por favor, defina a localização do ponto antes de iniciar o monitoramento.');
      return;
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permissão de localização em segundo plano é necessária para registrar o ponto automaticamente.');
      return;
    }

    // Inicia o monitoramento da região definida
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [region]);
    Alert.alert('Monitoramento iniciado', 'O monitoramento da região do ponto foi iniciado com sucesso.');
  };

  // Monitorar a localização em tempo real
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permissão de localização é necessária para monitorar a localização em tempo real.');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
        (location) => {
          setCurrentLocation(location);
        }
      );
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return (
    <View>
      <Button title="Definir Localização do Ponto" onPress={setGeofenceLocation} />
      <Button title="Iniciar Monitoramento do Ponto" onPress={startGeofencing} />
      {currentLocation && (
        <Text>
          Localização Atual: Latitude {currentLocation.coords.latitude.toFixed(4)}, Longitude {currentLocation.coords.longitude.toFixed(4)}
        </Text>
      )}
      {region && (
        <Text>
          Ponto Fixo: Latitude {region.latitude.toFixed(4)}, Longitude {region.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
};

export default GeofenceComponent;
