'use client'

import { Bed, BedStatus } from '../../types/hostel.types'
import { Badge } from '@/features/core/components/badge'
import { Button } from '@/features/core/components/button'
import { MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/features/core/components/dropdown-menu'
import DeleteBed from './DeleteBed'
import EditBed from './EditBed'

interface BedItemProps {
  bed: Bed
  onUpdate: () => void
}

export function BedItem({ bed, onUpdate }: BedItemProps) {
  const effectivePrice = bed.pricePerDay
  console.log("------BED-------- ", bed)

  const statusConfig = {
    [BedStatus.AVAILABLE]: { label: 'Available', variant: 'default' as const, color: 'bg-green-500' },
    [BedStatus.ALLOCATED]: { label: 'Allocated', variant: 'outline' as const, color: 'bg-yellow-500' },
    [BedStatus.INACTIVE]: { label: 'Inactive', variant: 'outline' as const, color: 'bg-gray-500' },
  }

  const config = statusConfig[bed.status]

  return (
    <div className="flex items-center border justify-between px-2 py-1.5 rounded transition-colors group">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.color}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">B{bed.bedNumber}</p>
          <p className="text-xs text-muted-foreground">NPR {effectivePrice}/day</p>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2 ">
        <Badge variant={config.variant} className="text-xs py-0 px-1.5 ">
          {config.label}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditBed bed={bed} onUpdate={onUpdate} />
            <DeleteBed onUpdate={onUpdate} bed={bed} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
