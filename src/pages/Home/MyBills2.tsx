import { useEffect, useState } from "react";
import moment from "moment";
import { Link } from "react-router-dom";

const MyBills2 = () => {
  // ✅ Shree Sai Bills
  const [orders, setOrders] = useState<any[]>([]);

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
      } catch (err) {}
    };

    fetchOrders();
  }, []);

  const groupOrdersByDate = () => {
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

    const todayOrders = orders.filter((o) =>
      moment(o.createdAt).isSame(today, "day")
    );
    const yesterdayOrders = orders.filter((o) =>
      moment(o.createdAt).isSame(yesterday, "day")
    );
    const olderOrders = orders.filter(
      (o) =>
        !moment(o.createdAt).isSame(today, "day") &&
        !moment(o.createdAt).isSame(yesterday, "day")
    );

    return { todayOrders, yesterdayOrders, olderOrders };
  };

  const { todayOrders, yesterdayOrders, olderOrders } = groupOrdersByDate();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        🧾 My Bills - Shree Sai Suit
      </h2>

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
            <div className="flex gap-5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 pb-2">
              {bills.map((bill) => (
                <div
                  key={bill._id}
                  className="min-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-md p-5 hover:shadow-lg transition-all"
                >
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      Invoice No:
                    </span>{" "}
                    {bill.invoiceNumber || "N/A"}
                  </p>

                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      Customer:
                    </span>{" "}
                    {bill.customerName || "N/A"}
                  </p>
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">State:</span>{" "}
                    {bill.customerState || "N/A"}
                  </p>
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      Products:
                    </span>{" "}
                    {bill.items?.length || 0}
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Date:</span>{" "}
                    {moment(bill.createdAt).format("DD MMM YYYY, hh:mm A")}
                  </p>

                  <Link
                    to={`/invoice-view/${bill._id}`}
                    target="_blank"
                    className="inline-block text-sm font-semibold text-blue-600 hover:underline"
                  >
                    🔍 View Invoice
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

export default MyBills2;
