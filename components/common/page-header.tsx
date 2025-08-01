import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  backUrl?: string
  backLabel?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, backUrl, backLabel = "Volver", children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {backUrl && (
            <Link href={backUrl}>
              <Button variant="outline" size="sm" className="mr-4 bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600">{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
