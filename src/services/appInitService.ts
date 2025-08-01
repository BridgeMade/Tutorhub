import { timeoutService } from './timeoutService';

class AppInitService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) {
      console.log('ℹ️ App services already initialized');
      return;
    }

    console.log('🚀 Initializing app services...');

    try {
      // Initialize timeout monitoring service
      await timeoutService.initialize();
      
      // Start monitoring existing pending requests
      await timeoutService.startMonitoringPendingRequests();

      this.isInitialized = true;
      console.log('✅ App services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app services:', error);
    }
  }

  async cleanup() {
    if (!this.isInitialized) return;

    console.log('🧹 Cleaning up app services...');
    
    try {
      timeoutService.cleanup();
      this.isInitialized = false;
      console.log('✅ App services cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up app services:', error);
    }
  }

  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      timeoutService: timeoutService.getMonitoringStats()
    };
  }
}

// Export singleton instance
export const appInitService = new AppInitService();