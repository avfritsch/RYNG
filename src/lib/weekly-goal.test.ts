import { describe, it, expect, beforeEach } from 'vitest';
import { getWeeklyGoal, setWeeklyGoal } from './weekly-goal';

describe('weekly-goal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getWeeklyGoal() returns null when not set', () => {
    expect(getWeeklyGoal()).toBeNull();
  });

  it('setWeeklyGoal(3) then getWeeklyGoal() returns 3', () => {
    setWeeklyGoal(3);
    expect(getWeeklyGoal()).toBe(3);
  });

  it('setWeeklyGoal(null) clears the goal', () => {
    setWeeklyGoal(5);
    expect(getWeeklyGoal()).toBe(5);
    setWeeklyGoal(null);
    expect(getWeeklyGoal()).toBeNull();
  });

  it('getWeeklyGoal() returns null after clear', () => {
    setWeeklyGoal(7);
    setWeeklyGoal(null);
    expect(getWeeklyGoal()).toBeNull();
  });

  it('values persist across multiple calls', () => {
    setWeeklyGoal(4);
    expect(getWeeklyGoal()).toBe(4);
    expect(getWeeklyGoal()).toBe(4); // still there on second call
  });

  it('overwrites previous value', () => {
    setWeeklyGoal(3);
    setWeeklyGoal(6);
    expect(getWeeklyGoal()).toBe(6);
  });

  it('stores value in localStorage under ryng_weekly_goal key', () => {
    setWeeklyGoal(2);
    expect(localStorage.getItem('ryng_weekly_goal')).toBe('2');
  });

  it('removes localStorage key when set to null', () => {
    setWeeklyGoal(5);
    setWeeklyGoal(null);
    expect(localStorage.getItem('ryng_weekly_goal')).toBeNull();
  });
});
