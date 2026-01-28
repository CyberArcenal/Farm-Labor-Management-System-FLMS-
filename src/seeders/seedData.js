// src/seeders/seedData.js
//@ts-check
const { AppDataSource } = require("../main/db/dataSource");
const bcrypt = require("bcryptjs");
const fs = require("fs");

async function seedData() {
  console.log("🚀 Starting database seeding...");

  try {
    // Check if we should reset the database
    const shouldReset = process.argv.includes("--reset");
    
    if (shouldReset) {
      console.log("🔄 Resetting database before seeding...");
      await resetDatabase();
    }

    // Initialize the data source
    console.log("Initializing database...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Synchronize the database (create tables if they don't exist)
    console.log("🔄 Synchronizing database...");
    await AppDataSource.synchronize();
    console.log("✅ Database synchronized");

    // Get repositories
    const kabisilyaRepo = AppDataSource.getRepository("Kabisilya");
    const bukidRepo = AppDataSource.getRepository("Bukid");
    const pitakRepo = AppDataSource.getRepository("Pitak");
    const workerRepo = AppDataSource.getRepository("Worker");
    const assignmentRepo = AppDataSource.getRepository("Assignment");
    const debtRepo = AppDataSource.getRepository("Debt");
    const debtHistoryRepo = AppDataSource.getRepository("DebtHistory");
    const paymentRepo = AppDataSource.getRepository("Payment");
    const paymentHistoryRepo = AppDataSource.getRepository("PaymentHistory");
    const userRepo = AppDataSource.getRepository("User");
    const userActivityRepo = AppDataSource.getRepository("UserActivity");
    const auditTrailRepo = AppDataSource.getRepository("AuditTrail");
    const notificationRepo = AppDataSource.getRepository("Notification");
    const systemSettingRepo = AppDataSource.getRepository("SystemSetting");

    console.log("📦 Seeding Kabisilyas...");
    const kabisilyas = await seedKabisilyas(kabisilyaRepo);
    
    console.log("🏞️ Seeding Bukids...");
    const bukids = await seedBukids(bukidRepo, kabisilyas);
    
    console.log("📍 Seeding Pitaks...");
    const pitaks = await seedPitaks(pitakRepo, bukids);
    
    console.log("👷 Seeding Workers...");
    const workers = await seedWorkers(workerRepo, kabisilyas);
    
    console.log("📋 Seeding Assignments...");
    const assignments = await seedAssignments(assignmentRepo, workers, pitaks);
    
    console.log("💸 Seeding Debts...");
    const debts = await seedDebts(debtRepo, workers);
    
    console.log("📝 Seeding Debt History...");
    await seedDebtHistory(debtHistoryRepo, debts);
    
    console.log("💰 Seeding Payments...");
    const payments = await seedPayments(paymentRepo, workers, pitaks);
    
    console.log("📊 Seeding Payment History...");
    await seedPaymentHistory(paymentHistoryRepo, payments);
    
    console.log("👤 Seeding Users...");
    const users = await seedUsers(userRepo);
    
    console.log("📱 Seeding User Activities...");
    await seedUserActivities(userActivityRepo, users);
    
    console.log("🔍 Seeding Audit Trails...");
    await seedAuditTrails(auditTrailRepo);
    
    console.log("🔔 Seeding Notifications...");
    await seedNotifications(notificationRepo);
    
    console.log("⚙️ Seeding System Settings...");
    await seedSystemSettings(systemSettingRepo);

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Kabisilyas: ${kabisilyas.length}`);
    console.log(`   Bukids: ${bukids.length}`);
    console.log(`   Pitaks: ${pitaks.length}`);
    console.log(`   Workers: ${workers.length}`);
    console.log(`   Assignments: ${assignments.length}`);
    console.log(`   Debts: ${debts.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log(`   Users: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

async function resetDatabase() {
  try {
    console.log("🔄 Resetting database...");
    
    // Get the database path from AppDataSource options
    const dbPath = AppDataSource.options.database;
    console.log(`Database path: ${dbPath}`);
    
    // If database is initialized, destroy it first
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
        console.log("✅ Database connection closed");
      } catch (error) {
        // @ts-ignore
        console.warn("⚠️ Could not close database connection:", error.message);
      }
    }
    
    // Delete the database file and any journal files
    // @ts-ignore
    if (dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
      console.log(`🗑️  Deleting database file: ${dbPath}`);
      try {
        // @ts-ignore
        fs.unlinkSync(dbPath);
        console.log("✅ Database file deleted");
      } catch (error) {
        // @ts-ignore
        console.warn("⚠️ Could not delete database file:", error.message);
      }
    }
    
    // Delete any journal files
    const journalFiles = [
      `${dbPath}-journal`,
      `${dbPath}-wal`,
      `${dbPath}-shm`
    ];
    
    journalFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          console.log(`✅ Deleted ${file}`);
        } catch (error) {
          // Ignore errors
        }
      }
    });
    
    console.log("✅ Database reset complete");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
}

// ===================== SEED FUNCTIONS =====================

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 */
async function seedKabisilyas(repository) {
  const kabisilyas = [
    {
      name: "Main Farm",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "North Farm",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "South Farm",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const savedKabisilyas = [];
  for (const kabisilya of kabisilyas) {
    const saved = await repository.save(kabisilya);
    savedKabisilyas.push(saved);
  }

  return savedKabisilyas;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} kabisilyas
 */
async function seedBukids(repository, kabisilyas) {
  const bukids = [
    {
      name: "Bukid A",
      status: "active",
      location: "North Section",
      kabisilya: kabisilyas[0],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Bukid B",
      status: "active",
      location: "South Section",
      kabisilya: kabisilyas[0],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Bukid C",
      status: "inactive",
      location: "East Section",
      kabisilya: kabisilyas[1],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Bukid D",
      status: "active",
      location: "West Section",
      kabisilya: kabisilyas[2],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const savedBukids = [];
  for (const bukid of bukids) {
    const saved = await repository.save(bukid);
    savedBukids.push(saved);
  }

  return savedBukids;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} bukids
 */
async function seedPitaks(repository, bukids) {
  const pitaks = [
    {
      location: "Plot 1-A",
      totalLuwang: "50.00",
      status: "active",
      bukid: bukids[0],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      location: "Plot 1-B",
      totalLuwang: "45.50",
      status: "active",
      bukid: bukids[0],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      location: "Plot 2-A",
      totalLuwang: "60.00",
      status: "harvested",
      bukid: bukids[1],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      location: "Plot 3-A",
      totalLuwang: "30.25",
      status: "active",
      bukid: bukids[2],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      location: "Plot 4-A",
      totalLuwang: "55.75",
      status: "active",
      bukid: bukids[3],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const savedPitaks = [];
  for (const pitak of pitaks) {
    const saved = await repository.save(pitak);
    savedPitaks.push(saved);
  }

  return savedPitaks;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} kabisilyas
 */
async function seedWorkers(repository, kabisilyas) {
  const workers = [
    {
      name: "Juan Dela Cruz",
      contact: "+639123456789",
      email: "juan.delacruz@example.com",
      address: "123 Main St, Brgy. Sample",
      status: "active",
      hireDate: new Date("2023-01-15"),
      totalDebt: "5000.00",
      totalPaid: "12000.00",
      currentBalance: "500.00",
      kabisilya: kabisilyas[0],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Maria Santos",
      contact: "+639987654321",
      email: "maria.santos@example.com",
      address: "456 Oak St, Brgy. Example",
      status: "active",
      hireDate: new Date("2023-02-20"),
      totalDebt: "3000.00",
      totalPaid: "8000.00",
      currentBalance: "200.00",
      kabisilya: kabisilyas[0],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Pedro Reyes",
      contact: "+639555123456",
      email: "pedro.reyes@example.com",
      address: "789 Pine St, Brgy. Test",
      status: "on-leave",
      hireDate: new Date("2022-11-10"),
      totalDebt: "2000.00",
      totalPaid: "15000.00",
      currentBalance: "0.00",
      kabisilya: kabisilyas[1],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Ana Garcia",
      contact: "+639666789012",
      email: "ana.garcia@example.com",
      address: "321 Elm St, Brgy. Demo",
      status: "active",
      hireDate: new Date("2023-03-05"),
      totalDebt: "0.00",
      totalPaid: "5000.00",
      currentBalance: "100.00",
      kabisilya: kabisilyas[2],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Luis Torres",
      contact: "+639777890123",
      email: "luis.torres@example.com",
      address: "654 Maple St, Brgy. Trial",
      status: "inactive",
      hireDate: new Date("2022-08-15"),
      totalDebt: "10000.00",
      totalPaid: "20000.00",
      currentBalance: "5000.00",
      kabisilya: kabisilyas[2],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const savedWorkers = [];
  for (const worker of workers) {
    const saved = await repository.save(worker);
    savedWorkers.push(saved);
  }

  return savedWorkers;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} workers
 * @param {any[]} pitaks
 */
async function seedAssignments(repository, workers, pitaks) {
  const assignments = [
    {
      luwangCount: "10.00",
      assignmentDate: new Date("2024-01-15"),
      status: "completed",
      notes: "Regular assignment",
      worker: workers[0],
      pitak: pitaks[0],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20")
    },
    {
      luwangCount: "8.50",
      assignmentDate: new Date("2024-01-16"),
      status: "active",
      notes: "New assignment",
      worker: workers[0],
      pitak: pitaks[1],
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16")
    }
  ];

  const savedAssignments = [];
  for (const assignment of assignments) {
    const saved = await repository.save(assignment);
    savedAssignments.push(saved);
  }

  return savedAssignments;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} workers
 */
async function seedDebts(repository, workers) {
  const debts = [
    {
      originalAmount: "5000.00",
      amount: "5000.00",
      reason: "Emergency loan for medical expenses",
      balance: "500.00",
      status: "partially_paid",
      dateIncurred: new Date("2023-11-01"),
      dueDate: new Date("2024-03-01"),
      paymentTerm: "6 months",
      interestRate: "5.00",
      totalInterest: "250.00",
      totalPaid: "4500.00",
      lastPaymentDate: new Date("2024-01-10"),
      worker: workers[0],
      createdAt: new Date("2023-11-01"),
      updatedAt: new Date("2024-01-10")
    },
    {
      originalAmount: "3000.00",
      amount: "3000.00",
      reason: "Advance salary",
      balance: "200.00",
      status: "partially_paid",
      dateIncurred: new Date("2023-12-15"),
      dueDate: new Date("2024-02-15"),
      paymentTerm: "2 months",
      interestRate: "0.00",
      totalInterest: "0.00",
      totalPaid: "2800.00",
      lastPaymentDate: new Date("2024-01-15"),
      worker: workers[1],
      createdAt: new Date("2023-12-15"),
      updatedAt: new Date("2024-01-15")
    }
  ];

  const savedDebts = [];
  for (const debt of debts) {
    const saved = await repository.save(debt);
    savedDebts.push(saved);
  }

  return savedDebts;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} debts
 */
async function seedDebtHistory(repository, debts) {
  const histories = [
    {
      amountPaid: "1000.00",
      previousBalance: "5000.00",
      newBalance: "4000.00",
      transactionType: "payment",
      paymentMethod: "cash",
      referenceNumber: "PAY-001",
      notes: "Initial payment",
      transactionDate: new Date("2023-11-15"),
      debt: debts[0],
      createdAt: new Date("2023-11-15")
    }
  ];

  for (const history of histories) {
    await repository.save(history);
  }
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} workers
 * @param {any[]} pitaks
 */
async function seedPayments(repository, workers, pitaks) {
  const payments = [
    {
      grossPay: "5000.00",
      manualDeduction: "200.00",
      netPay: "4800.00",
      status: "completed",
      paymentDate: new Date("2024-01-15"),
      paymentMethod: "cash",
      referenceNumber: "PAY-2024-001",
      periodStart: new Date("2024-01-01"),
      periodEnd: new Date("2024-01-15"),
      totalDebtDeduction: "1500.00",
      otherDeductions: "200.00",
      deductionBreakdown: JSON.stringify({ "debt": 1500, "tax": 200 }),
      notes: "Bi-weekly payment",
      worker: workers[0],
      pitak: pitaks[0],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    }
  ];

  const savedPayments = [];
  for (const payment of payments) {
    const saved = await repository.save(payment);
    savedPayments.push(saved);
  }

  return savedPayments;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} payments
 */
async function seedPaymentHistory(repository, payments) {
  const histories = [
    {
      actionType: "create",
      changedField: "grossPay",
      oldValue: null,
      newValue: "5000.00",
      oldAmount: "0.00",
      newAmount: "5000.00",
      notes: "Payment created",
      performedBy: "admin",
      payment: payments[0],
      changeDate: new Date("2024-01-15")
    }
  ];

  for (const history of histories) {
    await repository.save(history);
  }
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 */
async function seedUsers(repository) {
  // Hash passwords
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync("admin123", salt);
  const userPassword = bcrypt.hashSync("user123", salt);

  const users = [
    {
      username: "admin",
      email: "admin@kabisilya.com",
      password: adminPassword,
      role: "admin",
      isActive: true,
      lastLogin: new Date("2024-01-20"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-20")
    },
    {
      username: "manager",
      email: "manager@kabisilya.com",
      password: userPassword,
      role: "manager",
      isActive: true,
      lastLogin: new Date("2024-01-19"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-19")
    }
  ];

  const savedUsers = [];
  for (const user of users) {
    const saved = await repository.save(user);
    savedUsers.push(saved);
  }

  return savedUsers;
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 * @param {any[]} users
 */
async function seedUserActivities(repository, users) {
  const activities = [
    {
      user_id: users[0].id,
      action: "login",
      entity: null,
      entity_id: null,
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: "Successful login",
      created_at: new Date("2024-01-20 08:30:00")
    }
  ];

  for (const activity of activities) {
    await repository.save(activity);
  }
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 */
async function seedAuditTrails(repository) {
  const trails = [
    {
      action: "DATA_EXPORT",
      actor: "system",
      details: JSON.stringify({ format: "CSV", entity: "workers", count: 5 }),
      timestamp: new Date("2024-01-20 10:00:00")
    }
  ];

  for (const trail of trails) {
    await repository.save(trail);
  }
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 */
async function seedNotifications(repository) {
  const notifications = [
    {
      type: "payment_due",
      context: JSON.stringify({ workerId: 1, amount: "500.00", dueDate: "2024-01-25" }),
      timestamp: new Date()
    }
  ];

  for (const notification of notifications) {
    await repository.save(notification);
  }
}

/**
 * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} repository
 */
async function seedSystemSettings(repository) {
  const { SettingType } = require("../entities/systemSettings");
  
  const settings = [
    {
      key: "company_name",
      value: "Kabisilya Management System",
      setting_type: SettingType.GENERAL,
      description: "Name of the company/farm",
      is_public: true,
      is_deleted: false
    },
    {
      key: "currency",
      value: "PHP",
      setting_type: SettingType.GENERAL,
      description: "Default currency",
      is_public: true,
      is_deleted: false
    },
    {
      key: "payment_terms",
      value: "15",
      setting_type: SettingType.GENERAL,
      description: "Default payment terms in days",
      is_public: false,
      is_deleted: false
    }
  ];

  for (const setting of settings) {
    await repository.save(setting);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };