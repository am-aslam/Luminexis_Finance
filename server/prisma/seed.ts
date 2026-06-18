import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  await prisma.bankTransaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.capitalContribution.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();

  console.log('Seeding categories...');
  const categories = [
    { name: 'Rent', type: 'EXPENSE' },
    { name: 'Software', type: 'EXPENSE' },
    { name: 'Operations', type: 'EXPENSE' },
    { name: 'Utilities', type: 'EXPENSE' },
    { name: 'Marketing', type: 'EXPENSE' },
    { name: 'Travel', type: 'EXPENSE' },
    { name: 'SaaS Revenue', type: 'INCOME' },
    { name: 'Consulting', type: 'INCOME' }
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  console.log('Seeding vendors...');
  const vendors = [
    { name: 'Regus Offices', category: 'Rent' },
    { name: 'AWS Cloud', category: 'Software' },
    { name: 'Vercel', category: 'Software' },
    { name: 'GitHub', category: 'Software' },
    { name: 'Google Workspace', category: 'Software' },
    { name: 'Slack Technologies', category: 'Software' }
  ];

  const vendorMap: { [key: string]: string } = {};
  for (const v of vendors) {
    const created = await prisma.vendor.create({ data: v });
    vendorMap[v.name] = created.id;
  }

  console.log('Seeding users...');
  const hashedPassword = await bcrypt.hash('founder123', 12);
  const cofounderHashedPassword = await bcrypt.hash('cofounder123', 12);

  const founder = await prisma.user.create({
    data: {
      name: 'Aakesh',
      email: 'founder@luminexis.com',
      password: hashedPassword,
      role: 'FOUNDER'
    }
  });

  const cofounder = await prisma.user.create({
    data: {
      name: 'Co-founder',
      email: 'cofounder@luminexis.com',
      password: cofounderHashedPassword,
      role: 'CO_FOUNDER'
    }
  });

  console.log('Seeding Capital Injections...');
  const capitalContributions = [
    {
      date: new Date('2026-06-01'),
      description: 'Initial Capital Injection',
      amount: 5000.00,
      paymentMethod: 'BANK_TRANSFER',
      contributorId: founder.id
    },
    {
      date: new Date('2026-06-08'),
      description: 'Founder Loan',
      amount: 2000.00,
      paymentMethod: 'BANK_TRANSFER',
      contributorId: founder.id
    },
    {
      date: new Date('2026-06-12'),
      description: 'Co-founder Seed Equity',
      amount: 10000.00,
      paymentMethod: 'BANK_TRANSFER',
      contributorId: cofounder.id
    },
    {
      date: new Date('2026-06-18'),
      description: 'Angel Funding Placement',
      amount: 15000.00,
      paymentMethod: 'BANK_TRANSFER',
      contributorId: founder.id
    }
  ];

  const capitalIds: string[] = [];
  for (const cap of capitalContributions) {
    const created = await prisma.capitalContribution.create({ data: cap });
    capitalIds.push(created.id);
  }

  console.log('Seeding Income entries...');
  const incomes = [
    {
      date: new Date('2026-06-05'),
      category: 'SaaS Revenue',
      description: 'Acme Corp Subscription Payment',
      totalAmount: 1589.88,
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-10'),
      category: 'SaaS Revenue',
      description: 'Stark Industries Enterprise Fee',
      totalAmount: 2500.00,
      paymentMethod: 'BANK_TRANSFER',
      status: 'COMPLETED',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-15'),
      category: 'Consulting',
      description: 'Wayne Corp Retainer',
      totalAmount: 1200.00,
      paymentMethod: 'BANK_TRANSFER',
      status: 'COMPLETED',
      paidById: cofounder.id
    },
    {
      date: new Date('2026-06-20'),
      category: 'SaaS Revenue',
      description: 'Oscorp SaaS Subscription',
      totalAmount: 800.00,
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-22'),
      category: 'SaaS Revenue',
      description: 'Globex Overages Invoice #223',
      totalAmount: 350.00,
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-25'),
      category: 'SaaS Revenue',
      description: 'Tyrell SaaS Subscription',
      totalAmount: 600.00,
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      paidById: cofounder.id
    }
  ];

  const incomeIds: string[] = [];
  for (const inc of incomes) {
    const created = await prisma.income.create({ data: inc });
    incomeIds.push(created.id);
  }

  console.log('Seeding Expenses...');
  const expensesList = [
    {
      date: new Date('2026-06-02'),
      category: 'Rent',
      vendorId: vendorMap['Regus Offices'],
      description: 'Co-working desks rent',
      baseAmount: 2118.64,
      gstPercent: 18,
      gstAmount: 381.36,
      totalAmount: 2500.00,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PAID',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-03'),
      category: 'Software',
      vendorId: vendorMap['AWS Cloud'],
      description: 'EC2 and RDS instances hosting',
      baseAmount: 720.76,
      gstPercent: 18,
      gstAmount: 129.74,
      totalAmount: 850.50,
      paymentMethod: 'CARD',
      status: 'PAID',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-04'),
      category: 'Software',
      vendorId: vendorMap['Vercel'],
      description: 'Frontend serverless hosting platform',
      baseAmount: 152.54,
      gstPercent: 18,
      gstAmount: 27.46,
      totalAmount: 180.00,
      paymentMethod: 'CARD',
      status: 'PAID',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-05'),
      category: 'Software',
      vendorId: vendorMap['GitHub'],
      description: 'Copilot and team seats subscription',
      baseAmount: 69.49,
      gstPercent: 18,
      gstAmount: 12.51,
      totalAmount: 82.00,
      paymentMethod: 'CARD',
      status: 'PAID',
      paidById: founder.id
    },
    {
      date: new Date('2026-06-06'),
      category: 'Software',
      vendorId: vendorMap['Google Workspace'],
      description: 'Team corporate email accounts',
      baseAmount: 101.69,
      gstPercent: 18,
      gstAmount: 18.31,
      totalAmount: 120.00,
      paymentMethod: 'CARD',
      status: 'PAID',
      paidById: founder.id
    }
  ];

  const expenseIds: string[] = [];
  for (const exp of expensesList) {
    const created = await prisma.expense.create({ data: exp });
    expenseIds.push(created.id);
  }

  console.log('Generating Bank Ledger Transactions (exactly 10 entries)...');
  const transactions = [
    {
      date: new Date('2026-06-01'),
      type: 'CAPITAL',
      description: 'Capital: Founder Equity (Initial Capital Injection)',
      credit: 5000.00,
      debit: 0,
      balance: 5000.00
    },
    {
      date: new Date('2026-06-02'),
      type: 'EXPENSE',
      description: 'Expense: Regus Offices - Co-working desks rent',
      credit: 0,
      debit: 2500.00,
      balance: 2500.00,
      relatedExpenseId: expenseIds[0]
    },
    {
      date: new Date('2026-06-03'),
      type: 'EXPENSE',
      description: 'Expense: AWS Cloud - EC2 and RDS instances hosting',
      credit: 0,
      debit: 850.50,
      balance: 1649.50,
      relatedExpenseId: expenseIds[1]
    },
    {
      date: new Date('2026-06-04'),
      type: 'EXPENSE',
      description: 'Expense: Vercel - Frontend serverless hosting platform',
      credit: 0,
      debit: 180.00,
      balance: 1469.50,
      relatedExpenseId: expenseIds[2]
    },
    {
      date: new Date('2026-06-05'),
      type: 'EXPENSE',
      description: 'Expense: GitHub - Copilot and team seats subscription',
      credit: 0,
      debit: 82.00,
      balance: 1387.50,
      relatedExpenseId: expenseIds[3]
    },
    {
      date: new Date('2026-06-05'),
      type: 'INCOME',
      description: 'Income: Acme Corp - Acme Corp Subscription Payment',
      credit: 1589.88,
      debit: 0,
      balance: 2977.38,
      relatedIncomeId: incomeIds[0]
    },
    {
      date: new Date('2026-06-06'),
      type: 'EXPENSE',
      description: 'Expense: Google Workspace - Team corporate email accounts',
      credit: 0,
      debit: 120.00,
      balance: 2857.38,
      relatedExpenseId: expenseIds[4]
    },
    {
      date: new Date('2026-06-08'),
      type: 'CAPITAL',
      description: 'Capital: Founder Equity (Founder Loan)',
      credit: 2000.00,
      debit: 0,
      balance: 4857.38
    },
    {
      date: new Date('2026-06-12'),
      type: 'CAPITAL',
      description: 'Capital: Co-founder Seed Equity (Co-founder Seed Equity)',
      credit: 10000.00,
      debit: 0,
      balance: 14857.38
    },
    {
      date: new Date('2026-06-18'),
      type: 'CAPITAL',
      description: 'Capital: Founder Equity (Angel Funding Placement)',
      credit: 15000.00,
      debit: 0,
      balance: 29857.38
    }
  ];

  for (const tx of transactions) {
    await prisma.bankTransaction.create({ data: tx });
  }

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
