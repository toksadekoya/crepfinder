export const getSeedPolicy = (env = process.env) => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    isProduction,
    isAllowed: !isProduction || env.ALLOW_PRODUCTION_SEED === 'true',
    shouldResetData: !isProduction,
    shouldCreatePassword: !isProduction,
  };
};
