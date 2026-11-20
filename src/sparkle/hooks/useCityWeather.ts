import useSWR from 'swr';

export interface CityWeatherSnapshot {
  temp: number;
  condition: 'cloudy' | 'sunny' | 'rain';
  conditionLabel: string;
  summary: string;
  humidity: number;
  wind: string;
  hourly: Array<{ time: string; temp: number; rain: number }>;
  daily: Array<{ day: string; icon: 'rain' | 'partly' | 'sunny'; high: number; low: number; rain: number }>;
  updatedAt: number;
}

interface OpenMeteoForecast {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: Array<number | null>;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: Array<number | null>;
  };
}

/** Coordinates for every city offered in the weather widget. */
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  hanoi: { lat: 21.0285, lon: 105.8542 },
  hcmc: { lat: 10.8231, lon: 106.6297 },
  danang: { lat: 16.0544, lon: 108.2022 },
};

/** How often the live weather is re-fetched while the app is open. */
export const WEATHER_REFRESH_MS = 2 * 60 * 1000;
const WEATHER_TIME_ZONE = 'Asia/Bangkok';

function conditionFromCode(code: number): CityWeatherSnapshot['condition'] {
  if (code >= 51) return 'rain';
  if (code <= 1) return 'sunny';
  return 'cloudy';
}

function conditionLabelFromCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code < 50) return 'Fog';
  if (code >= 51 && code < 60) return 'Drizzle';
  if (code >= 61 && code < 70) return 'Rain';
  if (code >= 70 && code < 80) return 'Snow';
  if (code >= 80 && code < 90) return 'Rain showers';
  if (code >= 90) return 'Thunderstorms';
  return 'Cloudy';
}

function dailyIconFromCode(code: number): CityWeatherSnapshot['daily'][number]['icon'] {
  if (code >= 51) return 'rain';
  if (code <= 1) return 'sunny';
  return 'partly';
}

function buildForecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: WEATHER_TIME_ZONE,
    forecast_days: '5',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function fetchCityWeather(cityId: string): Promise<CityWeatherSnapshot> {
  const coords = CITY_COORDINATES[cityId];
  if (!coords) throw new Error(`No coordinates for city "${cityId}"`);
  const response = await fetch(buildForecastUrl(coords.lat, coords.lon), { cache: 'no-store' });
  if (!response.ok) throw new Error('Weather forecast is temporarily unavailable');
  const forecast = (await response.json()) as OpenMeteoForecast;

  const currentHour = forecast.current.time.slice(0, 13);
  const currentIndex = Math.max(
    0,
    forecast.hourly.time.findIndex((time) => time.slice(0, 13) >= currentHour)
  );
  const hourly = forecast.hourly.time.slice(currentIndex, currentIndex + 5).map((time, index) => ({
    time: new Date(`${time}:00+07:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      timeZone: WEATHER_TIME_ZONE,
    }),
    temp: Math.round(forecast.hourly.temperature_2m[currentIndex + index] ?? 0),
    rain: Math.round(forecast.hourly.precipitation_probability[currentIndex + index] ?? 0),
  }));
  const daily = forecast.daily.time.slice(0, 5).map((date, index) => ({
    day: new Date(`${date}T12:00:00+07:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: WEATHER_TIME_ZONE,
    }),
    icon: dailyIconFromCode(forecast.daily.weather_code[index] ?? 0),
    high: Math.round(forecast.daily.temperature_2m_max[index] ?? 0),
    low: Math.round(forecast.daily.temperature_2m_min[index] ?? 0),
    rain: Math.round(forecast.daily.precipitation_probability_max[index] ?? 0),
  }));

  return {
    temp: Math.round(forecast.current.temperature_2m),
    condition: conditionFromCode(forecast.current.weather_code),
    conditionLabel: conditionLabelFromCode(forecast.current.weather_code),
    summary: `Feels like ${Math.round(forecast.current.apparent_temperature)}°C · Live`,
    humidity: forecast.current.relative_humidity_2m,
    wind: `${Math.round(forecast.current.wind_speed_10m)} km/h`,
    hourly,
    daily,
    updatedAt: Date.now(),
  };
}

/** Live weather for the selected city, refreshed automatically while the app is open. */
export function useCityWeather(cityId: string) {
  const key = CITY_COORDINATES[cityId] ? ['city-live-weather', cityId] : null;
  return useSWR<CityWeatherSnapshot>(key, () => fetchCityWeather(cityId), {
    refreshInterval: WEATHER_REFRESH_MS,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    keepPreviousData: true,
    dedupingInterval: 30 * 1000,
  });
}
