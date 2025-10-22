/**
 * Unit tests for processing.scratchpadApiWrapper v1.0.0
 */

// Mock fetch globally
global.fetch = jest.fn();

import { 
  callScratchpadApi, 
  getHandinsForScratchpad, 
  getMetadataForScratchpad,
  getStudentDataForScratchpad,
  addHandinsForScratchpad,
  deleteHandinsForScratchpad
} from '../scratchpadApiWrapper';

describe('processing.scratchpadApiWrapper v1.0.0', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('callScratchpadApi', () => {
    it('handles successful GET request', async () => {
      const mockData = { items: [{ id: '1', name: 'test' }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await callScratchpadApi({
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
      expect(result.error).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('handles successful POST request with body', async () => {
      const mockData = { success: true };
      const requestBody = { name: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockData,
      });

      const result = await callScratchpadApi({
        endpoint: '/api/test',
        method: 'POST',
        body: requestBody,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(201);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    });

    it('handles HTTP error responses', async () => {
      const errorData = { error: 'Not found' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorData,
      });

      const result = await callScratchpadApi({
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
      expect(result.status).toBe(404);
      expect(result.data).toBeUndefined();
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await callScratchpadApi({
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.data).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it('handles JSON parse errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await callScratchpadApi({
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
      expect(result.status).toBe(200);
    });

    it('includes custom headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await callScratchpadApi({
        endpoint: '/api/test',
        method: 'GET',
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
      });
    });
  });

  describe('specific wrapper functions', () => {
    it('getHandinsForScratchpad calls correct endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      });

      await getHandinsForScratchpad();

      expect(global.fetch).toHaveBeenCalledWith('/api/handins', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('getMetadataForScratchpad calls correct endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ students: {}, courses: {} }),
      });

      await getMetadataForScratchpad();

      expect(global.fetch).toHaveBeenCalledWith('/api/metadata', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('getStudentDataForScratchpad calls correct endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ students: {} }),
      });

      await getStudentDataForScratchpad();

      expect(global.fetch).toHaveBeenCalledWith('/api/student-data', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('addHandinsForScratchpad calls correct endpoint with body', async () => {
      const handinsData = { items: [{ courseId: 'C-1', assignmentId: 'A-1' }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ created: [], overwritten: [] }),
      });

      await addHandinsForScratchpad(handinsData);

      expect(global.fetch).toHaveBeenCalledWith('/api/handins/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handinsData),
      });
    });

    it('deleteHandinsForScratchpad calls correct endpoint with body', async () => {
      const deleteData = { keys: [{ courseId: 'C-1', assignmentId: 'A-1' }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ deleted: [], notFound: [] }),
      });

      await deleteHandinsForScratchpad(deleteData);

      expect(global.fetch).toHaveBeenCalledWith('/api/handins/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteData),
      });
    });
  });
});

