import { useState, useEffect, useRef } from 'react';

interface GeoLocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoLocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: true,
  });
  
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation is not supported", loading: false }));
      return;
    }

    const success = (position: GeolocationPosition) => {
      setState({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const error = (err: GeolocationPositionError) => {
      setState(s => ({ ...s, error: err.message, loading: false }));
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Get initial position quickly
    navigator.geolocation.getCurrentPosition(success, error, options);

    // Watch for updates
    watchId.current = navigator.geolocation.watchPosition(success, error, options);

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return state;
}
