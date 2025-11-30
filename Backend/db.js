// db.js
// SQLite-backed DB helpers for users, contacts and cart
// Callback-style API (keeps compatibility with your server.js)

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const DB_PATH = path.join(__dirname, "users.db");
const SALT_ROUNDS = 10;

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Failed to connect to the database:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to SQLite database.");
    initializeDatabase();
  }
});

// Handle database process termination
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("❌ Failed to close database:", err.message);
    } else {
      console.log("✅ Database connection closed.");
    }
    process.exit(0);
  });
});

// Initialize database tables (idempotent)
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        username TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error("❌ Failed to create users table:", err.message);
        } else {
          console.log("✅ Users table is ready.");
          db.run("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
        }
      }
    );

    // Contacts table
    db.run(
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error("❌ Failed to create contacts table:", err.message);
        } else {
          console.log("✅ Contacts table is ready.");
        }
      }
    );

    // Carts table (note: plural "carts" — server fallbacks expect this)
    db.run(
      `CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )`,
      (err) => {
        if (err) {
          console.error("❌ Failed to create carts table:", err.message);
        } else {
          console.log("✅ Carts table is ready.");
          db.run("CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id)");
          db.run("CREATE INDEX IF NOT EXISTS idx_carts_product_id ON carts(product_id)");
        }
      }
    );
  });
}

/* -------------------------
   User management functions
   ------------------------- */

function registerUser(name, email, plainPassword, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  if (!name || !email || !plainPassword) {
    return callback(new Error("Name, email, and password are required"));
  }

  const trimmedName = String(name).trim();
  const trimmedEmail = String(email).trim();
  const trimmedPass = String(plainPassword);

  if (!trimmedName || !trimmedEmail || !trimmedPass) {
    return callback(new Error("Name, email, and password cannot be empty"));
  }

  bcrypt.hash(trimmedPass, SALT_ROUNDS, (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
      return callback(err);
    }

    const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    db.run(query, [trimmedName, trimmedEmail, hash], function (err) {
      if (err) {
        console.error("Database error during registration:", err);
        if (err.message && err.message.includes("UNIQUE constraint failed")) {
          return callback(new Error("Email already exists"));
        }
        return callback(err);
      }
      callback(null, this.lastID);
    });
  });
}

function authenticateUser(email, plainPassword, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  if (!email || !plainPassword) return callback(new Error("Email and password are required"));

  const trimmedEmail = String(email).trim();
  const query = `SELECT * FROM users WHERE email = ?`;

  db.get(query, [trimmedEmail], (err, user) => {
    if (err) {
      console.error("DB error during authenticateUser:", err);
      return callback(err);
    }
    if (!user) return callback(null, null);

    bcrypt.compare(String(plainPassword), user.password, (err, match) => {
      if (err) {
        console.error("bcrypt error:", err);
        return callback(err);
      }
      if (!match) return callback(null, null);

      const userData = { ...user };
      delete userData.password;
      return callback(null, userData);
    });
  });
}

function updateUserProfile(userId, profileData, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const id = typeof userId === "string" ? parseInt(userId, 10) : userId;
  if (!id || isNaN(id) || id <= 0) return callback(new Error("Valid user ID is required"));

  const updates = {
    name: profileData.name?.trim() || "",
    username: profileData.username?.trim() || "",
    bio: profileData.bio?.trim() || "",
    location: profileData.location?.trim() || "",
    website: profileData.website?.trim() || "",
  };

  const query = `
    UPDATE users
    SET name = ?, username = ?, bio = ?, location = ?, website = ?
    WHERE id = ?`;

  db.run(query, [updates.name, updates.username, updates.bio, updates.location, updates.website, id], function (err) {
    if (err) return callback(err);
    callback(null, this.changes > 0);
  });
}

function getUserById(userId, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const id = typeof userId === "string" ? parseInt(userId, 10) : userId;
  if (!id || isNaN(id) || id <= 0) return callback(new Error("Valid user ID is required"));

  // Quick DB health test then actual query (keeps earlier defensive checks)
  db.get("SELECT 1 as test", [], (testErr) => {
    if (testErr) {
      console.error("Database connection test failed:", testErr);
      return callback(new Error("Database connection test failed"));
    }

    const query = "SELECT id, name, email FROM users WHERE id = ?";
    db.get(query, [id], (err, row) => {
      if (err) return callback(err);
      callback(null, row || null);
    });
  });
}

function getUserByEmail(email, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  if (!email || typeof email !== "string") return callback(new Error("Valid email is required"));

  const trimmed = email.trim();
  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [trimmed], (err, row) => {
    if (err) return callback(err);
    callback(null, row || null);
  });
}

/* -------------------------
   Contact functions
   ------------------------- */

function saveContact(name, email, message, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  if (!name || !email || !message) return callback(new Error("Name, email, and message are required"));

  const q = `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`;
  db.run(q, [name.trim(), email.trim(), message.trim()], function (err) {
    if (err) return callback(err);
    callback(null, this.lastID);
  });
}

/* -------------------------
   Cart functions (carts table)
   ------------------------- */

// Return cart items for a user
function getCartByUserId(userId, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const id = typeof userId === "string" ? parseInt(userId, 10) : userId;
  if (!id || isNaN(id) || id <= 0) return callback(new Error("Valid user ID is required"));

  const query = `
    SELECT
      product_id as id,
      email,
      title,
      price,
      image,
      quantity
    FROM carts
    WHERE user_id = ?
  `;
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error("Error fetching cart:", err);
      return callback(err);
    }
    callback(null, rows || []);
  });
}

// Replace user's cart with a provided array of items (transactional)
function saveCart(userId, email, cartItems, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const id = typeof userId === "string" ? parseInt(userId, 10) : userId;
  if (!id || isNaN(id) || id <= 0) return callback(new Error("Valid user ID is required"));
  if (!email || typeof email !== "string") return callback(new Error("Valid email is required"));
  if (!Array.isArray(cartItems)) return callback(new Error("cartItems must be an array"));

  db.serialize(() => {
    const rollback = (err) => {
      db.run("ROLLBACK", () => callback(err));
    };

    db.run("BEGIN TRANSACTION", (beginErr) => {
      if (beginErr) return rollback(beginErr);

      db.run(`DELETE FROM carts WHERE user_id = ?`, [id], (delErr) => {
        if (delErr) return rollback(delErr);

        const insertStmt = db.prepare(`
          INSERT INTO carts (user_id, product_id, email, title, price, image, quantity)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        let hasError = false;
        for (const item of cartItems) {
          if (hasError) break;
          insertStmt.run(
            id,
            item.id,
            email.trim(),
            item.title?.trim() || "",
            typeof item.price === "number" ? item.price : 0,
            item.image?.trim() || "",
            typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
            (insertErr) => {
              if (insertErr) {
                hasError = true;
                console.error("Insert cart item error:", insertErr);
              }
            }
          );
        }

        insertStmt.finalize((finalizeErr) => {
          if (finalizeErr || hasError) return rollback(finalizeErr || new Error("Insert error"));
          db.run("COMMIT", (commitErr) => {
            if (commitErr) return rollback(commitErr);
            callback(null);
          });
        });
      });
    });
  });
}

// Add item or increment if exists (uses ON CONFLICT)
function addOrUpdateCartItem(userId, email, item, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const id = typeof userId === "string" ? parseInt(userId, 10) : userId;
  if (!id || isNaN(id) || id <= 0) return callback(new Error("Valid user ID is required"));
  if (!email || typeof email !== "string") return callback(new Error("Valid email is required"));
  if (!item || typeof item !== "object" || !item.id) return callback(new Error("Item must have an id"));

  const query = `
    INSERT INTO carts (user_id, product_id, email, title, price, image, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET
      quantity = quantity + excluded.quantity,
      title = excluded.title,
      price = excluded.price,
      image = excluded.image
  `;

  db.run(
    query,
    [
      id,
      item.id,
      email.trim(),
      item.title?.trim() || "",
      typeof item.price === "number" ? item.price : 0,
      item.image?.trim() || "",
      typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
    ],
    function (err) {
      if (err) return callback(err);
      callback(null, this.lastID);
    }
  );
}

// Update a single cart item's quantity
function updateCartItemQuantity(userId, productId, quantity, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const uid = typeof userId === "string" ? parseInt(userId, 10) : userId;
  const pid = typeof productId === "string" ? parseInt(productId, 10) : productId;
  const q = typeof quantity === "string" ? parseInt(quantity, 10) : quantity;

  if (!uid || isNaN(uid) || uid <= 0) return callback(new Error("Valid user ID is required"));
  if (!pid || isNaN(pid) || pid <= 0) return callback(new Error("Valid product ID is required"));
  if (!q || isNaN(q) || q <= 0) return callback(new Error("Quantity must be a positive number"));

  const query = `UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?`;
  db.run(query, [q, uid, pid], function (err) {
    if (err) return callback(err);
    callback(null, this.changes > 0);
  });
}

// Remove single cart item
function removeCartItem(userId, productId, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const uid = typeof userId === "string" ? parseInt(userId, 10) : userId;
  const pid = typeof productId === "string" ? parseInt(productId, 10) : productId;

  if (!uid || isNaN(uid) || uid <= 0) return callback(new Error("Valid user ID is required"));
  if (!pid || isNaN(pid) || pid <= 0) return callback(new Error("Valid product ID is required"));

  const query = `DELETE FROM carts WHERE user_id = ? AND product_id = ?`;
  db.run(query, [uid, pid], function (err) {
    if (err) return callback(err);
    callback(null, this.changes > 0);
  });
}

// Clear all cart items for user
function clearCart(userId, callback) {
  if (typeof callback !== "function") throw new Error("Callback required");
  const uid = typeof userId === "string" ? parseInt(userId, 10) : userId;
  if (!uid || isNaN(uid) || uid <= 0) return callback(new Error("Valid user ID is required"));

  const query = `DELETE FROM carts WHERE user_id = ?`;
  db.run(query, [uid], function (err) {
    if (err) return callback(err);
    callback(null, this.changes > 0);
  });
}

/* -------------------------
   Export API
   ------------------------- */

module.exports = {
  db,

  // Users
  registerUser,
  authenticateUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,

  // Contacts
  saveContact,

  // Cart
  getCartByUserId,
  saveCart,
  addOrUpdateCartItem,
  updateCartItemQuantity,
  removeCartItem,
  // alias for compatibility (server may call deleteCartItem)
  deleteCartItem: removeCartItem,
  clearCart,
};
