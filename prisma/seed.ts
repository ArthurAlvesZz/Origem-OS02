import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create a Demo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demonstração COFCOF.CO',
      document: '00.000.000/0001-00',
      plan: 'pro'
    }
  });

  // 2. Create an Admin Role
  const role = await prisma.role.create({
    data: {
      name: 'owner',
      description: 'Dono do sistema'
    }
  });

  // 3. Create a Demo User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Admin Demo',
      email: 'admin@demo.local',
      passwordHash,
    }
  });

  // 4. Link User to Tenant
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      roleId: role.id
    }
  });

  // 5. Create some initial products
  await prisma.product.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Café Especial Torrado 250g',
        category: 'Café Torrado',
        sku: 'CAFE-250G',
        unit: 'pct',
        unitCost: 15.50,
        unitPrice: 45.00,
        minStock: 10,
        isInput: false,
      },
      {
        tenantId: tenant.id,
        name: 'Embalagem Kraft com Válvula 250g',
        category: 'Insumo',
        sku: 'EMB-KRAFT-250',
        unit: 'un',
        unitCost: 1.20,
        unitPrice: 0,
        minStock: 100,
        isInput: true,
      },
      {
        tenantId: tenant.id,
        name: 'Café Cru Arábica Premium (Saca 60kg)',
        category: 'Insumo',
        sku: 'CAFE-CRU-60',
        unit: 'kg',
        unitCost: 20.00,
        unitPrice: 0,
        minStock: 60,
        isInput: true,
      }
    ]
  });

  // 6. Seed Inventory
  const products = await prisma.product.findMany({ where: { tenantId: tenant.id } });
  for (const p of products) {
    if (p.sku === 'CAFE-250G') {
      await prisma.stockMovement.create({
        data: { tenantId: tenant.id, productId: p.id, movementType: 'Entrada', qty: 50, reason: 'Saldo Inicial', userId: user.id }
      });
      await prisma.stockMovement.create({
        data: { tenantId: tenant.id, productId: p.id, movementType: 'Perda', qty: 2, reason: 'Embalagem rasgada', userId: user.id }
      });
      await prisma.stockMovement.create({
        data: { tenantId: tenant.id, productId: p.id, movementType: 'Ajuste', qty: 100, reason: 'Inventário físico', userId: user.id }
      });
    }
  }

  // 7. Seed Orders (Optional Demo Order)
  const productA = products.find(p => p.sku === 'CAFE-250G');
  if (productA) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        type: 'B2C',
        name: 'Cliente Exemplo Demo',
        email: 'cliente@exemplo.com'
      }
    });

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        customerName: customer.name,
        channel: 'pdv',
        subtotal: 45.0,
        total: 45.0,
        estimatedCost: 15.5,
        estimatedProfit: 29.5,
        estimatedMargin: (29.5 / 45.0) * 100,
        paymentMethod: 'Cartão de Crédito',
        paymentStatus: 'paid',
        status: 'confirmed',
        createdBy: user.id,
        items: {
          create: [{
            productId: productA.id,
            name: productA.name,
            sku: productA.sku,
            qty: 1,
            unitPrice: 45.0,
            unitCost: 15.5,
            lineTotal: 45.0,
            estimatedProfit: 29.5
          }]
        }
      }
    });

    // Associated stock movement and financial transaction
    await prisma.stockMovement.create({
      data: { tenantId: tenant.id, productId: productA.id, movementType: 'Saída', qty: 1, unitCost: 15.5, reason: 'Venda de Exemplo', referenceType: 'order', referenceId: order.id, userId: user.id }
    });

    await prisma.financialTransaction.create({
      data: { tenantId: tenant.id, orderId: order.id, type: 'receivable', status: 'paid', category: 'Venda de Produtos', description: 'Venda de Exemplo', amount: 45.0, paidAmount: 45.0, date: new Date(), dueDate: new Date(), paidAt: new Date(), paymentMethod: 'Cartão de Crédito', source: 'order', createdBy: user.id }
    });
  }

  // 8. Seed Finance (Expenses)
  await prisma.financialTransaction.create({
    data: {
      tenantId: tenant.id,
      type: 'payable',
      status: 'pending',
      category: 'Serviços',
      description: 'Manutenção Máquina',
      amount: 150.0,
      paidAmount: 0,
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      source: 'manual_expense',
      createdBy: user.id
    }
  });

  await prisma.financialTransaction.create({
    data: {
      tenantId: tenant.id,
      type: 'expense',
      status: 'paid',
      category: 'Insumos',
      description: 'Embalagens G',
      amount: 400.0,
      paidAmount: 400.0,
      date: new Date(),
      dueDate: new Date(),
      paidAt: new Date(),
      paymentMethod: 'Pix',
      source: 'manual_expense',
      createdBy: user.id
    }
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
