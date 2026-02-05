import { ReactNode } from 'react'
import Header from './Header'
import Toast from './Toast'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-game-bg flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Toast />
    </div>
  )
}
