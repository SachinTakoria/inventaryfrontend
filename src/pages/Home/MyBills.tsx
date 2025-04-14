// ✅ Full updated MyBills.tsx
import { useEffect, useState } from "react";
import moment from "moment";
import InvoiceViewer from "./InvoiceViewer";

const MyBills = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [amountToPay, setAmountToPay] = useState("");

  const page = 1;
  const firm = "devjyoti";

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/orders/get-orders?page=${page}&firm=${firm}`,
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
    
    }
  };

  const handlePaymentUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/orders/update-payment/${selectedInvoiceNumber.replace("/", "%2F")}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amountPaid: Number(amountToPay) }),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("✅ Payment updated");
        setAmountToPay("");
        setShowPayModal(false);
        fetchOrders();
      } else {
        alert("❌ Failed to update payment");
      }
    } catch (err) {
      alert("❌ Error occurred");
    }
  };

  const filteredOrders = orders.filter((bill) => {
    const search = searchTerm.toLowerCase();
    return (
      bill.invoiceNumber?.toLowerCase().includes(search) ||
      bill.customerName?.toLowerCase().includes(search) ||
      bill.customerPhone?.toLowerCase().includes(search) ||
      moment(bill.createdAt).format("DD MMM YYYY, hh:mm A").toLowerCase().includes(search)
    );
  });

  const groupFilteredOrders = () => {
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "day").startOf("day");

    const todayOrders = filteredOrders.filter((o) =>
      moment.utc(o.createdAt).local().isSame(today, "day")
    );

    const yesterdayOrders = filteredOrders.filter((o) =>
      moment.utc(o.createdAt).local().isSame(yesterday, "day")
    );

    const olderOrders = filteredOrders.filter(
      (o) =>
        !moment(o.createdAt).isSame(today, "day") &&
        !moment(o.createdAt).isSame(yesterday, "day")
    );

    return { todayOrders, yesterdayOrders, olderOrders };
  };

  const { todayOrders, yesterdayOrders, olderOrders } = groupFilteredOrders();

  const openModal = (id: string) => {
    setSelectedInvoiceId(id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInvoiceId(null);
  };

  const handleDownload = () => {
    const printContents = document.getElementById("printable-invoice")?.innerHTML;
    const printWindow = window.open("", "_blank");
  
    if (printWindow && printContents) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body class="bg-white p-6">
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500); // delay needed for styles to apply
    }
  };
  
  

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">🧾 My Bills</h2>

      <div className="flex justify-end mb-6">
        <input
          type="text"
          placeholder="Search by Name, Phone, Invoice or Date..."
          className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {[{ label: "Today", bills: todayOrders }, { label: "Yesterday", bills: yesterdayOrders }, { label: "Older", bills: olderOrders }].map(({ label, bills }) => (
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
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-gray-800">{bill.invoiceNumber || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-700">{bill.customerName || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-700">{bill.customerPhone || "N/A"}</td>
                      <td className="px-6 py-4 text-center">{bill.items?.length || 0}</td>
                      <td className="px-6 py-4 text-gray-700">{moment(bill.createdAt).format("DD MMM YYYY, hh:mm A")}</td>
                      <td className="px-6 py-4">
                        {bill.carryForward === 0 ? (
                          <span className="text-green-600 font-semibold">PAID ✅</span>
                        ) : (
                          <span className="text-red-600">Pending: ₹{bill.carryForward}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => openModal(bill._id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          🔍 View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoiceNumber(bill.invoiceNumber);
                            setShowPayModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          💰 Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Invoice Modal */}
      {showModal && selectedInvoiceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[90%] h-[90%] relative overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-700 hover:text-red-600 text-xl font-bold"
            >
              ✕
            </button>
            <button
  onClick={handleDownload}
  className="absolute top-4 right-16 text-blue-700 hover:text-blue-900 text-lg no-print"
  title="Download/Print Invoice"
>
  🖨️
</button>


            <div className="p-6 overflow-y-auto h-full">
              <InvoiceViewer invoiceId={selectedInvoiceId} />
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[300px]">
            <h2 className="text-xl font-bold mb-4">Update Payment</h2>
            <input
              type="number"
              placeholder="Enter amount received"
              value={amountToPay}
              onChange={(e) => setAmountToPay(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setShowPayModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBills;
