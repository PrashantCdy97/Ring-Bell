import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isEdge, setIsEdge] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already running as installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect device operating systems
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = (window.navigator.platform || '').toLowerCase();
    const isAndroidDevice = /android/.test(userAgent);
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isWindowsDevice = /windows|win32|win64/.test(userAgent) || /win/.test(platform);
    const isEdgeBrowser = /edg\//.test(userAgent);
    const isChromeBrowser = /chrome|crios/.test(userAgent) && !isEdgeBrowser;

    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);
    setIsWindows(isWindowsDevice);
    setIsEdge(isEdgeBrowser);
    setIsChrome(isChromeBrowser);
    setIsDesktop(!isAndroidDevice && !isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isAndroid,
    isIOS,
    isWindows,
    isEdge,
    isChrome,
    isDesktop,
    install,
    deferredPrompt,
  };
}
