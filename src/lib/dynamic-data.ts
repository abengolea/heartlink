import type { Study } from './types';
import { studies as staticStudies } from './data';

// Dynamic studies stored in localStorage (temporary solution until we have a database)
export function getDynamicStudies(): Study[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('heartlink_dynamic_studies');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading dynamic studies:', error);
    return [];
  }
}

export function saveDynamicStudy(study: Study): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getDynamicStudies();
    const updated = [...existing, study];
    localStorage.setItem('heartlink_dynamic_studies', JSON.stringify(updated));
    console.log('Dynamic study saved:', study.id);
  } catch (error) {
    console.error('Error saving dynamic study:', error);
  }
}

export function getAllStudies(): Study[] {
  // Combine static studies with dynamic ones
  const dynamic = getDynamicStudies();
  return [...staticStudies, ...dynamic];
}

export function getStudyById(id: string): Study | undefined {
  const allStudies = getAllStudies();
  return allStudies.find(study => study.id === id);
}