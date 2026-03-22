const { StatusCodes } = require('http-status-codes');
const { query } = require('../config/db');
const { requiredString } = require('../utils/validation');

async function createCustomer(payload) {
  const name = requiredString(payload.name, 'Name');
  const phone = requiredString(payload.phone, 'Phone');
  const address = requiredString(payload.address, 'Address');

  const result = await query(
    'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
    [name, phone, address]
  );

  return {
    id: result.insertId,
    name,
    phone,
    address
  };
}

async function updateCustomer(id, payload) {
  const name = requiredString(payload.name, 'Name');
  const phone = requiredString(payload.phone, 'Phone');
  const address = requiredString(payload.address, 'Address');

  const result = await query('UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?', [
    name,
    phone,
    address,
    Number(id)
  ]);

  if (!result.affectedRows) {
    const error = new Error('Customer not found.');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  return { id: Number(id), name, phone, address };
}

async function deleteCustomer(id) {
  const result = await query('DELETE FROM customers WHERE id = ?', [Number(id)]);

  if (!result.affectedRows) {
    const error = new Error('Customer not found.');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  return { message: 'Customer deleted successfully.' };
}

async function getCustomers(search = '', limit) {
  const term = `%${search.trim()}%`;
  const parsedLimit = Number(limit);
  const hasLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;
  const safeLimit = hasLimit ? Math.min(Math.trunc(parsedLimit), 50) : null;

  const sql =
    `SELECT id, name, phone, address, created_at
     FROM customers
     WHERE (? = '%%' OR name LIKE ? OR phone LIKE ? OR address LIKE ?)
     ORDER BY name ASC` + (hasLimit ? ' LIMIT ?' : '');

  const params = hasLimit ? [term, term, term, term, safeLimit] : [term, term, term, term];

  const rows = await query(sql, params);

  return rows;
}

module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers
};
