'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/features/core/components/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/features/core/components/alert-dialog'
import { toast } from 'sonner'
import axios from 'axios'

export default function ClearDatabaseDialog() {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleClearDatabase = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm')
      return
    }

    setIsLoading(true)
    try {
      await axios.post('/api/super-admin/clear-database', {
        confirm: true,
      })

      toast.success('Database cleared successfully. All data except users has been deleted.')
      setConfirmText('')
    } catch (error) {
      console.error('Error clearing database:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear database'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="h-9 text-sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Clear Database
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Clear All Database Data
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="font-semibold text-foreground">
              This action cannot be undone!
            </p>
            <p>
              This will permanently delete all data from the database except user accounts:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>All students and their records</li>
              <li>All hostel allocations and payments</li>
              <li>All inventory items and orders</li>
              <li>All category assignments and payments</li>
              <li>All ledger entries and settlements</li>
            </ul>
            <p className="font-semibold text-foreground pt-2">
              User accounts will be preserved.
            </p>
            <div className="pt-3">
              <p className="text-sm font-medium mb-2">
                Type <span className="font-mono bg-muted px-2 py-1 rounded">DELETE ALL DATA</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type confirmation text"
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                disabled={isLoading}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearDatabase}
            disabled={isLoading || confirmText !== 'DELETE ALL DATA'}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              'Clear Database'
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
