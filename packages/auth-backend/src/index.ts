import 'dotenv/config';
import { app } from './app';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import { seedAdminConfig } from './seeds/admin-config';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB');

    await seedAdminConfig();
    logger.info('Admin config seeded');

    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
