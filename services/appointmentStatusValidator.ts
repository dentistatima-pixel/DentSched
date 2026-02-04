
import { AppointmentStatus } from '../types';
import { VALID_TRANSITIONS } from '../constants';

/**
 * Checks if a transition from a current appointment status to a target status is allowed.
 * @param currentStatus The current status of the appointment.
 * @param targetStatus The desired new status.
 * @returns {boolean} True if the transition is valid, false otherwise.
 */
export const canTransitionTo = (
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus
): boolean => {
  // Prevent transitioning to the same status
  if (currentStatus === targetStatus) {
      return false;
  }

  const validTargets = VALID_TRANSITIONS[currentStatus];
  if (!validTargets) {
    console.warn(`No valid transitions defined for current status: "${currentStatus}"`);
    return false; // No transitions defined for this status
  }
  
  const isAllowed = validTargets.includes(targetStatus);
  
  if (!isAllowed) {
      console.log(`MEDICOLEGAL GUARD: Blocked invalid status transition from "${currentStatus}" to "${targetStatus}".`);
  }
  
  return isAllowed;
};
