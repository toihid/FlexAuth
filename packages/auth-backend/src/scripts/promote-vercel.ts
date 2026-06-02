import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(
    'mongodb+srv://toihid-mongodb:RW8F5YR8vZ24aL7k@projects.efxqmdb.mongodb.net/flexauth'
  );

  const result = await mongoose.connection.db
    .collection('users')
    .updateOne(
      { email: 'admin@flexauth.dev' },
      { $set: { roles: ['user', 'admin'] } }
    );

  console.log('Modified:', result.modifiedCount);

  const user = await mongoose.connection.db
    .collection('users')
    .findOne({ email: 'admin@flexauth.dev' });

  console.log('Roles now:', user?.roles);

  await mongoose.disconnect();
}

main();
