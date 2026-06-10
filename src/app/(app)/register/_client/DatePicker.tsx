"use client";

export default function DatePicker({ defaultValue }: { defaultValue: string }) {
  return (
    <input
      className="inp"
      type="date"
      name="date"
      defaultValue={defaultValue}
      style={{ width: 180 }}
      onChange={(e) => {
        const d = e.currentTarget.value;
        if (d) window.location.href = `/register?date=${d}`;
      }}
    />
  );
}
