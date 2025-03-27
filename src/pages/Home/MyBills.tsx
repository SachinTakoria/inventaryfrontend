import { useEffect, useState } from "react";
import moment from "moment";
import { Link } from "react-router-dom";

const MyBills = () => {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/all-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success && data.orders?.length > 0) {
          setInvoices(data.orders);
        } else {
          setInvoices([]);
        }
      } catch (err) {
        console.error("🔥 Error fetching invoices", err);
      }
    };

    fetchInvoices();
  }, []);

  const groupInvoicesByDate = () => {
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

    const todayInvoices = invoices.filter((b) =>
      moment(b.createdAt).isSame(today, "day")
    );
    const yesterdayInvoices = invoices.filter((b) =>
      moment(b.createdAt).isSame(yesterday, "day")
    );
    const olderInvoices = invoices.filter(
      (b) =>
        !moment(b.createdAt).isSame(today, "day") &&
        !moment(b.createdAt).isSame(yesterday, "day")
    );

    return { todayInvoices, yesterdayInvoices, olderInvoices };
  };

  const { todayInvoices, yesterdayInvoices, olderInvoices } = groupInvoicesByDate();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">🧾 My Bills</h2>

      {[
        { label: "Today", bills: todayInvoices },
        { label: "Yesterday", bills: yesterdayInvoices },
        { label: "Older", bills: olderInvoices },
      ].map(({ label, bills }) => (
        <div key={label} className="mb-6">
          <h3 className="text-lg font-bold mb-2">{label}</h3>
          {bills.length === 0 ? (
            <p className="text-gray-500">No bills</p>
          ) : (
            <div className="grid gap-4">
              {bills.map((bill: any) => (
                <div
                  key={bill._id}
                  className="border p-4 rounded-lg shadow bg-white"
                >
                  <p>
                    <strong>Customer:</strong> {bill.customerName}
                  </p>
                  <p>
                    <strong>State:</strong> {bill.customerState}
                  </p>
                  <p>
                    <strong>Products:</strong> {bill.items?.length || 0}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {moment(bill.createdAt).format("DD MMM YYYY, hh:mm A")}
                  </p>

                  {/* ✅ View invoice button */}
                  <Link
                    to={`/invoice-view/${bill._id}`}
                    className="text-blue-600 font-medium mt-2 inline-block"
                    target="_blank"
                  >
                    View Invoice
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyBills;
