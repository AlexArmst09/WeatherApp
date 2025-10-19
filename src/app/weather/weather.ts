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
  loading: boolean = false;
  errorMessage: string = '';
  
  private apiKey: string = '348c09e1529948a81ce3187fc970f4ae';
  private apiUrl: string = 'https://api.openweathermap.org/data/2.5/weather';

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
  
  const url = `${this.apiUrl}?q=${query}&appid=${this.apiKey}&units=imperial`;
  
  // DEBUG: Log the URL to console
  console.log('API URL:', url);
  console.log('Query:', query);
  
  this.http.get<WeatherData>(url).subscribe({
    next: (data) => {
      console.log('Response:', data);
      this.weather = data;
      this.loading = false;
    },
    error: (error) => {
      console.log('Error:', error);
      this.loading = false;
      if (error.status === 404) {
        this.errorMessage = 'City not found. Please try another city.';
      } else if (error.status === 401) {
        this.errorMessage = 'Invalid API key. Please check your API key.';
      } else {
        this.errorMessage = 'Something went wrong. Please try again.';
      }
      this.weather = null;
    }
  });
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