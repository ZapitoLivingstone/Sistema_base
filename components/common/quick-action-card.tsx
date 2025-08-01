import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  color?: "blue" | "green" | "purple" | "orange" | "red"
}

export function QuickActionCard({ href, icon: Icon, title, description, badge, color = "blue" }: QuickActionCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
  }

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-6 text-center">
          <div
            className={`p-2 rounded-lg mx-auto mb-4 w-fit ${colorClasses[color]} group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="font-medium mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
        </CardContent>
      </Card>
    </Link>
  )
}
