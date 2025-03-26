import { Dialog } from "primereact/dialog";
import { useGetInvoiceByIdQuery } from "../../../provider/queries/Orders.query";
import Loader from "../../../components/Loader";
import moment from "moment";
import QRCode from "react-qr-code";
import { usePDF } from "react-to-pdf";
import { useEffect, useState } from "react";
import { toWords } from "number-to-words";
import logo from "../../../assets/djLogo2.png";

const ShowAndPrintModel = ({ setVisible, visible, id }: any) => {
  const { data, isLoading, isError, isFetching } = useGetInvoiceByIdQuery(id);
  const { toPDF, targetRef } = usePDF();

  const [withGST, setWithGST] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [bgColor, setBgColor] = useState("pink");

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGST, setCustomerGST] = useState("");
  const [customerState, setCustomerState] = useState("");

  // ✅ Set default customer info once from fetched data
  useEffect(() => {
    if (data?.consumer) {
      setCustomerName(data.consumer.name || "");
      setCustomerAddress(data.consumer.address || "");
      setCustomerGST(data.consumer.gstin || "");
      setCustomerState(data.consumer.state || "");
    }
  }, [data]);

  if (isFetching || isLoading) return <Loader />;
  if (isError) return <>Something went wrong</>;

  const items = Array.isArray(data?.items) ? data.items : [];
  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.price,
    0
  );
  const gstAmount = withGST ? (totalAmount * gstRate) / 100 : 0;
  const finalPrice = totalAmount + gstAmount;
  const invoiceUrl = `${window.location.origin}/invoice/${data?._id}`;

  const getBackgroundColor = () => {
    if (bgColor === "white") return "#ffffff";
    if (bgColor === "yellow") return "#fff9c4";
    return "#ffc0cb";
  };

  

  // ✅ Editable Items State for Invoice Table
  const [editableItems, setEditableItems] = useState([
    { name: "", price: 0, quantity: 1, totalPrice: 0 },
  ]);

  // ✅ Suggestions List & Products List
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/products/products");
        const result = await response.json();
        setAllProducts(result);
      } catch (error) {
        console.error("Error fetching product list:", error);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Handle Product Name Change with Suggestions
  const handleProductNameChange = (index: number, value: string) => {
    const updatedItems = [...editableItems];
    updatedItems[index].name = value;
    setEditableItems(updatedItems);

    if (value.length > 0) {
      const filtered = allProducts.filter((p) =>
        p.productName.toLowerCase().includes(value.toLowerCase())
      );
      setProductSuggestions(filtered);
    } else {
      setProductSuggestions([]);
    }
  };

  // ✅ Suggestion Click Handler
  const handleSuggestionSelect = (index: number, product: any) => {
    const updatedItems = [...editableItems];
    updatedItems[index].name = product.productName;
    updatedItems[index].price = product.price;
    updatedItems[index].quantity = 1;
    updatedItems[index].totalPrice = product.price * 1;
    setEditableItems(updatedItems);
    setProductSuggestions([]);

    // ✅ Auto-add next row if it's the last row
    if (index === editableItems.length - 1) {
      setEditableItems([
        ...updatedItems,
        { name: "", price: 0, quantity: 1, totalPrice: 0 },
      ]);
    }
  };

  // ✅ Handle Price or Quantity Change
  const handleValueChange = (
    index: number,
    field: "price" | "quantity",
    value: number
  ) => {
    const updatedItems = [...editableItems];
    updatedItems[index][field] = value;
    updatedItems[index].totalPrice =
      updatedItems[index].price * updatedItems[index].quantity;
    setEditableItems(updatedItems);
  };

  // ✅ Delete Row
  const deleteRow = (index: number) => {
    const updatedItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(updatedItems);
  };

return (
    <Dialog
      draggable={false}
      visible={visible}
      className="w-[90%] lg:w-3/4"
      onHide={() => setVisible(false)}
    >
      <div className="p-4">
        {/* GST and Color Toggle */}
        <div className="print:hidden flex flex-wrap gap-2 mb-4 items-center">
          <button
            onClick={() => setWithGST(false)}
            className={`px-4 py-2 rounded ${
              !withGST ? "bg-blue-500 text-white" : "bg-gray-300"
            }`}
          >
            Without GST
          </button>
          <button
            onClick={() => setWithGST(true)}
            className={`px-4 py-2 rounded ${
              withGST ? "bg-blue-500 text-white" : "bg-gray-300"
            }`}
          >
            With GST
          </button>
          {withGST && (
            <select
              className="border px-2 py-1 text-sm"
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
            >
              <option value="5">5% GST</option>
              <option value="9">9% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST</option>
              <option value="28">28% GST</option>
            </select>
          )}
          <select
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="border px-2 py-1 text-sm"
          >
            <option value="pink">Pink</option>
            <option value="yellow">Yellow</option>
            <option value="white">White</option>
          </select>
        </div>

        {/* Invoice Area */}
        <div
          ref={targetRef}
          className="p-6 border border-gray-300 print:bg-white"
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <h2 className="text-sm font-bold text-center mb-8">TAX INVOICE</h2>

          <div className="flex justify-between items-center">
            <img src={logo} alt="Company Logo" className="h-28 w-32" />
            <div className="text-center w-full">
              <h1 className="text-3xl font-bold">DEV JYOTI TEXTILE</h1>
              <p className="text-sm">Shori Cloth Market, Rohtak - 124001</p>
              <p className="text-sm font-bold text-red-600">
                GSTIN: 06BSSPJ8369N1ZN | M: 9812183950
              </p>
            </div>
            <QRCode value={invoiceUrl} size={150} className="mt-4" />
          </div>

          {/* Editable Ship To Section */}
          <div className="mt-8 text-sm border-b pb-2">
            <h3 className="text-md font-semibold mb-1">Consignee (Ship To)</h3>

            <p className="flex gap-2">
              <strong>Name:</strong>
              <div
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => setCustomerName(e.target.innerText)}
                className="outline-none bg-transparent inline-block"
                style={{
                  minWidth: "150px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {customerName}
              </div>
            </p>

            <p className="flex gap-2">
              <strong>Address:</strong>
              <div
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => setCustomerAddress(e.target.innerText)}
                className="outline-none bg-transparent inline-block"
                style={{
                  minWidth: "150px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {customerAddress}
              </div>
            </p>

            <p className="flex gap-2">
              <strong>GSTIN:</strong>
              <div
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => setCustomerGST(e.target.innerText)}
                className="outline-none bg-transparent inline-block"
                style={{
                  minWidth: "150px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {customerGST}
              </div>
            </p>

            <p className="flex gap-2">
              <strong>State:</strong>
              <div
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => setCustomerState(e.target.innerText)}
                className="outline-none bg-transparent inline-block"
                style={{
                  minWidth: "150px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {customerState}
              </div>
            </p>

            <p>
              <strong>Invoice Date:</strong>{" "}
              {moment(data?.createdAt).format("DD MMM, YYYY")}
            </p>
          </div>

          {/* Table Section */}

{/* Editable Invoice Table Section */}
<table className="w-full border mt-6 text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="border py-1">Sr.</th>
      <th className="border py-1">Particulars</th>
      <th className="border py-1">Qty</th>
      <th className="border py-1">Rate</th>
      <th className="border py-1">Amount</th>
      <th className="border py-1 print:hidden">Actions</th>
    </tr>
  </thead>
  <tbody>
    {editableItems.map((item, index) => (
      <tr key={index}>
        <td className="border text-center py-1">{index + 1}</td>

        {/* Item Name Input with Suggestions */}
        <td className="border text-center py-1 relative">
          <input
            type="text"
            value={item.name}
            onChange={(e) =>
              handleProductNameChange(index, e.target.value)
            }
            className="outline-none border px-2 py-1 text-xs w-full print:hidden"
            placeholder="Enter Product"
          />
          <div className="print-only capitalize">{item.name}</div>

          {productSuggestions.length > 0 && (
            <ul className="absolute left-0 top-full bg-white border shadow-md w-full max-h-32 overflow-y-auto z-10 print:hidden">
              {productSuggestions.map((prod, i) => (
                <li
                  key={i}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-xs"
                  onClick={() => handleSuggestionSelect(index, prod)}
                >
                  {prod.productName} — ₹{prod.price}
                </li>
              ))}
            </ul>
          )}
        </td>

        {/* Quantity */}
        <td className="border text-center py-1">
          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              handleValueChange(index, "quantity", Number(e.target.value))
            }
            className="outline-none border px-2 py-1 text-xs w-16 print:hidden"
          />
          <div className="print-only">{item.quantity}</div>
        </td>

        {/* Price */}
        <td className="border text-center py-1">
          <input
            type="number"
            value={item.price}
            onChange={(e) =>
              handleValueChange(index, "price", Number(e.target.value))
            }
            className="outline-none border px-2 py-1 text-xs w-20 print:hidden"
          />
          <div className="print-only">₹{item.price.toFixed(2)}</div>
        </td>

        {/* Total Price */}
        <td className="border text-center py-1 font-semibold">
          ₹{(item.quantity * item.price).toFixed(2)}
        </td>

        {/* Delete */}
        <td className="border text-center py-1 print:hidden">
          <button
            onClick={() => deleteRow(index)}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            ❌
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

          <table className="w-full border mt-4 text-sm">
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
                  <td className="border text-center py-1 capitalize">
                    {item.name}
                  </td>
                  <td className="border text-center py-1">
                    {item.quantity} pcs
                  </td>
                  <td className="border text-center py-1">
                    ₹{item.price.toFixed(2)}
                  </td>
                  <td className="border text-center py-1 font-semibold">
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {withGST && (
                <>
                  <tr>
                    <td
                      colSpan={4}
                      className="border text-right py-1 pr-3 font-semibold"
                    >
                      Gross Taxable Amt
                    </td>
                    <td className="border text-center py-1 font-semibold">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      className="border text-right py-1 pr-3 font-semibold"
                    >
                      CGST @{gstRate / 2}%
                    </td>
                    <td className="border text-center py-1 font-semibold">
                      ₹{(gstAmount / 2).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={4}
                      className="border text-right py-1 pr-3 font-semibold"
                    >
                      SGST @{gstRate / 2}%
                    </td>
                    <td className="border text-center py-1 font-semibold">
                      ₹{(gstAmount / 2).toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
              <tr>
                <td
                  colSpan={4}
                  className="border text-right py-1 pr-3 font-bold"
                >
                  Grand Total
                </td>
                <td className="border text-center py-1 font-bold">
                  ₹{finalPrice.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="text-sm italic pt-2">
                  Amount Chargeable (in words):{" "}
                  <strong>{toWords(finalPrice).toUpperCase()} ONLY</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="text-sm mt-6 border-t pt-3">
            <p>
              <strong>Bank Name:</strong> BANDHAN BANK
            </p>
            <p>
              <strong>Account No:</strong> 10190007098780
            </p>
            <p>
              <strong>IFSC:</strong> BDBL0001825
            </p>
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

        {/* Print Button */}
        <div className="mt-4 print:hidden">
          <button
            className="px-6 py-2 bg-red-500 text-white rounded"
            onClick={() => toPDF({ method: "open", page: { format: "A4" } })}
          >
            Generate Invoice
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ShowAndPrintModel;
