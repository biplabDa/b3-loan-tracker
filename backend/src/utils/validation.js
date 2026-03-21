function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function requiredPositiveNumber(value, name) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${name} must be greater than 0.`);
  }
  return numeric;
}

function requiredNonNegativeNumber(value, name) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${name} must be 0 or greater.`);
  }
  return numeric;
}

function requiredDate(value, name) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} is invalid.`);
  }
  return date;
}

module.exports = {
  requiredString,
  requiredPositiveNumber,
  requiredNonNegativeNumber,
  requiredDate
};
