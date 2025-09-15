import { PrismaService } from '@/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

/**
 * Service for managing user data.
 */
@Injectable()
export class UsersService {
  /**
   * Creates an instance of UsersService.
   *
   * @param {Repository<User>} UserRepository - Repository for user entities.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all users with their profiles.
   *
   * @returns {Promise<User[]>} A promise that resolves to an array of users with profiles.
   */
  async findAll(): Promise<any[]> {
    return this.prisma.user.findMany({
      include: { profile: true },
    });
  }

  /**
   * Gets a user by username.
   *
   * @param {string} identifier - The username of the user to find.
   * @returns {Promise<User>} A promise that resolves to the user entity.
   * @throws {NotFoundException} If the user is not found.
   */
  async findOne(identifier: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username: identifier },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }
}
