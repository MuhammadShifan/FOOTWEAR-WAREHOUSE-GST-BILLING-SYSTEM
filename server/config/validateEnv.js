/**
 * Environment Variable Validation Module
 * Validates required server configuration at startup without exposing secret values.
 */

export const validateEnv = () => {
  const missing = [];
  const warnings = [];

  // Required Variables
  if (!process.env.MONGO_URI || process.env.MONGO_URI.trim() === '') {
    missing.push('MONGO_URI');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    missing.push('JWT_SECRET');
  } else {
    // Check for insecure default or short secret
    if (process.env.JWT_SECRET === 'as_marketing_footwear_jwt_secret_2026') {
      warnings.push(
        'JWT_SECRET is set to an insecure fallback string. Please generate a strong random secret.'
      );
    } else if (process.env.JWT_SECRET.length < 16) {
      warnings.push('JWT_SECRET is shorter than 16 characters. A 32+ character key is recommended.');
    }
  }

  if (!process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL.trim() === '') {
    missing.push('ADMIN_EMAIL');
  }

  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.trim() === '') {
    missing.push('ADMIN_PASSWORD');
  }

  // SMTP warnings if partially configured
  if (process.env.EMAIL_USER && !process.env.EMAIL_PASS) {
    warnings.push('EMAIL_USER is set but EMAIL_PASS is empty. Outgoing email may fail.');
  }

  // Summary Logging (Values are strictly sanitized/masked)
  console.log('[SECURITY] Validating server environment configuration...');
  console.log(` - MONGO_URI:       ${process.env.MONGO_URI ? 'CONFIGURED [HIDDEN]' : 'MISSING'}`);
  console.log(` - JWT_SECRET:      ${process.env.JWT_SECRET ? 'CONFIGURED [HIDDEN]' : 'MISSING'}`);
  console.log(` - ADMIN_EMAIL:     ${process.env.ADMIN_EMAIL ? 'CONFIGURED' : 'MISSING'}`);
  console.log(` - ADMIN_PASSWORD:  ${process.env.ADMIN_PASSWORD ? 'CONFIGURED [HIDDEN]' : 'MISSING'}`);
  console.log(` - EMAIL_SERVICE:   ${process.env.EMAIL_SERVICE || 'NOT SET (Fallback)'}`);

  if (warnings.length > 0) {
    warnings.forEach((warn) => console.warn(`[SECURITY WARNING] ${warn}`));
  }

  if (missing.length > 0) {
    const errorMsg = `[SECURITY FATAL] Missing required environment variable(s): ${missing.join(', ')}. Please check server/.env (see server/.env.example).`;
    console.error(errorMsg);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
    return false;
  }

  console.log('[SECURITY OK] Environment configuration successfully validated.');
  return true;
};

export default validateEnv;
