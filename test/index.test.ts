import { describe, it, expect } from 'vitest';

// Mock the worker module
const mockEnv = {
  PLAYSTORE_URL: 'https://play.google.com/store/apps/details?id=com.example.app',
  APPSTORE_URL: 'https://apps.apple.com/app/example-app/id123456789',
  FALLBACK: 'https://example.com'
};

// Import the worker (we'll need to adjust the import based on the actual export)
import worker from '../src/index';

describe('Cloudflare Worker - App Store Redirect', () => {
  it('should redirect iOS devices to App Store', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(mockEnv.APPSTORE_URL);
  });

  it('should redirect Android devices to Play Store', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
      }
    });

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(mockEnv.PLAYSTORE_URL);
  });

  it('should redirect to fallback for desktop browsers', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
      }
    });

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(mockEnv.FALLBACK);
  });

  it('should redirect to fallback when no User-Agent is provided', async () => {
    const request = new Request('https://example.com');

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(mockEnv.FALLBACK);
  });

  it('should handle iPad as iOS device', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(mockEnv.APPSTORE_URL);
  });

  it('should return error for non-GET requests', async () => {
    const request = new Request('https://example.com', {
      method: 'POST'
    });

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.status).toBe(405);
  });

  it('should return error when FALLBACK is not set', async () => {
    const envWithoutFallback = {
      PLAYSTORE_URL: mockEnv.PLAYSTORE_URL,
      APPSTORE_URL: mockEnv.APPSTORE_URL,
      FALLBACK: ''
    };

    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const response = await worker.fetch(request, envWithoutFallback, {} as any);

    expect(response.status).toBe(500);
  });

  it('should set appropriate cache headers', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    const response = await worker.fetch(request, mockEnv, {} as any);

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
    expect(response.headers.get('X-Redirect-Reason')).toBe('User-Agent based redirect');
  });

  it('should handle missing store URLs gracefully', async () => {
    const envWithMissingUrls = {
      PLAYSTORE_URL: '',
      APPSTORE_URL: '',
      FALLBACK: mockEnv.FALLBACK
    };

    const request = new Request('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    const response = await worker.fetch(request, envWithMissingUrls, {} as any);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(mockEnv.FALLBACK);
  });
});
