'use client'

import { useEffect, useState } from 'react'
import { Room } from '@/features/admin/hostel/types/hostel.types'
import { listRooms } from '@/features/admin/hostel/actions/room-actions'
import { RoomCard } from '@/features/admin/hostel/rooms/components/RoomCard'
import { Button } from '@/features/core/components/button'
import { Plus, Loader2 } from 'lucide-react'
import { AddRoomDialog } from '@/features/admin/hostel/rooms/components/AddRoomDialog'
import { ExportButton } from '@/features/components/export-button'
import type { ExportOptions } from '@/lib/export-utils'

export default function RoomPage() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddRoom, setShowAddRoom] = useState(false)
    const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null)

    const loadRooms = async () => {
        try {
            setIsLoading(true)
            const result = await listRooms({ limit: 100 })
            setRooms(result.rooms)
        } catch (error) {
            console.error('Failed to load rooms:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadRooms()
    }, [])

    // Compute export options when rooms data changes
    useEffect(() => {
        if (rooms.length === 0) {
            setExportOptions(null)
            return
        }

        const exportData = rooms.map((room) => {
            const beds = room.beds || []
            const totalBeds = beds.length
            const availableBeds = beds.filter((b) => b.status === 'AVAILABLE' && b.isActive).length
            const allocatedBeds = beds.filter((b) => b.status === 'ALLOCATED').length
            const inactiveBeds = beds.filter((b) => b.status === 'INACTIVE' || !b.isActive).length
            const minPrice = beds.length > 0 ? Math.min(...beds.filter((b) => b.isActive).map((b) => b.pricePerDay)) : 0
            const maxPrice = beds.length > 0 ? Math.max(...beds.filter((b) => b.isActive).map((b) => b.pricePerDay)) : 0

            return {
                roomNumber: room.roomNumber,
                capacity: room.capacity,
                description: room.description || "-",
                status: room.isActive ? "Active" : "Inactive",
                totalBeds,
                availableBeds,
                allocatedBeds,
                inactiveBeds,
                priceRange: minPrice === maxPrice ? `NPR ${minPrice}` : `NPR ${minPrice} - ${maxPrice}`,
            }
        })

        setExportOptions({
            fileName: "rooms-data",
            sheetName: "Rooms",
            title: "Hostel Room Management",
            subtitle: `Exported on ${new Date().toLocaleDateString()}`,
            columns: [
                { header: "Room Number", key: "roomNumber", width: 15 },
                { header: "Capacity", key: "capacity", width: 12 },
                { header: "Description", key: "description", width: 30 },
                { header: "Status", key: "status", width: 12 },
                { header: "Total Beds", key: "totalBeds", width: 12 },
                { header: "Available", key: "availableBeds", width: 12 },
                { header: "Allocated", key: "allocatedBeds", width: 12 },
                { header: "Inactive", key: "inactiveBeds", width: 12 },
                { header: "Price Range/Day", key: "priceRange", width: 20 },
            ],
            data: exportData,
        })
    }, [rooms])

    return (
        <div className="p-6 flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Room Management</h1>
                    <p className="text-sm text-muted-foreground">Manage hostel rooms and beds</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton
                        options={exportOptions ?? { fileName: "rooms", columns: [], data: [] }}
                        disabled={!exportOptions}
                    />
                    <Button onClick={() => setShowAddRoom(true)} className="h-10 text-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                    </Button>
                </div>
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