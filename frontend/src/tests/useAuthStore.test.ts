import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      menus: [],
      isAuthenticated: false,
      error: null,
    });
  });

  it('should initialize with empty state when localStorage is clear', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should handle logout correctly', () => {
    useAuthStore.setState({
      user: { id: '1', warungId: 'w1', roleId: 1, roleName: 'Owner', username: 'owner1', email: 'owner@test.com', fullName: 'Owner Test', isActive: true },
      token: 'fake-jwt-token',
      isAuthenticated: true,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem('warbisa_token')).toBeNull();
  });
});
