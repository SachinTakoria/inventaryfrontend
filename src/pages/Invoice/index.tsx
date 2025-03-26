import { useParams } from 'react-router-dom';
import { useGetInvoiceByIdQuery } from '../../provider/queries/Orders.query';
import Loader from '../../components/Loader';
import moment from 'moment';
import QRCode from 'react-qr-code';
import { toWords } from 'number-to-words';
import logo from '../../assets/djLogo2.png';

const Invoice = () => {
  const { id } = useParams();
  const { data, isLoading, isError, isFetching } = useGetInvoiceByIdQuery(id);

  if (isLoading || isFetching) return <Loader />;
  if (isError) return <>Something went wrong</>;

  const items = Array.isArray(data?.items) ? data.items : [];
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
  const gstRate = 18;
  const gstAmount = (totalAmount * gstRate) / 100;
  const finalPrice = totalAmount + gstAmount;
  const invoiceUrl = `${window.location.origin}/invoice/${data?._id}`;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white">
      <h2 className="text-xl font-bold text-center mb-4">TAX INVOICE</h2>

      <div className="flex justify-between items-center mb-4">
        <img src={logo} alt="Logo" className="h-16" />
        <div className="text-center w-full">
          <h1 className="text-3xl font-bold">DEV JYOTI TEXTILE</h1>
          <p className="text-sm">Shori Cloth Market, Rohtak - 124001</p>
          <p className="text-sm font-bold text-red-600">GSTIN: 06BSSPJ8369N1ZN | M: 9812183950</p>
        </div>
        <QRCode value={invoiceUrl} size={60} />
      </div>

      <div className="mb-4 text-sm">
        <h3 className="text-md font-semibold mb-1">Consignee (Ship To)</h3>
        <p><strong>Name:</strong> {data?.consumer?.name}</p>
        <p><strong>Address:</strong> {data?.consumer?.address || 'N/A'}</p>
        <p><strong>GSTIN:</strong> {data?.consumer?.gstin || 'N/A'}</p>
        <p><strong>State:</strong> {data?.consumer?.state || 'N/A'}</p>
        <p><strong>Invoice Date:</strong> {moment(data?.createdAt).format('DD MMM, YYYY')}</p>
      </div>

      <table className="w-full border text-sm mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border py-1">Sr.</th>
            <th className="border py-1">Particulars</th>
            <th className="border py-1">Qty</th>
            <th className="border py-1">Rate</th>
            <th className="border py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, index: number) => (
            <tr key={index}>
              <td className="border text-center py-1">{index + 1}</td>
              <td className="border text-center py-1 capitalize">{item.name}</td>
              <td className="border text-center py-1">{item.quantity} pcs</td>
              <td className="border text-center py-1">₹{item.price.toFixed(2)}</td>
              <td className="border text-center py-1 font-semibold">₹{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="border text-right py-1 pr-3 font-semibold">Gross Taxable Amt</td>
            <td className="border text-center py-1 font-semibold">₹{totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border text-right py-1 pr-3 font-semibold">CGST @9%</td>
            <td className="border text-center py-1 font-semibold">₹{(gstAmount / 2).toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border text-right py-1 pr-3 font-semibold">SGST @9%</td>
            <td className="border text-center py-1 font-semibold">₹{(gstAmount / 2).toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border text-right py-1 pr-3 font-bold">Grand Total</td>
            <td className="border text-center py-1 font-bold">₹{finalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={5} className="text-sm italic pt-2">Amount Chargeable (in words): <strong>{toWords(finalPrice).toUpperCase()} ONLY</strong></td>
          </tr>
        </tfoot>
      </table>

      <div className="text-sm border-t pt-3">
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

export default Invoice;
