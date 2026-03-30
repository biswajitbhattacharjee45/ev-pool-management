/**
 * Pure business logic extracted from index.html for testing.
 * index.html is NOT modified — these functions mirror it exactly.
 */

// ── CONSTANTS ─────────────────────────────────────────────────
const ADMIN_PF_IDS = ["360664", "361739"];
const ADMIN_1 = { pfId: "360664", name: "Biswajit Bhattacharjee" };
const ADMIN_2 = { pfId: "361739", name: "Abhijit Bhattacharjee" };

// ── DATE / TIME UTILITIES ──────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtTime = (t) => t || "—";

// ── AUTHENTICATION ─────────────────────────────────────────────

/**
 * Hashes a plain-text password.
 * Mirrors: const hashPw = (pw) => btoa(encodeURIComponent(pw + "_evpool_salt"));
 */
const hashPw = (pw) => Buffer.from(encodeURIComponent(pw + "_evpool_salt")).toString("base64");

/**
 * Checks a plain-text password against the stored passwords map.
 * Default password (when no entry exists) is the pfId itself.
 *
 * Mirrors the checkPassword closure in App(), made pure by accepting
 * the passwords map as a parameter.
 */
const checkPassword = (pfId, plainPw, passwords = {}) => {
  const stored = passwords[pfId];
  if (!stored) {
    return plainPw === pfId;
  }
  return stored === hashPw(plainPw);
};

// ── TRIP AVAILABILITY ──────────────────────────────────────────

/**
 * Returns the active approved trip for a car (no returnTime + approved).
 * Mirrors: const activeTripForCar = (carId) => trips.find(...)
 */
const activeTripForCar = (carId, trips) =>
  trips.find((t) => t.carId === carId && !t.returnTime && t.approvalStatus === "approved");

/**
 * Returns true if the car has an active approved trip.
 * Mirrors: const isCarBusy = (carId) => !!activeTripForCar(carId)
 */
const isCarBusy = (carId, trips) => !!activeTripForCar(carId, trips);

// ── BOOKING VALIDATION ─────────────────────────────────────────

/**
 * Returns true if a non-admin user already has an active or pending trip
 * (either as the booker or the officer).
 *
 * Mirrors the userHasActiveTrip derived value in BookTrip component.
 */
const userHasActiveTrip = (userPfId, trips, isAdmin = false) => {
  if (isAdmin) return false;
  return trips.some(
    (t) =>
      !t.returnTime &&
      (t.approvalStatus === "approved" || t.approvalStatus === "pending") &&
      (t.bookedByPfId === userPfId || t.officerPfId === userPfId)
  );
};

/**
 * Validates a booking request. Returns null if valid, or an error string.
 * Mirrors the validation block at the top of handleBook() in BookTrip.
 */
const validateBooking = ({ matchedUser, carId, destination, date, departureTime, trips, cars, userPfId, isAdmin }) => {
  if (!matchedUser) return "Please enter a valid PF ID first.";
  if (!carId || !destination || !date || !departureTime) return "Please fill all required fields.";
  if (isCarBusy(carId, trips)) return "This vehicle is currently on duty.";
  if (userHasActiveTrip(userPfId, trips, isAdmin)) return "You already have an active/pending trip.";
  return null;
};

// ── APPROVAL WORKFLOW ──────────────────────────────────────────

/**
 * Applies an admin's approval to a single trip object.
 * Mirrors the map callback inside handleApprove() in Approvals component.
 */
const applyApproval = (trip, approverPfId) => {
  const newApprovedBy = [...(trip.approvedBy || [])];
  if (!newApprovedBy.includes(approverPfId)) newApprovedBy.push(approverPfId);
  const fullyApproved = newApprovedBy.includes(ADMIN_1.pfId) || newApprovedBy.includes(ADMIN_2.pfId);
  return { ...trip, approvedBy: newApprovedBy, approvalStatus: fullyApproved ? "approved" : "pending" };
};

/**
 * Applies a rejection to a single trip object.
 * Mirrors the map callback inside handleReject() in Approvals component.
 */
const applyRejection = (trip, rejecterPfId, rejecterName, reason) => ({
  ...trip,
  approvalStatus: "rejected",
  rejectedBy: rejecterPfId,
  rejectedByName: rejecterName,
  rejectionReason: reason,
});

// ── AGGREGATIONS ───────────────────────────────────────────────

/**
 * Total kWh charged across all fuel logs.
 * Mirrors: fuelLogs.reduce((s, f) => s + (parseFloat(f.kwh) || 0), 0).toFixed(1)
 */
const fuelTotalKwh = (fuelLogs) =>
  parseFloat(fuelLogs.reduce((s, f) => s + (parseFloat(f.kwh) || 0), 0).toFixed(1));

/**
 * Total charging cost across all fuel logs.
 * Mirrors: fuelLogs.reduce((s, f) => s + (parseFloat(f.chargingCost) || 0), 0).toFixed(0)
 */
const fuelTotalCost = (fuelLogs) =>
  parseInt(fuelLogs.reduce((s, f) => s + (parseFloat(f.chargingCost) || 0), 0).toFixed(0), 10);

/**
 * Count of pending maintenance records.
 * Mirrors: maintenance.filter(m => m.status === "Pending").length
 */
const maintenancePendingCount = (maintenance) =>
  maintenance.filter((m) => m.status === "Pending").length;

/**
 * Total maintenance cost across all records.
 * Mirrors: maintenance.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0)
 */
const maintenanceTotalCost = (maintenance) =>
  maintenance.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0);

/**
 * Toggle a maintenance record's status between Pending and Completed.
 * Mirrors: toggleStatus() in Maintenance component.
 */
const toggleMaintenanceStatus = (maintenance, id) =>
  maintenance.map((m) =>
    m.id === id ? { ...m, status: m.status === "Pending" ? "Completed" : "Pending" } : m
  );

module.exports = {
  ADMIN_1,
  ADMIN_2,
  ADMIN_PF_IDS,
  today,
  now,
  fmtDate,
  fmtTime,
  hashPw,
  checkPassword,
  activeTripForCar,
  isCarBusy,
  userHasActiveTrip,
  validateBooking,
  applyApproval,
  applyRejection,
  fuelTotalKwh,
  fuelTotalCost,
  maintenancePendingCount,
  maintenanceTotalCost,
  toggleMaintenanceStatus,
};
