// FINAL InvoiceViewer.tsx matching InvoiceBuilder layout (both GST & Non-GST)
import { useEffect, useState } from "react";
import moment from "moment";
import { toWords } from "number-to-words";
import QRCode from "react-qr-code";

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
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
       
        if (data?.order) setInvoice(data.order);
      } catch (err) {
        console.error("Error loading invoice", err);
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

  const itemTotal = invoice.items?.reduce(
    (sum: number, item: any) => sum + item.quantity * item.price,
    0
  );

  const discount = invoice.discountAmount || 0;
  const hasDiscount = invoice?.hasOwnProperty("discountAmount") && discount > 0;
  const subtotalAfterDiscount = itemTotal - discount;
  const gstAmount = (subtotalAfterDiscount * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const finalTotal = isGST ? subtotalAfterDiscount + gstAmount : subtotalAfterDiscount;

  return (
    <div id="printable-invoice" className="p-6 max-w-4xl mx-auto bg-white border shadow text-sm">
      <h2 className="text-md font-bold text-center mb-2 border-b pb-2">
        {isGST ? "TAX INVOICE" : "INVOICE"}
      </h2>

      {!isGST && (
        <h1 className="text-2xl font-bold text-center mb-4">ESTIMATED BILL</h1>
      )}

<div className="flex justify-between items-start mb-4">
        {isGST ? (
          <div className="w-[60%]">
            <h1 className="text-2xl font-bold">DEV JYOTI TEXTILES</h1>
            <p>Shori Cloth Market, Rohtak - 124001</p>
            <p className="text-red-600 font-semibold">GSTIN: 06BSSPJ8369N1ZN</p>
            <p>Mobile: 9812183950</p>
            <p>State Name: HARYANA 124001</p>
          </div>
        ) : <div />}

<div className="flex flex-col items-end gap-2">
  {isGST && <QRCode value={window.location.href} size={100} />}

  <div className="text-[11px] font-medium leading-snug text-right mt-2">
    <p><strong>Invoice No:</strong> {invoice.invoiceNumber || "N/A"}</p>
    <p><strong>Dated:</strong> {moment(invoice.createdAt).format("DD MMM, YYYY")}</p>
  </div>  
</div>

      </div>


        {/* Consignee Info */}
        {isGST && invoice.consignee && (
        <div className="mb-4">
          <h3 className="font-bold mb-1">Consignee (Ship To)</h3>
          <p><strong>{invoice.consignee.name}</strong></p>
          <p>{invoice.consignee.address}</p>
          <p>GSTIN/UIN: {invoice.consignee.gstin}</p>
          <p>PAN/IT NO: {invoice.consignee.pan}</p>
          <p>State Name: {invoice.consignee.state}</p>
        </div>
      )}

      {/* Customer Info */}
      <div className="mb-4 border-b pb-2 mt-2">
        <p><strong>Name:</strong> {invoice.customerName}</p>
        <p><strong>Phone:</strong> {invoice.customerPhone}</p>
        <p><strong>Address:</strong> {invoice.customerAddress}</p>
        <p><strong>GSTIN:</strong> {invoice.customerGST}</p>
        <p><strong>State:</strong> {invoice.customerState}</p>
      </div>

      {/* Product Table */}
      <table className="w-full text-xs border border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Sr.</th>
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
              <td className="border text-center py-1">{i + 1}</td>
              <td className="border text-center py-1">{item.name}</td>
              <td className="border text-center py-1">{item.hsn || "–"}</td>
              <td className="border text-center py-1">{item.quantity}</td>
              <td className="border text-center py-1">₹{item.price}</td>
              <td className="border text-center py-1">₹{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Section */}
      <div className="mt-4 w-full flex justify-end">
        <div className="border border-black p-2 w-full md:w-[350px] text-xs">
          <div className="grid grid-cols-2 gap-[2px]">
            <div className="border px-2 py-1">Gross</div>
            <div className="border px-2 py-1 text-right">₹{itemTotal.toFixed(2)}</div>
            {hasDiscount && (
              <>
                <div className="border px-2 py-1">Discount @{((discount / itemTotal) * 100).toFixed(2)}%</div>
                <div className="border px-2 py-1 text-right">- ₹{discount.toFixed(2)}</div>
              </>
            )}
            {isGST && (
              <>
                <div className="border px-2 py-1">CGST @{gstRate / 2}%</div>
                <div className="border px-2 py-1 text-right">₹{cgst.toFixed(2)}</div>
                <div className="border px-2 py-1">SGST @{gstRate / 2}%</div>
                <div className="border px-2 py-1 text-right">₹{sgst.toFixed(2)}</div>
              </>
            )}
            <div className="border px-2 py-1 font-bold">Total</div>
            <div className="border px-2 py-1 text-right font-bold">₹{finalTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 border border-black p-2 italic text-sm font-semibold">
        In Words: <strong>{invoice.amountInWords || toWords(Math.round(finalTotal
)).toUpperCase()} ONLY</strong>
      </div>

      {/* Payment Summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <p><strong>Bank Name:</strong> BANDHAN BANK</p>
          <p><strong>Account No:</strong> 10190007098780</p>
          <p><strong>IFSC:</strong> BDBL0001825</p>
        </div>
        <div className="grid grid-cols-2 gap-[2px] border border-black p-2">
          <div className="border px-2 py-1">Previous Pending</div>
          <div className="border px-2 py-1 text-right">₹{invoice.previousPending || 0}</div>
          <div className="border px-2 py-1">Adjust from Previous</div>
          <div className="border px-2 py-1 text-right">₹{invoice.oldPendingAdjusted || 0}</div>
          <div className="border px-2 py-1">Amount Paid</div>
          <div className="border px-2 py-1 text-right">₹{invoice.amountPaid || 0}</div>
          <div className="border px-2 py-1 text-red-600 font-semibold">Carry Forward</div>
          <div className="border px-2 py-1 text-right text-red-600 font-semibold">₹{invoice.carryForward || 0}</div>
        </div>
      </div>

      <div className="mt-4 border border-black p-4 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="font-bold">Terms & Conditions:</p>
            <p>1. Goods once sold will not be taken back.</p>
            <p>2. All disputes are subject to Rohtak Jurisdiction.</p>
            <p>3. E & O.E.</p>
          </div>
          <div className="text-right font-semibold">
            <p>for: DEV JYOTI TEXTILES</p>
            <p className="mt-6">Auth. Signatory</p>
          </div>
        </div>
        <p className="text-center mt-4 italic text-gray-600">
          This is a Computer Generated Invoice. Signature Not Required.
        </p>
      </div>
    </div>
  );
};

export default InvoiceViewer;