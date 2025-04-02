import { useEffect, useState } from "react";
import moment from "moment";

const CustomerLedger = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  // ✅ Fetch all customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/consumers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.consumers) setCustomers(data.consumers);
    };
    fetchCustomers();
  }, []);

  // ✅ Fetch orders when customer selected
  useEffect(() => {
    const fetchLedger = async () => {
      if (!selectedPhone) return;
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/by-customer?phone=${selectedPhone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.orders) setOrders(data.orders);
    };
    fetchLedger();
  }, [selectedPhone]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4">📋 Customer Ledger</h2>

      <label className="block mb-2 font-semibold">Select Customer:</label>
      <select
        value={selectedPhone}
        onChange={(e) => setSelectedPhone(e.target.value)}
        className="border p-2 mb-4 w-full max-w-md"
      >
        <option value="">-- Select Customer --</option>
        {customers.map((cust) => (
          <option key={cust._id} value={cust.phone}>
            {cust.name} ({cust.phone})
          </option>
        ))}
      </select>

      {orders.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Invoice No</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Paid</th>
                <th className="border p-2">Pending</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{order.invoiceNumber}</td>
                  <td className="border p-2 text-center">{moment(order.createdAt).format("DD MMM YYYY")}</td>
                  <td className="border p-2 text-center">₹{order.totalAmountWithGST || order.totalAmount}</td>
                  <td className="border p-2 text-center">₹{order.amountPaid || 0}</td>
                  <td className="border p-2 text-center text-red-600 font-semibold">₹{order.carryForward || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedPhone ? (
        <p className="mt-6 text-gray-500">No orders found for this customer.</p>
      ) : null}
    </div>
  );
};

export default CustomerLedger;
