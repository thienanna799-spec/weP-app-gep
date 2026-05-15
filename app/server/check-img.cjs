const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.material.findMany({ select: { id: true, name: true, imageUrl: true } }).then(list => {
  list.forEach(m => {
    const hasImg = m.imageUrl ? `YES (${m.imageUrl.substring(0, 30)}... len=${m.imageUrl.length})` : 'NO';
    console.log(`${m.name}: imageUrl=${hasImg}`);
  });
  p.$disconnect();
}).catch(e => { console.error(e.message); p.$disconnect(); });
