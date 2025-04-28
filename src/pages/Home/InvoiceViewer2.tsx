// ✅ FINAL FULLY MATCHED InvoiceViewer2.tsx
import { useEffect, useState } from "react";
import moment from "moment";
import QRCode from "react-qr-code";
import { toWords } from "number-to-words";

interface Props {
  invoiceId: string;
}

const InvoiceViewer2 = ({ invoiceId }: Props) => {
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
      } catch (error) {} finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  if (loading) return <div className="p-4 text-center">Loading invoice...</div>;
  if (!invoice) return <div className="p-4 text-center">Invoice not found</div>;

 
  const itemTotal = invoice.items?.reduce((sum: number, item: any) => {
    const discount = item.discount || 0;
    const discountedPrice = item.price - (item.price * (item.discount || 0)) / 100;
    return sum + discountedPrice * item.quantity;
}, 0);

  const discountPercent = invoice.discountPercent || 0;
  const discountAmount = (itemTotal * discountPercent) / 100;
  const subtotalAfterDiscount = itemTotal - discountAmount;
  const gstAmount = (subtotalAfterDiscount * invoice.gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const totalWithGST = subtotalAfterDiscount + gstAmount;

  return (
    <div
      id="printable-invoice"
      className="p-6 max-w-5xl mx-auto bg-white border shadow print:bg-white"
    >
      <h2 className="text-center text-md font-bold border-b border-black pb-2 mb-4">
        TAX INVOICE
      </h2>

      <div className="flex border border-black min-h-[340px]">
  {/* LEFT */}
  <div className="w-[65%] p-4 text-sm flex flex-col justify-between">
    <div>
      <h1 className="text-2xl font-bold">HIMANSHI TEXTILES</h1>
      <p>GROUND FLOOR, 2449, CHOUDHRY BHAWAN, TELIPARA, JAIPUR</p>
      <p className="text-red-600 font-semibold">GSTIN/UIN: 08GNYPS6300G1ZD | M: 9971745882</p>
      <p className="font-semibold">State Name: Rajasthan, Code: 08</p>
    </div>

    <div className="mt-4 border-t pt-2">
      <h3 className="font-semibold">Consignee (Ship To)</h3>
      <p><strong>{invoice.consignee?.name || "N/A"}</strong></p>
      <p>{invoice.consignee?.address || "N/A"}</p>
      <p>GSTIN/UIN: {invoice.consignee?.gstin || "N/A"}</p>
      <p>PAN/IT No: {invoice.consignee?.pan || "N/A"}</p>
      <p>State Name: {invoice.consignee?.state || "N/A"}</p>
    </div>

    <div className="mt-4 border-t pt-2">
      <h3 className="font-bold pb-1 mb-2">Buyer (Bill To)</h3>
      <p><strong>Name:</strong> {invoice.customerName || "N/A"}</p>
      <p><strong>Phone:</strong> {invoice.customerPhone || "N/A"}</p>
      <p><strong>Address:</strong> {invoice.customerAddress || "N/A"}</p>
      <p><strong>GSTIN:</strong> {invoice.customerGST || "N/A"}</p>
      <p><strong>State:</strong> {invoice.customerState || "N/A"}</p>
    </div>
  </div>

  {/* RIGHT */}
  <div className="w-[35%] p-4 text-xs font-medium flex flex-col items-end text-right border-l border-black">
    <div className="w-full flex justify-end mb-1">
    <QRCode
      value={`https://djtextile.in/invoices/${invoice?.invoiceNumber.replace(/\//g, '')}.pdf`}
      size={140}
    />


    </div>
    <table className="w-full border border-black text-[11px] mt-1">
      <tbody>
        <tr><td className="border px-2 py-3 font-semibold text-left w-[40%]">Invoice No</td><td className="border px-2 py-1 text-right">{invoice.invoiceNumber || "N/A"}</td></tr>
        <tr><td className="border px-2 py-3 font-semibold text-left">Dated</td><td className="border px-2 py-1 text-right">{moment(invoice.invoiceDate || invoice.createdAt).format("DD MMM, YYYY")}</td></tr>
        <tr><td className="border px-2 py-3 font-semibold text-left">Delivery Note</td><td className="border px-2 py-1 text-right">_</td></tr>
        <tr><td className="border px-2 py-3 font-semibold text-left">Reference No. & Date</td><td className="border px-2 py-1 text-right">Other References</td></tr>
        <tr><td className="border px-2 py-3 font-semibold text-left">Dispatch Doc No.</td><td className="border px-2 py-1 text-right">Delivery Note Date</td></tr>
        <tr><td className="border px-2 py-3 font-semibold text-left">Dispatched through</td><td className="border px-2 py-1 text-right">Destination</td></tr>
      </tbody>
    </table>
  </div>
</div>



      <table className="w-full border mt-4 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border py-1">Sr.</th>
            <th className="border py-1">Item</th>
            <th className="border py-1">HSN</th>
            <th className="border py-1">Qty</th>
            <th className="border py-1">Price</th>
            <th className="border py-1">Discount</th>
            <th className="border py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
        {invoice.items?.map((item: any, index: number) => {
            const discount = item.discount || 0;
            const discountedPrice = item.price - (item.price * discount) / 100;
            const itemTotal = discountedPrice * item.quantity;
            return (
              <tr key={index}>
                <td className="border text-center py-1">{index + 1}</td>
                <td className="border text-center py-1">{item.name}</td>
                <td className="border text-center py-1">5155</td>
                <td className="border text-center py-1">{item.quantity}</td>
                <td className="border text-center py-1">
  ₹{((item.price - (item.price * (item.discount || 0)) / 100) * item.quantity).toFixed(2)}
</td>
<td className="border text-center py-1">{item.discount || 0}%</td>

                <td className="border text-center py-1 font-semibold">₹{itemTotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 font-semibold text-sm w-full flex justify-between gap-0">
  {/* LEFT - Amount in Words */}
  <div className="w-[65%] border border-black p-2 italic">
    Amount in Words:{" "}
    <strong>{toWords(Math.round(totalWithGST)).toUpperCase()} ONLY</strong>
  </div>

  {/* RIGHT - Gross, GST, Total */}
  <div className="w-[35%] border border-black p-2 text-xs">
    <div className="grid grid-cols-2 gap-[2px]">
      <div className="border border-gray-400 px-2 py-1">Gross</div>
      <div className="border border-gray-400 px-2 py-1 text-right">
        ₹{itemTotal.toFixed(2)}
      </div>

      <div className="border border-gray-400 px-2 py-1">
        CGST @{invoice.gstRate / 2}%
      </div>
      <div className="border border-gray-400 px-2 py-1 text-right">
        ₹{cgst.toFixed(2)}
      </div>

      <div className="border border-gray-400 px-2 py-1">
        SGST @{invoice.gstRate / 2}%
      </div>
      <div className="border border-gray-400 px-2 py-1 text-right">
        ₹{sgst.toFixed(2)}
      </div>

      <div className="border border-gray-400 px-2 py-1 font-bold">Total</div>
      <div className="border border-gray-400 px-2 py-1 text-right font-bold">
        ₹{totalWithGST.toFixed(2)}
      </div>
    </div>
  </div>
</div>


      <div className="mt-4 font-semibold text-sm w-full flex justify-between">
        <div className="w-[55%] text-sm border border-black p-2 italic">
          GST Amount in Words: <strong>{toWords(Math.round(gstAmount)).toUpperCase()} ONLY</strong>
        </div>
        <div className="text-xs w-fit border border-black">
          <div className="grid grid-cols-4 grid-rows-2 font-semibold text-xs text-center">
            <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">Previous Pending</div>
            <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">Adjusted</div>
            <div className="border border-gray-400 px-2 py-[3px] bg-gray-100">Paid</div>
            <div className="border border-gray-400 px-2 py-[3px] bg-gray-100 text-red-600">Carry Forward</div>
            <div className="border border-gray-400 px-2 py-[3px] text-right">{(invoice.previousPending || 0)}</div>
            <div className="border border-gray-400 px-2 py-[3px] text-right">{(invoice.oldPendingAdjusted || 0)}</div>
            <div className="border border-gray-400 px-2 py-[3px] text-right">{(invoice.amountPaid || 0)}</div>
            <div className="border border-gray-400 px-2 py-[3px] text-right font-semibold text-red-600">{(invoice.carryForward || 0)}</div>
          </div>
        </div>
      </div>

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
            <p><strong>Bank Name:</strong> INDUSLND BANK LTD</p>
            <p><strong>Account No:</strong> 201002825718</p>
            <p><strong>IFSC:</strong> INDB0000710</p>
          </div>
          <div className="text-right w-[30%] font-semibold">
            <p>for: HIMANSHI TEXTILES</p>
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

export default InvoiceViewer2;