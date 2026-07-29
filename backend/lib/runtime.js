export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isResearchModeEnabled() {
  return process.env.ENABLE_RESEARCH_ROUTES === 'true' || !isProduction();
}
