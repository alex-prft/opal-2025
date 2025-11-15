/**
 * Test Client Helper for Integration Tests
 * Provides utilities for making HTTP requests in tests
 */

interface RequestOptions {
  json?: any;
  body?: string;
  headers?: Record<string, string>;
}

interface TestResponse {
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

class TestClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.TEST_API_BASE_URL || 'http://localhost:3000';
  }

  async get(path: string, options: RequestOptions = {}): Promise<TestResponse> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    return this.createTestResponse(response);
  }

  async post(path: string, options: RequestOptions = {}): Promise<TestResponse> {
    const url = `${this.baseUrl}${path}`;

    let body: string | undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (options.json) {
      body = JSON.stringify(options.json);
    } else if (options.body) {
      body = options.body;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    return this.createTestResponse(response);
  }

  async put(path: string, options: RequestOptions = {}): Promise<TestResponse> {
    const url = `${this.baseUrl}${path}`;

    let body: string | undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (options.json) {
      body = JSON.stringify(options.json);
    } else if (options.body) {
      body = options.body;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body
    });

    return this.createTestResponse(response);
  }

  async delete(path: string, options: RequestOptions = {}): Promise<TestResponse> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    return this.createTestResponse(response);
  }

  private createTestResponse(response: Response): TestResponse {
    return {
      status: response.status,
      json: async () => {
        try {
          return await response.json();
        } catch (error) {
          throw new Error(`Failed to parse JSON response: ${error}`);
        }
      },
      text: async () => {
        try {
          return await response.text();
        } catch (error) {
          throw new Error(`Failed to get text response: ${error}`);
        }
      }
    };
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const testClient = new TestClient();