import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-[#E9E3D5] rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-md">
            <div className="w-12 h-12 rounded-full bg-[#FFE8D6] text-[#D9A066] mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="font-serif italic font-bold text-xl text-[#5A5A40]">
              พื้นที่การเรียนรู้สีน้ำของคุณกำลังพักฟื้นชั่วคราว
            </h2>

            <p className="text-xs text-[#737365] leading-relaxed">
              ขออภัยในความไม่สะดวกครับ ระบบบันทึกการเรียนรู้กำลังรีสตาร์ทเพื่อความปลอดภัยของข้อมูล
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#5A5A40] text-white rounded-xl text-xs font-semibold hover:bg-[#464632] transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>โหลดหน้านี้ใหม่</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FAF7F2] border border-[#E9E3D5] text-[#737365] hover:text-[#2C2C2C] rounded-xl text-xs font-semibold hover:bg-[#E9E3D5]/50 transition-colors"
              >
                <span>รีเซ็ตพื้นที่เรียน</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
