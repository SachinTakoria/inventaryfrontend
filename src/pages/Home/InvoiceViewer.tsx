// ✅ FINAL InvoiceViewer.tsx with GST & Non-GST Layout
import { useEffect, useState } from "react";
import moment from "moment";
import QRCode from "react-qr-code";
import { toWords } from "number-to-words";

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

  const isGST = invoice.withGST;
  const discount = invoice.discountPercent || 0;
  const gstRate = invoice.gstRate || 0;

  const itemTotal = invoice.items?.reduce((sum: number, item: any) => {
    const d = item.discount || 0;
    const discounted = item.price - (item.price * d) / 100;
    return sum + discounted * item.quantity;
  }, 0);

  const discountAmount = (itemTotal * discount) / 100;
  const subtotal = itemTotal - discountAmount;
  const gstAmount = isGST ? (subtotal * gstRate) / 100 : 0;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const totalWithGST = subtotal + gstAmount;

  return (
    <div id="printable-invoice" className="p-6 w-full bg-white border shadow print:bg-white">

      <h2 className="text-center text-md font-bold border-b border-black pb-2 mb-4">
        {isGST ? "TAX INVOICE" : "ESTIMATED BILL"}
      </h2>

      {/* ✅ Invoice Number & Date */}
   {  !isGST && (<div className="flex justify-between mb-4 text-sm">
    <p><strong>Invoice No:</strong> {invoice.invoiceNumber ? (isGST ? invoice.invoiceNumber : invoice.invoiceNumber.replace(/^DJT\//, "")) : "N/A"}</p>

        <p><strong>Date:</strong> {moment(invoice.invoiceDate || invoice.createdAt).format("DD MMM, YYYY")}</p>
      </div>)}

      {/* ✅ Buyer + QR */}
     { !isGST && (

     
     
     <div className="flex justify-between gap-4 mb-4">
        <div className="w-full text-sm border border-black px-2 py-1">

          <h3 className="font-bold mb-2">Buyer (Bill To)</h3>
          <p><strong>Name:</strong> {invoice.customerName}</p>
          <p><strong>Phone:</strong> {invoice.customerPhone}</p>
          <p><strong>Address:</strong> {invoice.customerAddress}</p>
          <p><strong>GSTIN:</strong> {invoice.customerGST}</p>
          <p><strong>State:</strong> {invoice.customerState}</p>
        </div>

 
      </div>)}


      {isGST && (
        <>
        <div className="flex justify-between items-start  pb-4">
  {/* LEFT SIDE - FIRM + CONSIGNEE + BUYER */}
  <div className="w-[62%] border border-black p-4 text-sm  min-h-[320px] flex flex-col justify-between">
    {/* Firm Info */}
    <div>
      <h1 className="text-2xl font-bold">DEV JYOTI TEXTILES</h1>
      <p>GROUND FLOOR, SHOP NO. 1, DTC MARKET, ROHTAK</p>
      <p className="text-red-600 font-semibold">GSTIN/UIN: 06ABCDE1234F1Z5 </p>
      <p className="font-semibold">M: 9812345678</p>
      <p className="font-semibold">State Name: Haryana, Code: 06</p>
    </div>

    {/* Consignee */}
    <div className="mt-4 border-t pt-2">
      <h3 className="font-semibold">Consignee (Ship To)</h3>
      <p><strong>{invoice.consignee?.name || "N/A"}</strong></p>
      <p>{invoice.consignee?.address || "N/A"}</p>
      <p>GSTIN/UIN: {invoice.consignee?.gstin || "N/A"}</p>
      <p>PAN/IT No: {invoice.consignee?.pan || "N/A"}</p>
      <p>State Name: {invoice.consignee?.state || "N/A"}</p>
    </div>

    {/* Buyer Info */}
    <div className="mt-4 border-t pt-2">
      <h3 className="font-semibold pb-1 ">Buyer (Bill To)</h3>
      <p><strong>Name:</strong> {invoice.customerName || "N/A"}</p>
      <p><strong>Phone:</strong> {invoice.customerPhone || "N/A"}</p>
      <p><strong>Address:</strong> {invoice.customerAddress || "N/A"}</p>
      <p><strong>GSTIN:</strong> {invoice.customerGST || "N/A"}</p>
      <p><strong>State:</strong> {invoice.customerState || "N/A"}</p>
    </div>
  </div>

  {/* RIGHT SIDE - QR + INVOICE INFO */}
  <div className="w-[40%] border border-black p-2 text-xs font-medium min-h-[340px] flex flex-col items-end text-right justify-between">

    <div className="w-full flex justify-end mb-2">
    <QRCode value={`https://inventary-production-e5a5.up.railway.app/${invoice.invoiceNumber}.pdf`} size={100} />

    </div>
    <table className="w-full mt-1 border border-black text-[11px]">
      <tbody>
        <tr><td className="border px-2 py-3 font-semibold w-[40%]">Invoice No</td><td className="border px-2 py-1 text-right">
  {invoice.invoiceNumber
    ? isGST
      ? invoice.invoiceNumber
      : invoice.invoiceNumber.replace(/^DJT\//, "")
    : "N/A"}
</td>
</tr>
        <tr><td className="border px-2 py-3 font-semibold">Dated</td><td className="border px-2 py-1 text-right">{moment(invoice.invoiceDate || invoice.createdAt).format("DD MMM, YYYY")}</td></tr>
        <tr><td className="border px-2 py-3 font-semibold">Delivery Note</td><td className="border px-2 py-1 text-right">_</td></tr>
        <tr><td className="border px-2 py-3 font-semibold">Reference No. & Date</td><td className="border px-2 py-1 text-right">Other References</td></tr>
        <tr><td className="border px-2 py-3 font-semibold">Dispatch Doc No.</td><td className="border px-2 py-1 text-right">Delivery Note Date</td></tr>
        <tr><td className="border px-2 py-3 font-semibold">Dispatched through</td><td className="border px-2 py-1 text-right">Destination</td></tr>
      </tbody>
    </table>
  </div>
</div>

        
        
        </>
      )}

      {/* ✅ Item Table */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Sr.</th>
            <th className="border px-2 py-1">Item</th>
            <th className="border px-2 py-1">HSN</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Rate</th>
            <th className="border px-2 py-1">Discount</th>
            <th className="border px-2 py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, i: number) => {
            const disc = item.discount || 0;
            const finalRate = item.price - (item.price * disc) / 100;
            const amount = finalRate * item.quantity;
            return (
              <tr key={i}>
                <td className="border px-2 py-1 text-center">{i + 1}</td>
                <td className="border px-2 py-1">{item.name}</td>
                <td className="border px-2 py-1 text-center">5155</td>
                <td className="border px-2 py-1 text-center">{item.quantity}</td>
                <td className="border px-2 py-1 text-right">₹{item.price}</td>
                <td className="border px-2 py-1 text-center">{disc}%</td>
                <td className="border px-2 py-1 text-right">₹{amount.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ✅ Totals */}
      <div className="flex justify-between mt-4">
        <div className="w-[62%] border border-black p-2 italic text-sm font-semibold">
          Amount in Words: <strong>{toWords(Math.round(totalWithGST)).toUpperCase()} ONLY</strong>
        </div>

        <div className="border border-black p-2 w-[38%] text-xs">
          <div className="grid grid-cols-2 gap-[2px]">
            <div className="border border-gray-400 px-2 py-1">Gross</div>
            <div className="border border-gray-400 px-2 py-1 text-right">₹{itemTotal.toFixed(2)}</div>
        
            {isGST && (
              <>
                <div className="border border-gray-400 px-2 py-1">CGST @{gstRate / 2}%</div>
                <div className="border border-gray-400 px-2 py-1 text-right">₹{cgst.toFixed(2)}</div>
                <div className="border border-gray-400 px-2 py-1">SGST @{gstRate / 2}%</div>
                <div className="border border-gray-400 px-2 py-1 text-right">₹{sgst.toFixed(2)}</div>
              </>
            )}
            <div className="border border-gray-400 px-2 py-1 font-bold">Total</div>
            <div className="border border-gray-400 px-2 py-1 text-right font-bold">₹{totalWithGST.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* ✅ GST Amount & Pending Table */}
      <div className="mt-4 font-semibold text-sm w-full flex justify-between ">
  {/* ✅ LEFT: GST Amount in Words */}
  <div className="w-[57%] text-sm border border-black p-2 italic">
    GST Amount (in words): <strong>{invoice.withGST ? toWords(Math.round(gstAmount)).toUpperCase() : "ZERO"} ONLY</strong>
  </div>

  {/* ✅ RIGHT: Previous / Paid / Carry Forward */}
  <div className="text-xs w-fit border border-black">
    <div className="grid grid-cols-4 grid-rows-2 font-semibold text-xs text-center">
      <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">Previous</div>
      <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">Adjusted</div>
      <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">Paid</div>
      <div className="border border-gray-400 px-2 py-[3px] bg-gray-100 text-red-600">Carry Forward</div>

      <div className="border border-gray-400 px-2 py-[3px] text-right">{invoice.previousPending || 0}</div>
      <div className="border border-gray-400 px-2 py-[3px] text-right">{invoice.oldPendingAdjusted || 0}</div>
      <div className="border border-gray-400 px-2 py-[3px] text-right">{invoice.amountPaid || 0}</div>
      <div className="border border-gray-400 px-2 py-[3px] text-right font-semibold text-red-600">{invoice.carryForward || 0}</div>
    </div>
  </div>
</div>


      {/* ✅ Footer */}
      <div className="mt-4 border border-black p-4 text-sm">
        <div className="flex justify-between">
          <div className="w-[30%]">
            <p className="font-bold">Terms & Conditions:</p>
            <p>1. Goods once sold will not be taken back.</p>
            <p>2. All disputes are subject to Rohtak Jurisdiction.</p>
            <p>3. E & O.E.</p>
          </div>
          <div className="text-center w-[40%]">
            <p className="font-semibold">Bank Details</p>
            <p><strong>Bank Name:</strong> BANDHAN BANK</p>
            <p><strong>Account No:</strong> 10190007096780</p>
            <p><strong>IFSC:</strong> BDBL0001825</p>
          </div>
          <div className="text-right w-[30%] font-semibold">
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
