
# Kabisilya Management System

A desktop application built with **Electron** and **Vite React/TypeScript** to streamline labor and financial management in rice farming. The system focuses on organizing workers per pitak, tracking debts, calculating payments based on luwang planted, and supporting manual deductions for fairness and transparency.

---

## ✨ Features

- **Worker Registry**  
  Maintain a list of all workers grouped under each kabisilya.

- **Pitak Assignment**  
  Assign workers to specific pitak and record the number of luwang planted.

- **Payment Calculation**  
  Compute gross pay based on fixed rate (₱230 per luwang).  
  Allow manual deduction of debts to avoid full automatic deduction.  
  Track net pay and pending balances.

- **Debt Management**  
  Record, update, and monitor worker debts.  
  Deduction history per payout for audit safety.

- **Filtering & Reporting**  
  Single unified table with filters by bukid, worker, or payment status.  
  Generate reports for pending payments, cleared debts, and productivity.

- **Notifications**  
  Audit-safe events such as:  
  - `pitak_assignment_updated`  
  - `payment_pending`  
  - `payment_completed`  
  - `debt_updated`

---

## 🛠️ Tech Stack

- **Electron** – Desktop app runtime  
- **Vite** – Fast build tool and dev server  
- **React + TypeScript** – Frontend framework and type safety  
- **SQLite / Postgres (optional)** – For persistent storage of workers, debts, and payments  

---

## 📊 Database Schema (Simplified)

**Workers**  
- `worker_id`, `name`, `kabisilya_id`

**Bukid**  
- `bukid_id`, `name`, `location`

**Assignments**  
- `assignment_id`, `bukid_id`, `worker_id`, `luwang_count`

**Payments**  
- `payment_id`, `worker_id`, `bukid_id`, `gross_pay`, `manual_deduction`, `net_pay`, `status`

**Debts**  
- `debt_id`, `worker_id`, `amount`, `balance`, `status`

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kabisilya-management.git
   cd kabisilya-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the app in development:
   ```bash
   npm run dev
   ```

4. Build the desktop app:
   ```bash
   npm run build
   ```

---

## 📌 Roadmap

- [ ] Worker attendance integration  
- [ ] Export reports to CSV/PDF  
- [ ] Role-based access (Admin vs Kabisilya)  
- [ ] Multi-language support (Filipino/English)  

---

## ⚖️ License

MIT License – free to use and modify for your farming or labor management projects.
```
