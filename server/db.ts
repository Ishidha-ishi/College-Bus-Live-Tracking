import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let dbInstance: SqlJsDatabase | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'buslive.sqlite');

// Helper to calculate distance using the Haversine formula (returns meters)
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function saveDatabase() {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  let db: SqlJsDatabase;

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(new Uint8Array(fileBuffer));
      console.log('Loaded existing database from disk:', DB_FILE);
    } catch (e) {
      console.warn('Could not read existing DB, creating fresh instance:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Initialized brand new in-memory SQLite database.');
  }

  dbInstance = db;
  initializeSchema(db);
  seedInitialData(db);
  saveDatabase();

  return dbInstance;
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function executeRun(sql: string, params: any[] = []): { changes: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDatabase();
  return { changes: 1 };
}

function initializeSchema(db: SqlJsDatabase) {
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'staff', 'driver', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      department TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      route_code TEXT UNIQUE NOT NULL,
      route_name TEXT NOT NULL,
      starting_point TEXT NOT NULL,
      destination TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      total_distance_km REAL NOT NULL,
      morning_time TEXT,
      evening_time TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS bus_stops (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      stop_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      sequence_order INTEGER NOT NULL,
      morning_pickup_time TEXT,
      evening_drop_time TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      bus_number TEXT UNIQUE NOT NULL,
      registration_number TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      assigned_driver_id TEXT,
      assigned_route_id TEXT,
      status TEXT DEFAULT 'idle' CHECK(status IN ('active', 'in_trip', 'idle', 'delayed', 'maintenance', 'offline')),
      current_lat REAL,
      current_lng REAL,
      speed REAL DEFAULT 0,
      heading REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_driver_id) REFERENCES users(id),
      FOREIGN KEY (assigned_route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      reg_no TEXT UNIQUE NOT NULL,
      year_of_study TEXT NOT NULL,
      department TEXT NOT NULL,
      assigned_bus_id TEXT,
      assigned_route_id TEXT,
      assigned_stop_id TEXT,
      parent_phone TEXT,
      account_status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_bus_id) REFERENCES buses(id),
      FOREIGN KEY (assigned_route_id) REFERENCES routes(id),
      FOREIGN KEY (assigned_stop_id) REFERENCES bus_stops(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      staff_id TEXT UNIQUE NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      assigned_bus_id TEXT,
      assigned_route_id TEXT,
      assigned_stop_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_bus_id) REFERENCES buses(id),
      FOREIGN KEY (assigned_route_id) REFERENCES routes(id),
      FOREIGN KEY (assigned_stop_id) REFERENCES bus_stops(id)
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      license_no TEXT UNIQUE NOT NULL,
      experience_years INTEGER NOT NULL,
      assigned_bus_id TEXT,
      rating REAL DEFAULT 4.9,
      emergency_contact TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_bus_id) REFERENCES buses(id)
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      bus_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      trip_type TEXT DEFAULT 'morning_pickup',
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'paused', 'completed', 'cancelled')),
      start_time DATETIME,
      end_time DATETIME,
      distance_km REAL DEFAULT 0,
      passenger_count INTEGER DEFAULT 0,
      FOREIGN KEY (bus_id) REFERENCES buses(id),
      FOREIGN KEY (driver_id) REFERENCES users(id),
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS bus_locations (
      id TEXT PRIMARY KEY,
      bus_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL DEFAULT 0,
      heading REAL DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id),
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      fee_amount REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL,
      payment_status TEXT NOT NULL CHECK(payment_status IN ('PAID', 'PARTIALLY PAID', 'NOT PAID', 'OVERDUE')),
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      fee_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      receipt_number TEXT UNIQUE NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (fee_id) REFERENCES fees(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('BUS_APPROACHING', 'BUS_ARRIVED', 'BUS_DELAY', 'TRIP_STARTED', 'TRIP_COMPLETED', 'EMERGENCY', 'FEE_REMINDER', 'FEE_PAYMENT', 'SYSTEM')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'emergency')),
      target_role TEXT,
      target_bus_id TEXT,
      target_route_id TEXT,
      target_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_recipients (
      id TEXT PRIMARY KEY,
      notification_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
    CREATE INDEX IF NOT EXISTS idx_buses_number ON buses(bus_number);
    CREATE INDEX IF NOT EXISTS idx_stops_route ON bus_stops(route_id);
    CREATE INDEX IF NOT EXISTS idx_locations_bus ON bus_locations(bus_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
    CREATE INDEX IF NOT EXISTS idx_notif_recip ON notification_recipients(user_id, is_read);
  `);
}

function seedInitialData(db: SqlJsDatabase) {
  // Check if users already seeded
  const check = db.exec("SELECT COUNT(*) as count FROM users;");
  const count = check[0]?.values[0]?.[0] as number;
  if (count && count > 0) {
    return; // already seeded
  }

  console.log('Seeding initial production data into SQLite...');

  // Default demo passwords hashed with bcrypt
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const studentHash = bcrypt.hashSync('student123', salt);
  const staffHash = bcrypt.hashSync('staff123', salt);
  const driverHash = bcrypt.hashSync('driver123', salt);

  // 1. Users
  db.run(`
    INSERT INTO users (id, email, password_hash, role, name, phone, department, status) VALUES
    ('usr_admin_1', 'admin@campus.edu.in', '${adminHash}', 'admin', 'Dr. S. Senthil Kumar', '+91 94430 00001', 'Salem Campus Fleet & Transport Bureau', 'active'),
    ('usr_student_1', 'karthik@student.campus.edu.in', '${studentHash}', 'student', 'Karthik Selvam', '+91 98401 11223', 'Computer Science & Engineering', 'active'),
    ('usr_student_2', 'ananya@student.campus.edu.in', '${studentHash}', 'student', 'Ananya Sundaram', '+91 98402 22334', 'Information Technology', 'active'),
    ('usr_student_3', 'kavin@student.campus.edu.in', '${studentHash}', 'student', 'Kavin Raj M.', '+91 98403 33445', 'Mechanical Engineering', 'active'),
    ('usr_student_4', 'priya@student.campus.edu.in', '${studentHash}', 'student', 'Priya Ramasamy', '+91 98405 55667', 'Electronics & Comm. Engg', 'active'),
    ('usr_staff_1', 'arvind@faculty.campus.edu.in', '${staffHash}', 'staff', 'Dr. Arvind Swaminathan', '+91 98404 44556', 'School of Computing', 'active'),
    ('usr_driver_1', 'murugan@driver.campus.edu.in', '${driverHash}', 'driver', 'Murugan P.', '+91 94430 12345', 'Operations Division', 'active'),
    ('usr_driver_2', 'selvaraj@driver.campus.edu.in', '${driverHash}', 'driver', 'Selvaraj K.', '+91 94430 67890', 'Operations Division', 'active'),
    ('usr_driver_3', 'rajan@driver.campus.edu.in', '${driverHash}', 'driver', 'Rajan M.', '+91 94430 55443', 'Operations Division', 'active'),
    ('usr_driver_4', 'govind@driver.campus.edu.in', '${driverHash}', 'driver', 'Govindasamy N.', '+91 94430 99887', 'Operations Division', 'active')
  `);

  // 2. Routes
  db.run(`
    INSERT INTO routes (id, route_code, route_name, starting_point, destination, color_hex, total_distance_km, morning_time, evening_time, status) VALUES
    ('rt_slm_01', 'SLM-01', 'Salem New Bus Stand – 5 Roads – Meyyanur Line', 'Salem New Bus Stand', 'Salem Campus Main Portico', '#F59E0B', 14.8, '07:20 AM', '04:45 PM', 'active'),
    ('rt_slm_04', 'SLM-04', 'Salem Junction – Suramangalam – Mamangam Bypass', 'Salem Railway Junction', 'Campus South Engineering Gate', '#10B981', 12.4, '07:30 AM', '04:45 PM', 'active'),
    ('rt_slm_07', 'SLM-07', 'Hasthampatti – Gorimedu – Yercaud Foothills Line', 'Hasthampatti Roundtana', 'Campus PG & Research Complex', '#0EA5E9', 16.2, '07:15 AM', '04:45 PM', 'active'),
    ('rt_slm_11', 'SLM-11', 'Ammapet – Dadagapatti – Seelanaickenpatti Line', 'Ammapet Main Bus Stop', 'Campus East Gate', '#8B5CF6', 18.5, '07:10 AM', '04:45 PM', 'active')
  `);

  // 3. Bus Stops
  db.run(`
    INSERT INTO bus_stops (id, route_id, stop_name, latitude, longitude, sequence_order, morning_pickup_time, evening_drop_time) VALUES
    -- Route SLM-01 Stops
    ('stp_01_1', 'rt_slm_01', 'Salem New Bus Stand (Central Bay 6)', 11.6663, 78.1408, 1, '07:20 AM', '05:30 PM'),
    ('stp_01_2', 'rt_slm_01', '5 Roads Roundtana (Kurangu Chavadi Rd)', 11.6685, 78.1345, 2, '07:32 AM', '05:18 PM'),
    ('stp_01_3', 'rt_slm_01', 'Meyyanur Bypass Circle (ARRS)', 11.6748, 78.1288, 3, '07:44 AM', '05:06 PM'),
    ('stp_01_4', 'rt_slm_01', 'Steel Plant Road Junction', 11.6812, 78.1215, 4, '07:55 AM', '04:55 PM'),
    ('stp_01_5', 'rt_slm_01', 'Salem Campus Main Portico', 11.6918, 78.1152, 5, '08:08 AM', '04:45 PM'),

    -- Route SLM-04 Stops
    ('stp_04_1', 'rt_slm_04', 'Salem Railway Junction (Suramangalam)', 11.6608, 78.1235, 1, '07:30 AM', '05:25 PM'),
    ('stp_04_2', 'rt_slm_04', 'Suramangalam Market (Mariamman Kovil)', 11.6652, 78.1192, 2, '07:40 AM', '05:15 PM'),
    ('stp_04_3', 'rt_slm_04', 'Jagir Ammapalayam Bypass', 11.6720, 78.1140, 3, '07:50 AM', '05:05 PM'),
    ('stp_04_4', 'rt_slm_04', 'Mamangam Flyover Service Lane', 11.6815, 78.1118, 4, '08:00 AM', '04:55 PM'),
    ('stp_04_5', 'rt_slm_04', 'Campus South Engineering Gate', 11.6905, 78.1135, 5, '08:12 AM', '04:45 PM'),

    -- Route SLM-07 Stops
    ('stp_07_1', 'rt_slm_07', 'Hasthampatti Roundtana', 11.6710, 78.1585, 1, '07:15 AM', '05:35 PM'),
    ('stp_07_2', 'rt_slm_07', 'Gorimedu Collectorate Quarters', 11.6820, 78.1630, 2, '07:28 AM', '05:20 PM'),
    ('stp_07_3', 'rt_slm_07', 'Adivaram (Yercaud Foothills Checkpost)', 11.6955, 78.1720, 3, '07:42 AM', '05:08 PM'),
    ('stp_07_4', 'rt_slm_07', 'Kannankurichi Junction', 11.6980, 78.1510, 4, '07:55 AM', '04:58 PM'),
    ('stp_07_5', 'rt_slm_07', 'Campus PG & Research Complex', 11.6930, 78.1170, 5, '08:10 AM', '04:45 PM'),

    -- Route SLM-11 Stops
    ('stp_11_1', 'rt_slm_11', 'Ammapet Main Bus Stop (Sengunthar Hall)', 11.6540, 78.1760, 1, '07:10 AM', '05:40 PM'),
    ('stp_11_2', 'rt_slm_11', 'Dadagapatti Gate', 11.6390, 78.1550, 2, '07:25 AM', '05:25 PM'),
    ('stp_11_3', 'rt_slm_11', 'Seelanaickenpatti NH-44 Ring Road Interchange', 11.6295, 78.1420, 3, '07:38 AM', '05:12 PM'),
    ('stp_11_4', 'rt_slm_11', 'Kandhampatty Bypass Overbridge', 11.6580, 78.1180, 4, '07:52 AM', '04:58 PM'),
    ('stp_11_5', 'rt_slm_11', 'Campus East Gate', 11.6912, 78.1165, 5, '08:08 AM', '04:45 PM')
  `);

  // 4. Buses
  db.run(`
    INSERT INTO buses (id, bus_number, registration_number, capacity, assigned_driver_id, assigned_route_id, status, current_lat, current_lng, speed, heading, is_active, last_updated) VALUES
    ('bus_01', 'BUS-01', 'TN-27-AL-4920', 52, 'usr_driver_1', 'rt_slm_01', 'in_trip', 11.6748, 78.1288, 38, 335, 1, CURRENT_TIMESTAMP),
    ('bus_04', 'BUS-04', 'TN-30-BY-8812', 48, 'usr_driver_2', 'rt_slm_04', 'active', 11.6652, 78.1192, 28, 350, 1, CURRENT_TIMESTAMP),
    ('bus_07', 'BUS-07', 'TN-54-AA-3301', 54, 'usr_driver_3', 'rt_slm_07', 'delayed', 11.6820, 78.1630, 16, 290, 1, CURRENT_TIMESTAMP),
    ('bus_11', 'BUS-11', 'TN-27-CZ-6194', 50, 'usr_driver_4', 'rt_slm_11', 'idle', 11.6295, 78.1420, 0, 0, 1, CURRENT_TIMESTAMP)
  `);

  // 5. Students
  db.run(`
    INSERT INTO students (id, user_id, reg_no, year_of_study, department, assigned_bus_id, assigned_route_id, assigned_stop_id, parent_phone, account_status) VALUES
    ('std_01', 'usr_student_1', '710023104042', '3rd Year', 'Computer Science & Engineering', 'bus_01', 'rt_slm_01', 'stp_01_3', '+91 94431 88990', 'active'),
    ('std_02', 'usr_student_2', '710024205018', '2nd Year', 'Information Technology', 'bus_04', 'rt_slm_04', 'stp_04_3', '+91 94432 77881', 'active'),
    ('std_03', 'usr_student_3', '710023114035', 'Final Year', 'Mechanical Engineering', 'bus_07', 'rt_slm_07', 'stp_07_2', '+91 94433 66772', 'active'),
    ('std_04', 'usr_student_4', '710023106071', '3rd Year', 'Electronics & Comm. Engg', 'bus_11', 'rt_slm_11', 'stp_11_2', '+91 94434 55663', 'active')
  `);

  // 6. Staff
  db.run(`
    INSERT INTO staff (id, user_id, staff_id, designation, department, assigned_bus_id, assigned_route_id, assigned_stop_id) VALUES
    ('stf_01', 'usr_staff_1', 'FAC-SLM-409', 'Professor & Dean', 'School of Computing', 'bus_01', 'rt_slm_01', 'stp_01_2')
  `);

  // 7. Drivers
  db.run(`
    INSERT INTO drivers (id, user_id, license_no, experience_years, assigned_bus_id, rating, emergency_contact) VALUES
    ('drv_01', 'usr_driver_1', 'DL-TN27-2015-8841', 12, 'bus_01', 4.9, '+91 94430 00111'),
    ('drv_02', 'usr_driver_2', 'DL-TN30-2012-4412', 15, 'bus_04', 4.8, '+91 94430 00222'),
    ('drv_03', 'usr_driver_3', 'DL-TN54-2018-9903', 8, 'bus_07', 4.7, '+91 94430 00333'),
    ('drv_04', 'usr_driver_4', 'DL-TN27-2010-1120', 16, 'bus_11', 4.9, '+91 94430 00444')
  `);

  // 8. Active Trip
  db.run(`
    INSERT INTO trips (id, bus_id, driver_id, route_id, trip_type, status, start_time, distance_km, passenger_count) VALUES
    ('trp_active_01', 'bus_01', 'usr_driver_1', 'rt_slm_01', 'morning_pickup', 'in_progress', datetime('now', '-25 minutes'), 8.4, 38)
  `);

  // 9. Fees
  db.run(`
    INSERT INTO fees (id, student_id, academic_year, fee_amount, amount_paid, balance, payment_status, due_date, status) VALUES
    ('fee_01', 'std_01', '2026-2027', 16500, 16500, 0, 'PAID', '2026-08-15', 'active'),
    ('fee_02', 'std_02', '2026-2027', 16500, 9500, 7000, 'PARTIALLY PAID', '2026-09-30', 'active'),
    ('fee_03', 'std_03', '2026-2027', 18000, 0, 18000, 'OVERDUE', '2026-08-31', 'active'),
    ('fee_04', 'std_04', '2026-2027', 18000, 0, 18000, 'NOT PAID', '2026-10-15', 'active')
  `);

  // 10. Fee Payments History
  db.run(`
    INSERT INTO fee_payments (id, fee_id, student_id, amount, payment_method, transaction_ref, receipt_number, payment_date, notes) VALUES
    ('pay_01', 'fee_01', 'std_01', 16500, 'UPI (GooglePay)', 'UPI-TXN-SLM-84920412', 'REC-2026-SLM-0841', datetime('now', '-20 days'), 'Full semester transit pass payment verified'),
    ('pay_02', 'fee_02', 'std_02', 9500, 'Net Banking (SBI)', 'SBI-NEFT-99120401', 'REC-2026-SLM-0912', datetime('now', '-10 days'), 'Installment 1 of 2 cleared')
  `);

  // 11. Initial Notifications
  db.run(`
    INSERT INTO notifications (id, title, message, type, priority, target_role, target_bus_id, target_route_id, target_user_id) VALUES
    ('notif_01', 'BUS-01 Trip Commenced', 'BUS-01 has departed from Salem New Bus Stand on Route SLM-01.', 'TRIP_STARTED', 'normal', 'student', 'bus_01', 'rt_slm_01', NULL),
    ('notif_02', 'Traffic Slowdown at Gorimedu', 'Route SLM-07 delayed by ~12 mins due to Collectorate overpass maintenance.', 'BUS_DELAY', 'high', 'all', 'bus_07', 'rt_slm_07', NULL),
    ('notif_03', 'Transport Pass Fee Reminder', 'Term II transport fee balance due before September 30, 2026.', 'FEE_REMINDER', 'normal', 'student', NULL, NULL, NULL)
  `);

  // 12. Notification recipients
  db.run(`
    INSERT INTO notification_recipients (id, notification_id, user_id, is_read) VALUES
    ('nr_01', 'notif_01', 'usr_student_1', 0),
    ('nr_02', 'notif_02', 'usr_student_3', 0),
    ('nr_03', 'notif_03', 'usr_student_2', 0),
    ('nr_04', 'notif_03', 'usr_student_4', 0)
  `);

  console.log('Production database seeded successfully.');
}
