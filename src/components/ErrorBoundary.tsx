import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || '發生未預期的錯誤';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error) {
        if (String(parsed.error).includes('Quota exceeded')) {
          readable = '雲端資料庫今日免費額度已達上限，請稍後或明日再試。';
        } else if (String(parsed.error).includes('permission')) {
          readable = '雲端存取權限驗證未通過，請重新登入 Google 帳號後再試。';
        } else {
          readable = `雲端同步發生問題（${parsed.operationType || 'read'}）：${parsed.error}`;
        }
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('App ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen hk-counter-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-lg p-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-stone-900">系統暫時遇到問題</h1>
            <p className="text-sm text-stone-600 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              重新載入遊戲
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
