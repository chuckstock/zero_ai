import { useToastStore } from '../../stores/toastStore'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

export default function Toast() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up',
            {
              'bg-tile-correct': toast.type === 'success',
              'bg-red-600': toast.type === 'error',
              'bg-tile-present': toast.type === 'warning',
              'bg-gray-700': toast.type === 'info',
            }
          )}
        >
          {toast.type === 'success' && <CheckCircle size={20} className="text-white shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-white shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle size={20} className="text-white shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-white shrink-0" />}
          
          <p className="text-white text-sm flex-1">{toast.message}</p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/70 hover:text-white shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
