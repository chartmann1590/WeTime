const { execSync, spawn } = require('child_process');

function run(cmd, allowFailure = false) {
  console.log(`[init] ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (e) {
    if (allowFailure) {
      console.warn(`[init] command failed (non-fatal): ${cmd}`);
      return false;
    }
    console.warn(`[init] command failed: ${cmd}`);
    throw e;
  }
}

(async () => {
  try {
    // Generate Prisma client
    // Schema is at ../../prisma/schema.prisma relative to /app/apps/backend
    try {
      run('pnpm exec prisma generate --schema ../../prisma/schema.prisma');
    } catch (_) {}

    // Wait for database to be ready
    console.log('[init] Waiting for database...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try to apply migrations - but don't fail if it doesn't work
    // The schema might already be applied or we can continue without it
    let migrationSuccess = false;
    console.log('[init] Attempting prisma migrate deploy...');
    if (run('pnpm exec prisma migrate deploy --schema ../../prisma/schema.prisma', true)) {
      migrationSuccess = true;
      console.log('[init] Migrations applied successfully');
    } else {
      console.warn('[init] migrate deploy failed, attempting db push');
      if (run('pnpm exec prisma db push --accept-data-loss --skip-generate --schema ../../prisma/schema.prisma', true)) {
        migrationSuccess = true;
        console.log('[init] Database schema pushed successfully');
      } else {
        console.warn('[init] db push also failed, continuing anyway...');
        // Continue anyway - schema might already exist or we'll handle it at runtime
      }
    }
    
    if (!migrationSuccess) {
      console.warn('[init] WARNING: Database migrations failed, but continuing...');
      console.warn('[init] The app may not work correctly if the schema is not up to date');
      console.warn('[init] You may need to manually run: pnpm exec prisma db push');
    }

    // Optional seed if env var set
    if (process.env.SEED === '1') {
      try {
        run('pnpm exec ts-node --transpile-only src/scripts/seed.ts');
      } catch (e) {
        console.warn('[init] seed failed', e.message);
      }
    }

    // Start Next.js
    const app = spawn('npx', ['next', 'start', '-p', '3001'], { stdio: 'inherit', cwd: process.cwd() });
    app.on('close', (code) => process.exit(code || 0));
  } catch (e) {
    console.error('[init] fatal error', e);
    process.exit(1);
  }
})();

