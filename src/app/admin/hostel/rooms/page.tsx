'use client'

import { useEffect, useState } from 'react'
import { Room } from '@/features/admin/hostel/types/hostel.types'
import { listRooms } from '@/features/admin/hostel/actions/room-actions'
import { RoomCard } from '@/features/admin/hostel/rooms/components/RoomCard'
import { Button } from '@/features/core/components/button'
import { Plus, Loader2 } from 'lucide-react'
import { AddRoomDialog } from '@/features/admin/hostel/rooms/components/AddRoomDialog'

export default function RoomPage() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddRoom, setShowAddRoom] = useState(false)

    const loadRooms = async () => {
        try {
            setIsLoading(true)
            const result = await listRooms({ limit: 100 })
            setRooms(result.rooms)
            console.log(result.rooms)
        } catch (error) {
            console.error('Failed to load rooms:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadRooms()
    }, [])

    return (
        <div className="p-6 flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Room Management</h1>
                    <p className="text-sm text-muted-foreground">Manage hostel rooms and beds</p>
                </div>
                <Button onClick={() => setShowAddRoom(true)} className="h-10 text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : rooms.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">No rooms yet</p>
        
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map(room => (
                        <RoomCard key={room.id} room={room} onUpdate={loadRooms} />
                    ))}
                </div>
            )}

            <AddRoomDialog
                open={showAddRoom}
                onOpenChange={setShowAddRoom}
                onSuccess={loadRooms}
            />
        </div>
    )
}