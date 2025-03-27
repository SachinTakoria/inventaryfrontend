import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { usePDF } from "react-to-pdf";
import moment from "moment";
import { toWords } from "number-to-words";
import logo from "../../assets/djLogo2.png";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;


type EditableItem = {
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  _id: string; // ✅ now required, not optional
};

const InvoiceBuilder: React.FC = () => {
  const { toPDF, targetRef } = usePDF();

  const [withGST, setWithGST] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [bgColor, setBgColor] = useState("pink");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGST, setCustomerGST] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [editableItems, setEditableItems] = useState<EditableItem[]>([
    { name: "", price: 0, quantity: 1, totalPrice: 0, _id: "" },
  ]);

  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/products/products`);

        const result = await response.json();
        setAllProducts(result);
      } catch (error) {
        console.error("Error fetching product list:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleProductNameChange = (index: number, value: string) => {
    const updatedItems = [...editableItems];
    updatedItems[index].name = value;
    updatedItems[index]._id = "";

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

  const handleSuggestionSelect = (index: number, product: any) => {
    const updatedItems = [...editableItems];
    updatedItems[index].name = product.productName;
    updatedItems[index].price = product.price;
    updatedItems[index].quantity = 1;
    updatedItems[index].totalPrice = product.price * 1;
    updatedItems[index]._id = product._id;
    setEditableItems(updatedItems);
    setProductSuggestions([]);

    if (index === editableItems.length - 1 && updatedItems[index]._id) {
      setEditableItems([
        ...updatedItems,
        { name: "", price: 0, quantity: 1, totalPrice: 0, _id: "" },
      ]);
    }
  };

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

  const deleteRow = (index: number) => {
    const updatedItems = editableItems.filter((_, i) => i !== index);
    setEditableItems(updatedItems);
  };

  const getBackgroundColor = () => {
    if (bgColor === "white") return "#ffffff";
    if (bgColor === "yellow") return "#fff9c4";
    return "#ffc0cb";
  };

  const finalPrice = editableItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const gstAmount = withGST ? (finalPrice * gstRate) / 100 : 0;
  const totalAmount = finalPrice + gstAmount;

  const generateInvoiceAndUpdateStock = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Please login again.");
      return;
    }
  
    // ✅ Filter valid items with product _id
    const validItems = editableItems.filter(
      (item) =>
        item._id &&
        item.name.trim() !== "" &&
        item.quantity > 0 &&
        item.price > 0
    );
  
    if (validItems.length === 0) {
      alert("❌ Please select valid products from the suggestion list.");
      return;
    }
  
    // ✅ Filter invalid items only if name is filled but no _id
    const invalidItems = editableItems.filter(
      (item) => item.name.trim() !== "" && (!item._id || item._id.trim() === "")
    );
  
    if (invalidItems.length > 0) {
      console.log("❌ Invalid Items:", invalidItems);
      alert(
        "❌ Some items were not selected from product suggestions. Please fix them."
      );
      return;
    }
  
    const itemsToSave = editableItems
      .filter(
        (item) => item._id && item.name.trim() !== "" && item.quantity > 0
      )
      .map((item) => ({
        productId: item._id, // ✅ This is the most important
        quantity: item.quantity,
      }));
  
    try {
      const response = await fetch(`${BASE_URL}/orders/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerName,
            customerAddress,
            customerGST,
            customerState,
            items: itemsToSave,
          }),
        }
      );
  
      const data = await response.json();
      console.log("🧾 Server Response:", data);
  
      if (response.status === 404) {
        alert("❌ API route not found: /api/v1/orders/create-order");
        return;
      }
  
      if (response.status === 400) {
        alert(`❌ Stock update failed: ${data.message}`);
        return;
      }
  
      if (data.success) {
        alert("✅ Invoice created & stock updated successfully!");
  
        // ✅ Temporarily hide Action buttons
        setIsGeneratingPDF(true);
  
        // Wait for UI update before generating PDF
        setTimeout(async () => {
          toPDF({ method: "open", page: { format: "A4" } });
  
          // ✅ Save invoice in DB
          await fetch(`${BASE_URL}/invoices`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customerName,
              customerAddress,
              customerGST,
              customerState,
              items: editableItems, // full invoice data
              totalAmount: totalAmount,
              withGST,
              gstRate,
              totalAmountWithGST: totalAmount + gstAmount,
            }),
          });
  
          // ✅ Reset form
          setIsGeneratingPDF(false);
          setEditableItems([
            { name: "", price: 0, quantity: 1, totalPrice: 0, _id: "" },
          ]);
          setCustomerName("");
          setCustomerAddress("");
          setCustomerGST("");
          setCustomerState("");
        }, 200); // enough time for DOM to re-render
      } else {
        alert("❌ Failed to create invoice. Try again.");
      }
    } catch (error) {
      console.error("🔥 Error:", error);
      alert("❌ Something went wrong while generating the invoice.");
    }
  };
  
  

  return (
    <div className="p-4">
      {/* CONTROLS */}
      <div className="print:hidden flex flex-wrap gap-4 mb-4">
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
            <option value="5">5%</option>
            <option value="9">9%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
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

      {/* INVOICE BODY */}
      <div
        ref={targetRef}
        className="p-6 border border-gray-300 print:bg-white"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <h2 className="text-sm font-bold text-center mb-6">TAX INVOICE</h2>

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <img src={logo} alt="Logo" className="h-24 w-24" />
          <div className="text-center w-full">
            <h1 className="text-2xl font-bold">DEV JYOTI TEXTILE</h1>
            <p>Shori Cloth Market, Rohtak - 124001</p>
            <p className="font-semibold text-red-600">
              GSTIN: 06BSSPJ8369N1ZN | M: 9812183950
            </p>
          </div>
          <QRCode value={window.location.href} size={100} />
        </div>

        {/* CUSTOMER INFO */}
        <div className="mt-6 text-sm border-b pb-2">
          <h3 className="font-semibold mb-1">Consignee (Ship To)</h3>
          <p>
            <strong>Name:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setCustomerName(e.target.innerText)}
            >
              {customerName}
            </span>
          </p>
          <p>
            <strong>Address:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setCustomerAddress(e.target.innerText)}
            >
              {customerAddress}
            </span>
          </p>
          <p>
            <strong>GSTIN:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setCustomerGST(e.target.innerText)}
            >
              {customerGST}
            </span>
          </p>
          <p>
            <strong>State:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setCustomerState(e.target.innerText)}
            >
              {customerState}
            </span>
          </p>
          <p>
            <strong>Date:</strong> {moment().format("DD MMM, YYYY")}
          </p>
        </div>

        {/* PRODUCT TABLE */}
        <table className="w-full border mt-4 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border py-1">Sr.</th>
              <th className="border py-1">Item</th>
              <th className="border py-1">Qty</th>
              <th className="border py-1">Price</th>
              <th className="border py-1">Amount</th>
              {!isGeneratingPDF && (
      <th className="border py-1 action-header">Action</th>
    )}
       </tr>
          </thead>
          <tbody>
            {editableItems.map((item, index) => (
              <tr key={index}>
                <td className="border text-center py-1">{index + 1}</td>
                <td className="border text-center py-1">
  {isGeneratingPDF ? (
    <div className="text-xs">{item.name}</div>
  ) : (
    <div className="relative">
      <input
        className="w-full text-xs px-2 py-1 border rounded-sm bg-white"
        value={item.name}
        onChange={(e) => handleProductNameChange(index, e.target.value)}
      />
      {/* Dropdown */}
      {productSuggestions.length > 0 && index === editableItems.length - 1 && (
        <ul className="absolute top-full left-0 mt-1 bg-white border w-full shadow z-50 max-h-40 overflow-y-auto text-left">
          {productSuggestions.map((prod, i) => (
            <li
              key={i}
              className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionSelect(index, prod)}
            >
              {prod.productName} - ₹{prod.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</td>





<td className="border text-center py-1">
  {isGeneratingPDF ? (
    <div className="text-xs">{item.quantity}</div>
  ) : (
    <input
      type="number"
      className="w-16 text-xs px-2 py-1 border rounded-sm"
      value={item.quantity}
      onChange={(e) =>
        handleValueChange(index, "quantity", Number(e.target.value))
      }
    />
  )}
</td>


<td className="border text-center py-1">
  {isGeneratingPDF ? (
    <div className="text-xs">₹{item.price}</div>
  ) : (
    <input
      type="number"
      className="w-20 text-xs px-2 py-1 border rounded-sm"
      value={item.price}
      onChange={(e) =>
        handleValueChange(index, "price", Number(e.target.value))
      }
    />
  )}
</td>


                <td className="border text-center py-1 font-semibold">
                  ₹{item.totalPrice.toFixed(2)}
                </td>
                {!isGeneratingPDF && (
      <td className="border text-center py-1 action-cell">
        <button onClick={() => deleteRow(index)} className="text-red-500 text-xs">❌</button>
      </td>
    )}





              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL SECTION */}
        <div className="mt-4 font-semibold text-sm w-full flex justify-end">
          <div className="text-right space-y-1">
            {withGST && (
              <>
                <p>Gross: ₹{finalPrice.toFixed(2)}</p>
                <p>
                  CGST @{gstRate / 2}%: ₹{(gstAmount / 2).toFixed(2)}
                </p>
                <p>
                  SGST @{gstRate / 2}%: ₹{(gstAmount / 2).toFixed(2)}
                </p>
              </>
            )}
            <p className="text-lg font-bold">
              Total: ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* IN WORDS - separate row below total */}
        <div className="mt-1 italic text-sm font-semibold text-left">
          In Words:{" "}
          <strong>{toWords(Math.round(totalAmount)).toUpperCase()} ONLY</strong>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-sm border-t pt-3">
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

        {/* Print Button */}
        <div className="mt-4 print:hidden">
          <button
            disabled={
              editableItems.length === 0 ||
              editableItems
                .filter((item) => item.name.trim() !== "") // ⚠️ Blank row ignore
                .some((item) => !item._id || item._id.trim() === "")
            }
            className="px-6 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
            onClick={generateInvoiceAndUpdateStock}
          >
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
