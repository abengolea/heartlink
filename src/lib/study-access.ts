import type { AuthenticatedUser } from '@/lib/api-auth';
import type { Study } from '@/lib/types';
import { getPatientById, getDoctorsByOperator, getPatientsByRequesterIds } from '@/lib/firestore';

export function normalizePatientIdFromStudy(study: Study): string | null {
  const raw = study.patientId as unknown;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && raw !== null && 'id' in raw) {
    const id = (raw as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}

export function normalizeRequesterIdOnPatient(patient: {
  requesterId?: unknown;
}): string | undefined {
  const pr = patient.requesterId;
  if (typeof pr === 'string') return pr;
  if (pr && typeof pr === 'object' && 'id' in pr) {
    const id = (pr as { id?: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}

/**
 * Listado: estudios dirigidos al solicitante o, si es legacy sin requestingDoctorId,
 * estudios de pacientes cuyo requesterId es este médico.
 */
export function studyVisibleToRequesterWithPatientSet(
  study: Study,
  requesterUserId: string,
  myPatientIds: Set<string>
): boolean {
  if (study.requestingDoctorId === requesterUserId) return true;
  if (study.requestingDoctorId) return false;
  const pid = normalizePatientIdFromStudy(study);
  return pid !== null && myPatientIds.has(pid);
}

export async function canRequesterViewStudy(
  study: Study,
  requesterUserId: string
): Promise<boolean> {
  if (study.requestingDoctorId === requesterUserId) return true;
  if (study.requestingDoctorId) return false;
  const pid = normalizePatientIdFromStudy(study);
  if (!pid) return false;
  const patient = await getPatientById(pid);
  if (!patient) return false;
  return normalizeRequesterIdOnPatient(patient) === requesterUserId;
}

/**
 * Operador: su estudio (operatorId) o relación con solicitantes vinculados / pacientes de ellos.
 * Estudios con operatorId de otro operador quedan excluidos.
 */
export function studyVisibleToOperator(
  study: Study,
  operatorUserId: string,
  linkedDoctorIds: Set<string>,
  patientIdsForMyDoctors: Set<string>
): boolean {
  if (study.operatorId === operatorUserId) return true;
  if (study.operatorId) return false;
  if (study.requestingDoctorId && linkedDoctorIds.has(study.requestingDoctorId)) return true;
  const pid = normalizePatientIdFromStudy(study);
  return pid !== null && patientIdsForMyDoctors.has(pid);
}

export async function canOperatorViewStudy(
  study: Study,
  operatorUserId: string
): Promise<boolean> {
  const doctors = await getDoctorsByOperator(operatorUserId);
  const linked = new Set(doctors.map((d) => d.id));
  const patients =
    linked.size > 0 ? await getPatientsByRequesterIds([...linked]) : [];
  const patientIds = new Set(patients.map((p) => p.id));
  return studyVisibleToOperator(study, operatorUserId, linked, patientIds);
}

export async function studyReadableByUser(
  authUser: AuthenticatedUser,
  study: Study
): Promise<boolean> {
  const role = authUser.dbUser.role;
  if (role === 'admin') return true;
  if (role === 'operator') {
    return canOperatorViewStudy(study, authUser.dbUser.id);
  }
  if (role === 'medico_solicitante' || role === 'solicitante') {
    return canRequesterViewStudy(study, authUser.dbUser.id);
  }
  return false;
}
