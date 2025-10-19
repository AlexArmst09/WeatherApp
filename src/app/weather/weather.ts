import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
}

interface ForecastData {
  list: Array<{
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
  }>;
}

@Component({
  selector: 'app-weather',
  imports: [CommonModule, FormsModule],
  templateUrl: './weather.html',
  styleUrl: './weather.css'
})
export class Weather {
  private http = inject(HttpClient);
  
  city: string = 'Birmingham';
  state: string = 'Alabama';
  weather: WeatherData | null = null;
  forecast: ForecastData | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  
  private apiKey: string = '348c09e1529948a81ce3187fc970f4ae';
  private apiUrl: string = 'https://api.openweathermap.org/data/2.5/weather';
  private forecastUrl: string = 'https://api.openweathermap.org/data/2.5/forecast';

  getWeather(): void {
    if (!this.city.trim()) {
      this.errorMessage = 'Please enter a city name';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    let query = this.city.trim();
    if (this.state.trim()) {
      const stateCode = this.getStateCode(this.state.trim());
      query += `,${stateCode},US`;
    }
    
    const weatherUrl = `${this.apiUrl}?q=${query}&appid=${this.apiKey}&units=imperial`;
    const forecastApiUrl = `${this.forecastUrl}?q=${query}&appid=${this.apiKey}&units=imperial`;
    
    // Get current weather
    this.http.get<WeatherData>(weatherUrl).subscribe({
      next: (data) => {
        this.weather = data;
        
        // Get forecast data
        this.http.get<ForecastData>(forecastApiUrl).subscribe({
          next: (forecastData) => {
            this.forecast = forecastData;
            this.loading = false;
          },
          error: (error) => {
            console.log('Forecast Error:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 404) {
          this.errorMessage = 'City not found. Please try another city.';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid API key. Please check your API key.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again.';
        }
        this.weather = null;
        this.forecast = null;
      }
    });
  }

  // Get hourly forecast data (interpolated from 3-hour data)
  get next24Hours() {
    if (!this.forecast || this.forecast.list.length === 0) return [];
    
    const hourlyData = [];
    const forecastList = this.forecast.list.slice(0, 9); // Get first 27 hours of 3-hour data
    
    // For each 3-hour interval, create interpolated hourly data
    for (let i = 0; i < forecastList.length - 1; i++) {
      const current = forecastList[i];
      const next = forecastList[i + 1];
      
      // Add the actual data point
      hourlyData.push(current);
      
      // Interpolate 2 hours between current and next
      if (hourlyData.length < 24) {
        const tempDiff = next.main.temp - current.main.temp;
        
        for (let hour = 1; hour <= 2; hour++) {
          if (hourlyData.length >= 24) break;
          
          const interpolatedTemp = current.main.temp + (tempDiff * (hour / 3));
          hourlyData.push({
            dt: current.dt + (hour * 3600),
            dt_txt: '',
            main: {
              temp: interpolatedTemp
            },
            weather: current.weather // Use same weather description
          });
        }
      }
    }
    
    return hourlyData.slice(0, 24);
  }

  // Format time from timestamp
  formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  }

  private getStateCode(state: string): string {
    const stateCodes: { [key: string]: string } = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY'
    };

    const lowerState = state.toLowerCase().trim();
    
    if (state.length === 2) {
      return state.toUpperCase();
    }
    
    return stateCodes[lowerState] || state.toUpperCase();
  }
}