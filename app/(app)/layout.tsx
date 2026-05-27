import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 min-w-0 flex-1 p-4 lg:p-5 xl:p-6">
        {children}
      </main>
    </div>
  )
}
