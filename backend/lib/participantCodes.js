export const PARTICIPANT_CODE_PATTERN = /^(?:P[0-9]{3}|PILOT_[0-9]{3})$/;
export const PILOT_PARTICIPANT_CODE_PATTERN = /^PILOT_[0-9]{3}$/;

export function normalizeParticipantCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return PARTICIPANT_CODE_PATTERN.test(code) ? code : null;
}

export function isPilotParticipantCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return PILOT_PARTICIPANT_CODE_PATTERN.test(code);
}
