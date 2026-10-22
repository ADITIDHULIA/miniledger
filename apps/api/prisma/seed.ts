import "dotenv/config";
import { config } from "../src/config";
import { prisma } from "../src/lib/prisma";

const DAY = 24 * 60 * 60 * 1000;
const SEED_PHONE = "+919999999999";

async function main() {
  if (config.isTest) throw new Error("Do not seed in test mode");
  const user = await prisma.user.upsert({ where: { phone: SEED_PHONE }, update: {}, create: { phone: SEED_PHONE } });
  await prisma.loan.deleteMany({ where: { userId: user.id } });
  const now = Date.now();
  const loans = [
    { friendName: "Rohan Mehta", amountPaise: 250000, dueDate: new Date(now - 10 * DAY), notes: "Concert tickets" },
    { friendName: "Priya Sharma", amountPaise: 120050, dueDate: new Date(now + 5 * DAY), notes: "Cab share" },
    { friendName: "Karan Singh", amountPaise: 500000, dueDate: new Date(now + 20 * DAY) },
    {
      friendName: "Ananya Rao",
      amountPaise: 80000,
      dueDate: new Date(now - 3 * DAY),
      isRepaid: true,
      repaidAt: new Date(now - 1 * DAY),
    },
    { friendName: "Vikram Nair", amountPaise: 150000, dueDate: new Date(now - 2 * DAY), notes: "Hostel fees" },
  ];
  for (const [i, loan] of loans.entries()) {
    await prisma.loan.create({
      data: { userId: user.id, createdAt: new Date(now - (loans.length - i) * DAY), ...loan },
    });
  }
  console.log(
    `Seeded ${loans.length} loans for ${SEED_PHONE}. Log in with that number (check the API console for the OTP).`,
  );
}

main().finally(() => prisma.$disconnect());
