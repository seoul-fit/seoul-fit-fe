import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  showLogoutModal: boolean;
  showLogoutSuccess: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({
  showLogoutModal,
  showLogoutSuccess,
  onCancel,
  onConfirm,
}: LogoutModalProps) {
  return (
    <>
      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <LogOut className='w-6 h-6 text-red-600' />
                </div>
                <button
                  onClick={onCancel}
                  className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                >
                  <X className='w-5 h-5 text-gray-400' />
                </button>
              </div>

              <h3 className='text-lg font-semibold text-gray-900 mb-2'>로그아웃 하시겠습니까?</h3>
              <p className='text-gray-600 text-sm mb-6'>
                로그아웃하면 저장된 선호도 설정이 초기화됩니다.
              </p>

              <div className='flex space-x-3'>
                <button
                  onClick={onCancel}
                  className='flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors'
                >
                  취소
                </button>
                <button
                  onClick={onConfirm}
                  className='flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors'
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 성공 페이지 */}
      {showLogoutSuccess && (
        <div className='fixed inset-0 bg-white flex items-center justify-center z-[80]'>
          <div className='text-center'>
            <div className='text-6xl mb-4'>✅</div>
            <h2 className='text-2xl font-bold text-green-600 mb-2'>로그아웃 성공!</h2>
            <p className='text-gray-600'>메인 페이지로 이동합니다...</p>
          </div>
        </div>
      )}
    </>
  );
}
