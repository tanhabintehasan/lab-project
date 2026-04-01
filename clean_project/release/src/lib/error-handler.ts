/**
 * API Response helpers with error logging
 */

import { NextResponse } from 'next/server';

export function logApiError(context: string, error: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error - ${context}]:`, error);
  } else {
    // In production, log without full error details
    console.error(`[API Error - ${context}]:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

export function handleApiError(error: unknown, context: string) {
  logApiError(context, error);
  
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('unique constraint')) {
      return NextResponse.json(
        { success: false, error: '该记录已存在' },
        { status: 409 }
      );
    }
    
    if (error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { success: false, error: '关联数据不存在' },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: '资源不存在' },
        { status: 404 }
      );
    }
  }
  
  return NextResponse.json(
    { success: false, error: '服务器错误，请稍后重试' },
    { status: 500 }
  );
}
