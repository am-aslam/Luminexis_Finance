import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';
import crypto from 'crypto';

export class InvitationsService {
  static async create(data: { email: string; role: 'CO_FOUNDER' | 'ADMIN' }) {
    const email = data.email.toLowerCase().trim();

    // 1. Verify if user is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      throw new ConflictError('A corporate account is already registered with this email address.');
    }

    // 2. Remove any old pending invitation for this email to prevent unique constraints
    await prisma.invitation.deleteMany({
      where: { email }
    });

    // 3. Generate a secure random invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days validity

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: data.role,
        token,
        expiresAt
      }
    });

    // Generate the invitation URL
    const invitationUrl = `http://localhost:5173/signup?token=${token}`;
    
    // Log the invitation link to console (acting as mock email delivery)
    console.log(`\n======================================================`);
    console.log(`[INVITATION EMAIL MOCK]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Join the Luminexis Corporate Vault`);
    console.log(`Body: You have been invited to join the team as ${data.role}.`);
    console.log(`Accept invite here: ${invitationUrl}`);
    console.log(`======================================================\n`);

    return {
      ...invitation,
      invitationUrl
    };
  }

  static async getDetailsByToken(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      throw new NotFoundError('The invitation token is invalid or does not exist.');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ValidationError('This invitation has expired.');
    }

    return invitation;
  }

  static async list() {
    return prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async delete(id: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    await prisma.invitation.delete({
      where: { id }
    });

    return { id };
  }
}
