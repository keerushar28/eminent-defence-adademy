'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Bed as BedIcon, DoorOpen } from 'lucide-react'
import { cn } from '@/features/core/lib/utils'
import { Label } from '@/features/core/components/label'
import { ScrollArea } from '@/features/core/components/scroll-area'
import { Badge } from '@/features/core/components/badge'
import { Room, Bed } from '../../types/hostel.types'
import { hostelApi } from '../api/hostel-api'

interface RoomBedSelectorProps {
  selectedRoomId: string
  selectedBedId: string
  onRoomChange: (roomId: string) => void
  onBedChange: (bedId: string) => void
  rooms: Room[]
  disabled?: boolean
}

export default function RoomBedSelector({
  selectedRoomId,
  selectedBedId,
  onRoomChange,
  onBedChange,
  rooms,
  disabled = false,
}: RoomBedSelectorProps) {
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([])
  const [loadingBeds, setLoadingBeds] = useState(false)

  // Fetch available beds when room is selected
  useEffect(() => {
    const fetchBeds = async () => {
      if (!selectedRoomId) {
        setAvailableBeds([])
        return
      }

      setLoadingBeds(true)
      try {
        const beds = await hostelApi.beds.getAvailableByRoom(selectedRoomId)
        setAvailableBeds(beds)
      } catch (error) {
        console.error('Error fetching beds:', error)
        setAvailableBeds([])
      } finally {
        setLoadingBeds(false)
      }
    }

    fetchBeds()
  }, [selectedRoomId])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const selectedBed = availableBeds.find((b) => b.id === selectedBedId)

  const handleRoomSelect = (roomId: string) => {
    onRoomChange(roomId)
    onBedChange('') // Reset bed selection
  }

  return (
    <div className="space-y-6">
      {/* Room Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">
            Select Room <span className="text-destructive">*</span>
          </Label>
        </div>

        <ScrollArea className="h-max  rounded-lg border bg-card">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <DoorOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No rooms available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please create rooms first
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {rooms
                .filter((room) => room.isActive)
                .map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleRoomSelect(room.id)}
                    disabled={disabled}
                    className={cn(
                      'w-full group cursor-pointer relative overflow-hidden rounded-lg text-left transition-all duration-200',
                      'border-2 hover:shadow-md',
                      selectedRoomId === room.id
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-background border-border hover:border-primary/40 hover:bg-accent/50',
                      disabled && 'opacity-50 cursor-not-allowed hover:shadow-none'
                    )}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className={cn(
                        "rounded-md p-2 transition-colors",
                        selectedRoomId === room.id
                          ? "bg-primary/10"
                          : "bg-muted group-hover:bg-primary/5"
                      )}>
                        <DoorOpen className={cn(
                          "h-5 w-5 transition-colors",
                          selectedRoomId === room.id
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-base">Room {room.roomNumber}</h4>
                          {selectedRoomId === room.id && (
                            <div className="rounded-full bg-primary p-1">
                              <Check className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>


                        {room.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Bed Selection */}
      {selectedRoomId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BedIcon className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">
              Select Bed <span className="text-destructive">*</span>
            </Label>
          </div>

          {loadingBeds ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-lg border bg-card">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span className="text-sm text-muted-foreground">Loading available beds...</span>
            </div>
          ) : availableBeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border bg-card text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <BedIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No available beds</p>
              <p className="text-xs text-muted-foreground mt-1">
                All beds in this room are currently allocated
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableBeds.map((bed) => {
                const effectivePrice = bed.pricePerDay
                const isSelected = selectedBedId === bed.id

                return (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => onBedChange(bed.id)}
                    disabled={disabled}
                    className={cn(
                      'group relative rounded-lg cursor-pointer border-2 transition-all duration-200',
                      'hover:shadow-md',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-accent/50',
                      disabled && 'opacity-50 cursor-not-allowed hover:shadow-none'
                    )}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={cn(
                          "rounded-md p-2 transition-colors",
                          isSelected ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"
                        )}>
                          <BedIcon className={cn(
                            "h-4 w-4 transition-colors",
                            isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          )} />
                        </div>
                        {isSelected && (
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Bed {bed.bedNumber}</h4>
                        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                          <span className="text-xs font-semibold">NPR</span>
                          <span>{effectivePrice.toFixed(0)}/day</span>
                        </div>
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className="text-xs font-medium"
                        >
                          {bed.status}
                        </Badge>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Summary */}
      {selectedRoom && selectedBed && (
        <div className="rounded-lg border bg-linear-to-br from-primary/5 to-primary/10 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">Selection Summary</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Room</p>
              <p className="text-base font-semibold">{selectedRoom.roomNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Bed</p>
              <p className="text-base font-semibold">{selectedBed.bedNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Price per day</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-primary">NPR</span>
                <p className="text-base font-semibold text-primary">
                  {selectedBed.pricePerDay.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
