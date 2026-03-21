function addMonths(dateInput, months) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid start date.');
  }

  const d = new Date(date);
  d.setMonth(d.getMonth() + Number(months));
  return d;
}

function calculateOverdue(startDate, durationMonths, balance) {
  const dueDate = addMonths(startDate, durationMonths);
  const now = new Date();
  const isOverdue = Number(balance) > 0 && now > dueDate;

  let overdueDays = 0;
  if (isOverdue) {
    const diff = now.getTime() - dueDate.getTime();
    overdueDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  return {
    dueDate,
    isOverdue,
    overdueDays
  };
}

module.exports = {
  calculateOverdue
};
