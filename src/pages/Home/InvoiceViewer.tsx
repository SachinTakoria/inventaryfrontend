import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import moment from "moment";
import { toWords } from "number-to-words";

const InvoiceViewer = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_BACKEND_URL}/invoices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setInvoice(data.invoice))
      .catch((err) => console.error("Error loading invoice", err));
  }, [id]);

  if (!invoice) return <p className="p-4">Loading...</p>;

  const gstAmount = invoice.withGST
    ? (invoice.totalAmount * invoice.gstRate) / 100
    : 0;
  const total = invoice.totalAmount + gstAmount;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow print:bg-white">
      <h2 className="text-center font-bold text-lg mb-4">TAX INVOICE</h2>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">DEV JYOTI TEXTILE</h1>
          <p>Shori Cloth Market, Rohtak - 124001</p>
          <p className="text-red-600 font-semibold">GSTIN: 06BSSPJ8369N1ZN | M: 9812183950</p>
        </div>
        <QRCode value={window.location.href} size={80} />
      </div>

      {/* CUSTOMER INFO */}
      <div className="text-sm border-b pb-3 mb-3">
        <p><strong>Name:</strong> {invoice.customerName}</p>
        <p><strong>Address:</strong> {invoice.customerAddress}</p>
        <p><strong>GSTIN:</strong> {invoice.customerGST}</p>
        <p><strong>State:</strong> {invoice.customerState}</p>
        <p><strong>Date:</strong> {moment(invoice.createdAt).format("DD MMM, YYYY")}</p>
      </div>

      {/* PRODUCTS TABLE */}
      <table className="w-full border text-sm mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Sr.</th>
            <th className="border p-1">Item</th>
            <th className="border p-1">Qty</th>
            <th className="border p-1">Price</th>
            <th className="border p-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, i: number) => (
            <tr key={i}>
              <td className="border text-center p-1">{i + 1}</td>
              <td className="border text-left p-1">{item.name}</td>
              <td className="border text-center p-1">{item.quantity}</td>
              <td className="border text-center p-1">₹{item.price}</td>
              <td className="border text-right p-1 font-semibold">₹{item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <div className="text-sm font-semibold text-right space-y-1">
        {invoice.withGST && (
          <>
            <p>Gross: ₹{invoice.totalAmount.toFixed(2)}</p>
            <p>CGST @{invoice.gstRate / 2}%: ₹{(gstAmount / 2).toFixed(2)}</p>
            <p>SGST @{invoice.gstRate / 2}%: ₹{(gstAmount / 2).toFixed(2)}</p>
          </>
        )}
        <p className="text-lg">Total: ₹{total.toFixed(2)}</p>
      </div>

      <p className="italic text-sm mt-2">
        In Words: <strong>{toWords(Math.round(total)).toUpperCase()} ONLY</strong>
      </p>
    </div>
  );
};

export default InvoiceViewer;
