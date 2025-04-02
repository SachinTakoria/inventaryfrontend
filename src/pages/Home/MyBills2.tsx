import { useEffect, useState } from "react";
import moment from "moment";
import { Link } from "react-router-dom";

const MyBills2 = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const page = 1;
  const firm = "shreesai";

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/orders/get-orders?page=${page}&firm=${firm}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.orders?.length > 0) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching Shree Sai bills:", err);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((bill) => {
    const search = searchTerm.toLowerCase();
    return (
      bill.invoiceNumber?.toLowerCase().includes(search) ||
      bill.customerName?.toLowerCase().includes(search) ||
      bill.customerPhone?.toLowerCase().includes(search) ||
      moment(bill.createdAt)
        .format("DD MMM YYYY, hh:mm A")
        .toLowerCase()
        .includes(search)
    );
  });

  const groupFilteredOrders = () => {
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

    const todayOrders = filteredOrders.filter((o) =>
      moment(o.createdAt).isSame(today, "day")
    );
    const yesterdayOrders = filteredOrders.filter((o) =>
      moment(o.createdAt).isSame(yesterday, "day")
    );
    const olderOrders = filteredOrders.filter(
      (o) =>
        !moment(o.createdAt).isSame(today, "day") &&
        !moment(o.createdAt).isSame(yesterday, "day")
    );

    return { todayOrders, yesterdayOrders, olderOrders };
  };

  const { todayOrders, yesterdayOrders, olderOrders } = groupFilteredOrders();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        🧾 My Bills - Shree Sai Suit
      </h2>

      <div className="flex justify-end mb-6">
        <input
          type="text"
          placeholder="Search by Name, Phone, Invoice or Date..."
          className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {[
        { label: "Today", bills: todayOrders },
        { label: "Yesterday", bills: yesterdayOrders },
        { label: "Older", bills: olderOrders },
      ].map(({ label, bills }) => (
        <div key={label} className="mb-10">
          <h3 className="text-2xl font-semibold mb-4 text-gray-700">{label}</h3>

          {bills.length === 0 ? (
            <p className="text-gray-500">No bills available</p>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-700 text-left uppercase font-semibold tracking-wide">
                  <tr>
                    <th className="px-6 py-3">Invoice No</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Mobile No.</th>
                    <th className="px-6 py-3 text-center">Products</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {bills.map((bill) => (
                    <tr
                      key={bill._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {bill.invoiceNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {bill.customerName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {bill.customerPhone || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {bill.items?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {moment(bill.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/invoice-view/${bill._id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
                        >
                          🔍 <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyBills2;
