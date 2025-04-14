import { useEffect, useState } from "react";
import moment from "moment";

interface Props {
  invoiceId: string;
}

const InvoiceViewer = ({ invoiceId }: Props) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/orders/invoice/${invoiceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (data?.order) {
          setInvoice(data.order);
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  if (loading) return <div className="p-4 text-center">Loading invoice...</div>;
  if (!invoice) return <div className="p-4 text-center">Invoice not found</div>;

  const isGST = invoice?.withGST === true;
  const gstRate = invoice?.gstRate || 0;
  const gstAmount = (invoice.totalAmount * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return (
    <div id="printable-invoice" className="p-6 max-w-4xl mx-auto bg-white border shadow print:bg-white">
      <h2 className="text-center text-lg font-semibold mb-2">
        {isGST ? "TAX INVOICE" : "INVOICE"}
      </h2>

      {!isGST && (
        <h1 className="text-2xl font-bold text-center mb-4">ESTIMATED BILL</h1>
      )}

      <div className="flex justify-between items-start border-b pb-2">
        {isGST && (
          <div>
            <h1 className="text-xl font-bold">DEV JYOTI TEXTILE</h1>
            <p>Shori Cloth Market, Rohtak - 124001</p>
            <p className="text-red-600 font-semibold">GSTIN: 06BSSPJ8369N1ZN</p>
            <p>Mobile: 9812183950</p>
          </div>
        )}
        <div className="text-right text-sm min-w-[200px]">
          <p><strong>Invoice No:</strong> {invoice.invoiceNumber || "N/A"}</p>
          <p><strong>Dated:</strong> {moment(invoice.createdAt).format("DD MMM YYYY, hh:mm A")}</p>
        </div>
      </div>

      {isGST && (
        <div className="mb-4 border-b pb-2 mt-4">
          <p><strong>Customer:</strong> {invoice.customerName}</p>
          <p><strong>Address:</strong> {invoice.customerAddress}</p>
          <p><strong>GSTIN:</strong> {invoice.customerGST}</p>
          <p><strong>State:</strong> {invoice.customerState}</p>
        </div>
      )}

      {!isGST && (
        <div className="mb-4 border-b pb-2 mt-4">
          <p><strong>Name:</strong> {invoice.customerName}</p>
          <p><strong>Phone:</strong> {invoice.customerPhone}</p>
          <p><strong>Address:</strong> {invoice.customerAddress}</p>
          <p><strong>GSTIN:</strong> {invoice.customerGST}</p>
          <p><strong>State:</strong> {invoice.customerState}</p>
        </div>
      )}

      <table className="w-full text-sm border border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Item</th>
            <th className="border p-1">HSN</th>
            <th className="border p-1">Qty</th>
            <th className="border p-1">Price</th>
            <th className="border p-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item: any, i: number) => (
            <tr key={i}>
              <td className="border p-1 text-center">{item.name}</td>
              <td className="border p-1 text-center">{item.hsn || "–"}</td>
              <td className="border p-1 text-center">{item.quantity}</td>
              <td className="border p-1 text-center">₹{item.price}</td>
              <td className="border p-1 text-center">₹{item.totalPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-right text-sm">
        <p><strong>Gross:</strong> ₹{invoice.totalAmount?.toFixed(2)}</p>

        {isGST && (
          <>
            <p>CGST @{gstRate / 2}%: ₹{cgst.toFixed(2)}</p>
            <p>SGST @{gstRate / 2}%: ₹{sgst.toFixed(2)}</p>
          </>
        )}

        <p className="text-lg font-bold">
          Total: ₹{invoice.totalAmountWithGST?.toFixed(2) || invoice.totalAmount?.toFixed(2)}
        </p>

        <div className="mt-3 text-sm border-t pt-3 text-right">
          <p><strong>Previous Pending Adjusted:</strong> ₹{invoice.oldPendingAdjusted || 0}</p>
          <p><strong>Amount Paid:</strong> ₹{invoice.amountPaid || 0}</p>
          <p className="text-red-600 font-semibold">
            <strong>Carry Forward (Pending):</strong> ₹{invoice.carryForward || 0}
          </p>
        </div>
      </div>

      <div className="mt-4 italic text-sm">
        In Words: <strong>{invoice.amountInWords || ""}</strong>
      </div>

      <div className="mt-4 text-sm border-t pt-3">
        <p><strong>Bank Name:</strong> BANDHAN BANK</p>
        <p><strong>Account No:</strong> 10190007098780</p>
        <p><strong>IFSC:</strong> BDBL0001825</p>
      </div>

      <div className="text-sm mt-4 flex justify-between border-t pt-3">
        <div>
          <p className="font-bold">Terms & Conditions:</p>
          <p>1. Goods once sold will not be taken back.</p>
          <p>2. All disputes are subject to Rohtak Jurisdiction.</p>
          <p>3. E & O.E.</p>
        </div>
        <div className="text-right font-semibold">
          <p>for: DEV JYOTI TEXTILE</p>
          <p className="mt-6">Auth. Signatory</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;