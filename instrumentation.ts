// instrumentation.ts - Next.js 서버 시작 시에만 실행

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { dataScheduler } = await import('./lib/scheduler');
    
    console.log('[서버시작] 데이터 캐시 초기화 시작...');
    try {
      await dataScheduler.initialize();
      console.log('[서버시작] 데이터 캐시 초기화 완료');
    } catch (error) {
      console.error('[서버시작] 데이터 캐시 초기화 실패:', error);
    }
  }
}