export interface Env {
  PLAYSTORE_URL: string;
  APPSTORE_URL: string;
  FALLBACK: string;
}

interface UserAgentDetection {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
}

function detectUserAgent(userAgent: string): UserAgentDetection {
  const ua = userAgent.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile/.test(ua);

  return {
    isIOS,
    isAndroid,
    isMobile
  };
}

function getRedirectUrl(detection: UserAgentDetection, env: Env): string {
  if (detection.isIOS && env.APPSTORE_URL) {
    return env.APPSTORE_URL;
  }

  if (detection.isAndroid && env.PLAYSTORE_URL) {
    return env.PLAYSTORE_URL;
  }

  // Fallback for any other case
  return env.FALLBACK || 'https://example.com';
}

function createRedirectResponse(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url,
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      'X-Redirect-Reason': 'User-Agent based redirect'
    }
  });
}

function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Only handle GET requests
      if (request.method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }

      // Check if required environment variables are set
      if (!env.FALLBACK) {
        return createErrorResponse('FALLBACK environment variable is required', 500);
      }

      // Get user agent from request headers
      const userAgent = request.headers.get('User-Agent') || '';

      if (!userAgent) {
        console.warn('No User-Agent header found, redirecting to fallback');
        return createRedirectResponse(env.FALLBACK);
      }

      // Detect user agent
      const detection = detectUserAgent(userAgent);

      // Get appropriate redirect URL
      const redirectUrl = getRedirectUrl(detection, env);

      // Log for debugging (will appear in Cloudflare dashboard logs)
      console.log('Redirect:', {
        userAgent: userAgent.substring(0, 100), // Truncate for privacy
        detection,
        redirectUrl
      });

      // Return redirect response
      return createRedirectResponse(redirectUrl);

    } catch (error) {
      console.error('Worker error:', error);

      // Fallback redirect in case of any errors
      if (env.FALLBACK) {
        return createRedirectResponse(env.FALLBACK);
      }

      return createErrorResponse('Internal server error', 500);
    }
  }
};
