import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../uiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      selectedDiscoveryId: null,
      selectedMonitorId: null,
    });
  });

  describe('initial state', () => {
    it('has null selectedDiscoveryId', () => {
      expect(useUiStore.getState().selectedDiscoveryId).toBeNull();
    });

    it('has null selectedMonitorId', () => {
      expect(useUiStore.getState().selectedMonitorId).toBeNull();
    });
  });

  describe('setSelectedDiscoveryId', () => {
    it('sets the discovery ID', () => {
      useUiStore.getState().setSelectedDiscoveryId(42);
      expect(useUiStore.getState().selectedDiscoveryId).toBe(42);
    });

    it('can set discovery ID to null', () => {
      useUiStore.getState().setSelectedDiscoveryId(10);
      useUiStore.getState().setSelectedDiscoveryId(null);
      expect(useUiStore.getState().selectedDiscoveryId).toBeNull();
    });

    it('does not affect selectedMonitorId', () => {
      useUiStore.getState().setSelectedMonitorId(5);
      useUiStore.getState().setSelectedDiscoveryId(10);
      expect(useUiStore.getState().selectedMonitorId).toBe(5);
    });
  });

  describe('setSelectedMonitorId', () => {
    it('sets the monitor ID', () => {
      useUiStore.getState().setSelectedMonitorId(99);
      expect(useUiStore.getState().selectedMonitorId).toBe(99);
    });

    it('can set monitor ID to null', () => {
      useUiStore.getState().setSelectedMonitorId(7);
      useUiStore.getState().setSelectedMonitorId(null);
      expect(useUiStore.getState().selectedMonitorId).toBeNull();
    });

    it('does not affect selectedDiscoveryId', () => {
      useUiStore.getState().setSelectedDiscoveryId(3);
      useUiStore.getState().setSelectedMonitorId(8);
      expect(useUiStore.getState().selectedDiscoveryId).toBe(3);
    });
  });

  describe('state persistence across multiple updates', () => {
    it('maintains correct state after sequential updates', () => {
      const store = useUiStore.getState();

      store.setSelectedDiscoveryId(1);
      store.setSelectedMonitorId(2);
      store.setSelectedDiscoveryId(3);

      const state = useUiStore.getState();
      expect(state.selectedDiscoveryId).toBe(3);
      expect(state.selectedMonitorId).toBe(2);
    });
  });
});
