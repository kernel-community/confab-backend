import prisma from './services/database/client';
import all from './all.json';
(async () => {
  // const promises: any[] = [];
  for (let i = 0; i < all.length; i ++) {
    console.log(
        'updating for', all[i].id,
    );
    const b = await prisma.event.findUnique({
      where: {
        id: all[i].id,
      },
    });

    console.log('from', b?.startDateTime);
    console.log('to', all[i].startDateTime);

    await prisma.event.update({
      where: {
        id: all[i].id,
      },
      data: {
        startDateTime: all[i].startDateTime.replace(/ /g, ''),
        endDateTime: all[i].endDateTime.replace(/ /g, ''),
      },
    });
  };
// Promise.all(promises);
})();
