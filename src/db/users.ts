import prisma from './prisma';
import { User } from '@prisma/client';

export async function getUserByAuthId(authProviderId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { authProviderId },
  });
}

export async function createOrUpdateUser(data: {
  authProviderId: string;
  email: string;
  displayName?: string | null;
}): Promise<User> {
  return prisma.user.upsert({
    where: { authProviderId: data.authProviderId },
    update: {
      // Only update email, NOT displayName (preserve user's choice)
      email: data.email,
    },
    create: {
      authProviderId: data.authProviderId,
      email: data.email,
      displayName: data.displayName,
    },
  });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

