import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span className="font-bold">BCQA</span>
          </Link>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
               {/* Theme toggle could go here */}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  )
}
