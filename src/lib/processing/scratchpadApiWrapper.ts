/**
 * processing.scratchpadApiWrapper@1.0.0
 * Client-side wrapper for Scratchpad to call server APIs
 * 
 * This wrapper allows the Scratchpad to call server-side services through API routes,
 * avoiding the need for Redis environment variables on the client side.
 */

export interface ApiCallRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiCallResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Generic API call wrapper for Scratchpad
 */
export async function callScratchpadApi<T = unknown>(
  request: ApiCallRequest
): Promise<ApiCallResponse<T>> {
  try {
    const { endpoint, method = 'GET', body, headers = {} } = request;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, fetchOptions);
    
    let data: T;
    try {
      data = await response.json();
    } catch {
      data = {} as T;
    }

    if (!response.ok) {
      return {
        success: false,
        error: data && typeof data === 'object' && 'error' in data 
          ? String((data as Record<string, unknown>).error)
          : `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Specific wrapper for getting handins data
 */
export async function getHandinsForScratchpad(): Promise<ApiCallResponse> {
  return callScratchpadApi({
    endpoint: '/api/handins',
    method: 'GET',
  });
}

/**
 * Specific wrapper for getting metadata blob
 */
export async function getMetadataForScratchpad(): Promise<ApiCallResponse> {
  return callScratchpadApi({
    endpoint: '/api/metadata',
    method: 'GET',
  });
}

/**
 * Specific wrapper for getting student data
 */
export async function getStudentDataForScratchpad(): Promise<ApiCallResponse> {
  return callScratchpadApi({
    endpoint: '/api/student-data',
    method: 'GET',
  });
}

/**
 * Specific wrapper for adding handins (for testing)
 */
export async function addHandinsForScratchpad(handinsData: unknown): Promise<ApiCallResponse> {
  return callScratchpadApi({
    endpoint: '/api/handins/add',
    method: 'POST',
    body: handinsData,
  });
}

/**
 * Specific wrapper for deleting handins (for testing)
 */
export async function deleteHandinsForScratchpad(deleteData: unknown): Promise<ApiCallResponse> {
  return callScratchpadApi({
    endpoint: '/api/handins/delete',
    method: 'POST',
    body: deleteData,
  });
}

