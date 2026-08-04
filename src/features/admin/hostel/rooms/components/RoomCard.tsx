'use client'

import { useState } from 'react'
import { Room, BedStatus } from '../../types/hostel.types'
import { Card, CardContent, CardHeader } from '@/features/core/components/card'
import { Button } from '@/features/core/components/button'
import { Plus, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/features/core/components/dropdown-menu'

import { BedItem } from './BedItem'
import { AddBedDialog } from './AddBedDialog'
import { Progress } from '@/features/core/components/progress'
import DeleteRoom from './DeleteRoom'
import EditRoom from './EditRoom'

interface RoomCardProps {
  room: Room
  onUpdate: () => void
}

export function RoomCard({ room, onUpdate }: RoomCardProps) {
  const [showAddBed, setShowAddBed] = useState(false)

  const beds = room.beds || []
  const occupiedBeds = beds.filter(bed => bed.status === BedStatus.ALLOCATED).length
  const occupancyRate = room.capacity > 0 ? (occupiedBeds / room.capacity) * 100 : 0
  const availableSlots = room.capacity - beds.length

  return (
    <>
      <Card className="w-full shadow-xs  hover:shadow-sm transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <h3 className="font-semibold text-sm">Room {room.roomNumber}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{occupiedBeds}/{room.capacity} occupied</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditRoom room={room} onUpdate={onUpdate} />
              <DeleteRoom onUpdate={onUpdate} room={room} />
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Occupancy Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Occupancy</span>
              <span className="font-medium text-slate-900">{occupancyRate.toFixed(0)}%</span>
            </div>
            <Progress value={occupancyRate} className="h-1.5 bg-slate-200" />
          </div>

          {/* Beds List */}
          {beds.length > 0 ? (
            <div className="space-y-1.5">
              {beds.map(bed => (
                <BedItem key={bed.id} bed={bed} onUpdate={onUpdate} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No beds</p>
          )}

          {/* Add Bed Button */}
          {availableSlots > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddBed(true)}
              className="w-full h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Bed
            </Button>
          )}
        </CardContent>
      </Card>

      <AddBedDialog
        open={showAddBed}
        onOpenChange={setShowAddBed}
        roomId={room.id}
        roomNumber={room.roomNumber}
        onSuccess={onUpdate}
      />
    </>
  )
}