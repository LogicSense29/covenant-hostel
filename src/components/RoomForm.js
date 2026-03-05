"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./RoomForm.module.css";

export default function RoomForm({ initialData }) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    roomNumber: initialData?.roomNumber || "",
    rentAmount: initialData?.rentAmount || "",
    status: initialData?.status || "AVAILABLE",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/rooms/${initialData.id}` : "/api/rooms";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/landlord/rooms");
        router.refresh();
      } else {
        const text = await res.text();
        setError(text || "Failed to save room.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isEditing ? "Edit Room" : "Add New Room"}</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="roomNumber" className={styles.label}>Room Number / Name</label>
          <input
            id="roomNumber"
            name="roomNumber"
            type="text"
            required
            className={styles.input}
            placeholder="e.g. 101, 102A"
            value={formData.roomNumber}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="rentAmount" className={styles.label}>Rent Amount (₦)</label>
          <input
            id="rentAmount"
            name="rentAmount"
            type="number"
            step="0.01"
            min="0"
            required
            className={styles.input}
            placeholder="e.g. 1500.00"
            value={formData.rentAmount}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="status" className={styles.label}>Room Status</label>
          <select
            id="status"
            name="status"
            className={styles.input}
            value={formData.status}
            onChange={handleChange}
            disabled={isEditing && initialData.status === "OCCUPIED" && formData.status !== "OCCUPIED"} // Logic prevention
          >
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED" disabled={!isEditing || initialData.status !== "OCCUPIED"}>Occupied (Assigned by system)</option>
            <option value="EXPIRED_RENT">Expired Rent</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <Link href="/landlord/rooms" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : "Save Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
