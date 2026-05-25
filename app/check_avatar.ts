import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const d = await prisma.driver.findFirst({ orderBy: { id: 'desc' } });
  if (d) {
    if (!d.avatar || d.avatar.length === 0) {
      await prisma.driver.update({ 
        where: { id: d.id }, 
        data: { avatar: 'https://via.placeholder.com/150' } 
      });
      console.log('Updated avatar to placeholder!');
    } else {
      console.log('Avatar already exists:', d.avatar.substring(0, 50));
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
