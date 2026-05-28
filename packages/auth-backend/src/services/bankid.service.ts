import { BankIdClientV6 } from 'bankid';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error-handler';
import { tokenService } from './token.service';
import { User } from '../models/user.model';
import { AuthSession } from '@flexauth/shared-types';

/**
 * BankID authentication service.
 * All BankID operations are SERVER-SIDE ONLY.
 *
 * Supports two modes via BANKID_MODE env var:
 * - 'real': Connects to BankID test/production API
 * - 'demo': Simulates a successful BankID auth (for thesis demonstration)
 */

interface PendingOrder {
  startTime: number;
  mode: 'real' | 'demo';
}

const pendingOrders = new Map<string, PendingOrder>();

let bankIdClient: BankIdClientV6 | null = null;

function isDemoMode(): boolean {
  return process.env.BANKID_MODE === 'demo';
}

function getClient(): BankIdClientV6 {
  if (!bankIdClient) {
    const isProduction = process.env.BANKID_ENVIRONMENT === 'production';
    if (isProduction) {
      bankIdClient = new BankIdClientV6({
        production: true,
        pfx: process.env.BANKID_PFX_PATH,
        passphrase: process.env.BANKID_PFX_PASSPHRASE,
      });
    } else {
      bankIdClient = new BankIdClientV6({ production: false });
    }
    logger.info('BankID client initialized', { production: isProduction });
  }
  return bankIdClient;
}

// Demo mode fake data
const DEMO_USER = {
  personalNumber: '199001010101',
  name: 'Test Testsson',
  givenName: 'Test',
  surname: 'Testsson',
};

export class BankIdService {
  /**
   * Initiate BankID authentication.
   */
  async authenticate(endUserIp: string): Promise<{
    orderRef: string;
    autoStartToken: string;
  }> {
    if (isDemoMode()) {
      // Demo mode — return fake orderRef
      const orderRef = uuidv4();
      const autoStartToken = uuidv4();
      pendingOrders.set(orderRef, { startTime: Date.now(), mode: 'demo' });
      logger.info('BankID demo auth initiated', { orderRef });
      return { orderRef, autoStartToken };
    }

    try {
      const client = getClient();
      const response = await client.authenticate({ endUserIp });
      pendingOrders.set(response.orderRef, { startTime: Date.now(), mode: 'real' });
      logger.info('BankID auth initiated', { orderRef: response.orderRef });
      return {
        orderRef: response.orderRef,
        autoStartToken: response.autoStartToken,
      };
    } catch (error: any) {
      logger.error('BankID auth initiation failed', { error: error.message });
      throw new AppError(502, 'AUTH_PROVIDER_ERROR', 'BankID authentication failed to start');
    }
  }

  /**
   * Collect (poll) BankID authentication status.
   */
  async collect(orderRef: string): Promise<{
    status: 'pending' | 'failed' | 'complete';
    hintCode?: string;
    completionData?: {
      personalNumber: string;
      name: string;
      givenName: string;
      surname: string;
    };
  }> {
    const order = pendingOrders.get(orderRef);

    // Demo mode — auto-complete after 3 seconds
    if (order?.mode === 'demo') {
      const elapsed = Date.now() - order.startTime;
      if (elapsed < 3000) {
        return { status: 'pending', hintCode: 'outstandingTransaction' };
      }
      // Complete after 3 seconds
      pendingOrders.delete(orderRef);
      logger.info('BankID demo auth completed', { orderRef });
      return {
        status: 'complete',
        completionData: DEMO_USER,
      };
    }

    // Real mode
    try {
      const client = getClient();
      const response = await client.collect({ orderRef });

      if (response.status === 'complete' && response.completionData) {
        pendingOrders.delete(orderRef);
        return {
          status: 'complete',
          completionData: {
            personalNumber: response.completionData.user.personalNumber,
            name: response.completionData.user.name,
            givenName: response.completionData.user.givenName,
            surname: response.completionData.user.surname,
          },
        };
      }

      if (response.status === 'failed') {
        pendingOrders.delete(orderRef);
        return { status: 'failed', hintCode: response.hintCode };
      }

      return { status: 'pending', hintCode: response.hintCode };
    } catch (error: any) {
      logger.error('BankID collect failed', { error: error.message, orderRef });
      pendingOrders.delete(orderRef);
      throw new AppError(502, 'AUTH_PROVIDER_ERROR', 'BankID status check failed');
    }
  }

  /**
   * Complete BankID authentication — find or create user and return session.
   */
  async completeAuth(
    completionData: { personalNumber: string; name: string; givenName: string; surname: string },
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthSession> {
    const { personalNumber, name } = completionData;

    // Find existing user by BankID provider link
    let user = await User.findOne({
      'providers.provider': 'bankid',
      'providers.providerId': personalNumber,
    });

    if (!user) {
      // Create new user from BankID data
      user = await User.create({
        displayName: name,
        providers: [{
          provider: 'bankid',
          providerId: personalNumber,
          linkedAt: new Date(),
        }],
      });
      logger.info('New user created via BankID', { personalNumber: personalNumber.substring(0, 6) + '****' });
    }

    if (!user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_DISABLED', 'Account is disabled');
    }

    const tokens = await tokenService.generateTokenPair(user, userAgent, ipAddress);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        mobile: user.mobile,
        displayName: user.displayName,
        avatar: user.avatar,
        providers: user.providers.map((p) => p.provider),
        roles: user.roles,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens,
    };
  }

  /**
   * Cancel an ongoing BankID authentication.
   */
  async cancel(orderRef: string): Promise<void> {
    const order = pendingOrders.get(orderRef);
    if (order?.mode === 'demo') {
      pendingOrders.delete(orderRef);
      return;
    }
    try {
      const client = getClient();
      await client.cancel({ orderRef });
      pendingOrders.delete(orderRef);
    } catch (error: any) {
      logger.error('BankID cancel failed', { error: error.message, orderRef });
    }
  }
}

export const bankIdService = new BankIdService();
