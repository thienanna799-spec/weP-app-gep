import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Response } from 'express';

describe('Unit Tests: apiResponse utilities', () => {
  it('should send success response with data and status code', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    sendSuccess(res, { foo: 'bar' }, 200, 'Success');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: { foo: 'bar' }
    });
  });

  it('should send error response with message and status code', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;

    sendError(res, 'Some error', 400);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Some error'
    });
  });
});

describe('Unit Tests: asyncHandler helper', () => {
  it('should wrap async function and forward error to next()', async () => {
    const req = {} as any;
    const res = {} as any;
    const next = vi.fn();

    const mockHandler = asyncHandler(async () => {
      throw new Error('Async error');
    });

    await mockHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
