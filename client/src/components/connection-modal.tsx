import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionModal() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showModal, setShowModal] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShowModal(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowModal(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                Connection Restored
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                Connection Lost
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? 'Your connection has been restored. You can continue trading.'
                : 'Please check your internet connection and try again.'}
            </p>
            <Badge variant={isOnline ? 'default' : 'destructive'} className="w-fit">
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}