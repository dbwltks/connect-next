import { createClient } from './server';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 15000
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, timeout } = { ...DEFAULT_OPTIONS, ...options };
  
  for (let attempt = 0; attempt < maxRetries!; attempt++) {
    try {
      // 타임아웃 적용
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
      });
      
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
      
    } catch (error) {
      const isLastAttempt = attempt === maxRetries! - 1;
      
      if (isLastAttempt) {
        console.error(`Query failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // 지수 백오프 지연
      const delay = Math.min(baseDelay! * Math.pow(2, attempt), maxDelay!);
      console.warn(`Query attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Retry logic error');
}

export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await retryWithBackoff(async () => {
    const supabase = await createClient();
    const { data, error } = await queryFn();
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    return data;
  }, options);
  
  if (result === null) {
    throw new Error('Query returned null data');
  }
  
  return result;
}

export async function executeQueryWithFallback<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await executeQuery(queryFn, options);
  } catch (error) {
    console.error('Query failed, using fallback data:', error);
    return fallbackData;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('cms_menus')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}