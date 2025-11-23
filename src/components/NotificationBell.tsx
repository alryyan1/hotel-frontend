import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import apiClient from '@/api/axios'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

interface Notification {
  id: string
  type: 'ending' | 'new'
  title: string
  message: string
  reservationId: number
  timestamp: string
  read: boolean
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const lastFetchTimeRef = useRef<string | null>(null)
  const seenReservationIdsRef = useRef<Set<string>>(new Set())
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/reservations')
      
      const reservations = data.data || data || []
      const now = dayjs()
      const newNotifications: Notification[] = []
      const newSeenIds = new Set(seenReservationIdsRef.current)

      reservations.forEach((reservation: any) => {
        const checkOutDate = dayjs(reservation.check_out_date)
        const createdDate = dayjs(reservation.created_at)
        
        // Check for ending reservations (ending today or within next 24 hours)
        if (reservation.status === 'checked_in' || reservation.status === 'confirmed') {
          const daysUntilCheckout = checkOutDate.diff(now, 'day')
          const hoursUntilCheckout = checkOutDate.diff(now, 'hour')
          
          if (daysUntilCheckout === 0 || (daysUntilCheckout === 1 && hoursUntilCheckout <= 24)) {
            const notifId = `ending-${reservation.id}`
            if (!newSeenIds.has(notifId)) {
              newSeenIds.add(notifId)
              newNotifications.push({
                id: notifId,
                type: 'ending',
                title: 'حجز ينتهي قريباً',
                message: `حجز #${reservation.id} - ${reservation.customer.name} ينتهي ${daysUntilCheckout === 0 ? 'اليوم' : 'غداً'} (${checkOutDate.format('DD/MM/YYYY')})`,
                reservationId: reservation.id,
                timestamp: reservation.check_out_date,
                read: false
              })
            }
          }
        }
        
        // Check for new reservations (created in last 24 hours)
        const hoursAgo = now.diff(createdDate, 'hour')
        if (hoursAgo <= 24 && reservation.status !== 'cancelled') {
          const notifId = `new-${reservation.id}`
          // Only show if we haven't seen this reservation before OR it was created after last fetch
          const wasCreatedAfterLastFetch = lastFetchTimeRef.current && createdDate.isAfter(dayjs(lastFetchTimeRef.current))
          const wasNotSeenBefore = !newSeenIds.has(notifId)
          
          if (wasNotSeenBefore || wasCreatedAfterLastFetch) {
            if (wasNotSeenBefore) {
              newSeenIds.add(notifId)
            }
            
            const minutesAgo = now.diff(createdDate, 'minute')
            
            let timeText = ''
            if (minutesAgo < 60) {
              timeText = `منذ ${minutesAgo} دقائق`
            } else if (hoursAgo < 24) {
              timeText = `منذ ${hoursAgo} ساعة`
            } else {
              timeText = createdDate.format('DD/MM/YYYY HH:mm')
            }
            
            newNotifications.push({
              id: notifId,
              type: 'new',
              title: 'حجز جديد',
              message: `حجز جديد #${reservation.id} - ${reservation.customer.name} (${timeText})`,
              reservationId: reservation.id,
              timestamp: reservation.created_at,
              read: false
            })
          }
        }
      })

      // Sort notifications by timestamp (newest first)
      newNotifications.sort((a, b) => 
        dayjs(b.timestamp).unix() - dayjs(a.timestamp).unix()
      )

      // Only add truly new notifications
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id))
        return [...uniqueNew, ...prev].slice(0, 20) // Keep only last 20
      })

      seenReservationIdsRef.current = newSeenIds
      lastFetchTimeRef.current = now.toISOString()
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchNotifications()
    
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000)
    
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    
    // Navigate to reservations list
    setOpen(false)
    navigate('/reservations-list')
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 p-0 hover:bg-accent transition-all duration-200"
          aria-label="الإشعارات"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-bold text-base">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-right px-4 py-3 hover:bg-accent transition-colors ${
                    !notification.read ? 'bg-accent/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-1 ${
                      notification.type === 'ending' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {notification.type === 'ending' ? '⚠️' : '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className={`text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dayjs(notification.timestamp).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
