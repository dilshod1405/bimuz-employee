import { Skeleton } from "@/components/ui/skeleton"

interface EmployeesTableSkeletonProps {
  rows?: number
}

export function EmployeesTableSkeleton({ rows = 5 }: EmployeesTableSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left text-sm font-medium">Ism</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Mutaxassislik</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Holat</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="border-b">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-48" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-6 w-16 rounded-full" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="h-8 w-8 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
