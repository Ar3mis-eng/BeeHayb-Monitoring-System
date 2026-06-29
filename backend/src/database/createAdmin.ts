import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';

const createAdminAccount = async () => {
  const username = 'admin';
  const email = 'admin@beehayb.local';
  const password = 'Admin123';

  try {
    const existingUser = await UserModel.findByUsername(username);

    if (existingUser) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create(username, email, passwordHash);

    console.log(`Created admin account: ${user.username} (${user.email})`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin account:', error);
    process.exit(1);
  }
};

createAdminAccount();