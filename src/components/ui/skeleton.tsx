import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "./card"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-0">
         <Skeleton className="w-full h-36" />
      </CardHeader>
      <CardContent className="p-3 flex-1">
        <Skeleton className="h-3 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Skeleton className="h-3 w-16" />
      </CardFooter>
    </Card>
  )
}

export { Skeleton, SkeletonCard }
