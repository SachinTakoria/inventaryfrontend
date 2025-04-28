import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CSVLink } from "react-csv";


interface InvoiceItem {
  product: { productName: string };
  quantity: number;
  price: number;
  remark?: string;
}

interface PurchaseInvoice {
  _id: string;
  supplier: string;
  invoiceNumber: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
}

const PurchaseInvoiceList = ({ refreshInvoices }: { refreshInvoices: boolean }) => {

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/purchase-invoice/all`);
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshInvoices]);
  

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const searchTerm = search.toLowerCase();
  
    const supplierMatch = invoice.supplier.toLowerCase().includes(searchTerm);
    const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(searchTerm);
    const dateMatch = moment(invoice.date).format("DD/MM/YYYY").includes(searchTerm);
  
    return supplierMatch || invoiceNumberMatch || dateMatch;
  });
  

  return (
    <div className="bg-white p-6 rounded shadow mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Purchase Invoice List</h2>
      <CSVLink
    data={invoices.map((invoice) => ({
      Supplier: invoice.supplier,
      InvoiceNumber: invoice.invoiceNumber,
      Date: moment(invoice.date).format("DD/MM/YYYY"),
      TotalAmount: invoice.totalAmount,
      Products: invoice.items.map(item => `${item.product?.productName || "Unknown"} (Qty: ${item.quantity})`).join(", ")
    }))}
    filename="purchase_invoices.csv"
    className="text-2xl text-blue-600 hover:text-blue-800"
    title="Download CSV"
  >
    📥
  </CSVLink>

      <input
        type="text"
        placeholder="Search by Supplier Name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border mb-4 p-2 rounded text-sm w-full sm:max-w-xs"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded shadow">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-left">Invoice Number</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Total Amount</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice, index) => (
              <>
                <tr key={invoice._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{invoice.supplier}</td>
                  <td className="p-3">{invoice.invoiceNumber}</td>
                  <td className="p-3">{moment(invoice.date).format("DD/MM/YYYY")}</td>
                  <td className="p-3 font-semibold">
  {invoice.gstType === "with" ? (
    <>
      ₹{(invoice.totalAmount + (invoice.totalAmount * (invoice.gstRate || 0) / 100)).toFixed(2)}
      <span className="text-xs text-gray-500 block">(Incl. {invoice.gstRate}% GST)</span>
    </>
  ) : (
    <>₹{invoice.totalAmount.toFixed(2)}</>
  )}
</td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleExpand(invoice._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {expandedInvoiceId === invoice._id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </td>
                </tr>

                {expandedInvoiceId === invoice._id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="p-5">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">Items in Invoice</h3>
                      {/* <div className="text-sm text-gray-600 mb-4">
  <div>GST Type: {invoice.gstType === "with" ? "With GST" : "Without GST"}</div>
  {invoice.gstType === "with" && (
    <div>GST Rate: {invoice.gstRate}%</div>
  )}
</div> */}

                      <table className="min-w-full text-xs border rounded overflow-hidden mb-4">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="p-2 text-left">Product Name</th>
                            <th className="p-2 text-left">Quantity</th>
                            <th className="p-2 text-left">Price</th>
                            <th className="p-2 text-left">Total</th>
                            <th className="p-2 text-left">Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{item.product?.productName || "Unknown"}</td>
                              <td className="p-2">{item.quantity}</td>
                              <td className="p-2">₹{item.price}</td>
                              <td className="p-2 font-semibold">₹{(item.quantity * item.price).toFixed(2)}</td>
                              <td className="p-2">{item.remark || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No invoices found.</p>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoiceList;
