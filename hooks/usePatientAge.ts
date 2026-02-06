import { useState, useEffect } from 'react';
import { calculateAge } from '../constants';

/**
 * A reactive hook that calculates and continuously updates a patient's age.
 * This is crucial for handling edge cases where a patient's birthday occurs
 * while their record is being viewed, ensuring age-dependent logic (e.g., pediatric consent)
 * remains accurate.
 *
 * @param dob The date of birth string (e.g., 'YYYY-MM-DD').
 * @returns The current age of the patient as a number, or undefined if dob is invalid.
 */
export const usePatientAge = (dob: string | undefined | null): number | undefined => {
    const [age, setAge] = useState(() => calculateAge(dob));

    useEffect(() => {
        // Recalculate immediately if the DOB prop changes
        setAge(calculateAge(dob));

        // Set up an interval to check for age changes every minute.
        // This handles the case where a patient's birthday happens during the session.
        const intervalId = setInterval(() => {
            const newAge = calculateAge(dob);
            if (newAge !== age) {
                setAge(newAge);
            }
        }, 60000); // 60 seconds

        // Cleanup interval on component unmount or when DOB changes
        return () => clearInterval(intervalId);
    }, [dob, age]); // Rerun effect if dob or the calculated age changes

    return age;
};
