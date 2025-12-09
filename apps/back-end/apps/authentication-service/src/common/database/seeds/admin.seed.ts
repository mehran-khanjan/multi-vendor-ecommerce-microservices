// src/database/seeds/admin.seed.ts
import { DataSource } from 'typeorm';
import { User, UserStatus } from '@modules/users/entities/user.entity';
import { UserProfile } from '@modules/users/entities/user-profile.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { CryptoUtil } from '@common/utils';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const profileRepository = dataSource.getRepository(UserProfile);
  const roleRepository = dataSource.getRepository(Role);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@site.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  let admin = await userRepository.findOne({
    where: { email: adminEmail.toLowerCase() },
  });

  if (!admin) {
    const superAdminRole = await roleRepository.findOne({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      console.error('Super admin role not found. Run role seeds first.');
      return;
    }

    const passwordHash = await CryptoUtil.hashPassword(adminPassword);

    admin = userRepository.create({
      email: adminEmail.toLowerCase(),
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      roles: [superAdminRole],
    });

    admin = await userRepository.save(admin);

    // Create profile
    const profile = profileRepository.create({ userId: admin.id });
    await profileRepository.save(profile);

    console.log(`Created super admin: ${adminEmail}`);
  }
}
