import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { usePDF } from "react-to-pdf";
import moment from "moment";
import { toWords } from "number-to-words";
import logo from "../../assets/djLogo2.png";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;
import { useSelector } from "react-redux";

type EditableItem = {
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  hsn: string;
  _id: string;
};

const InvoiceBuilder2: React.FC = () => {
  const { toPDF, targetRef } = usePDF();
  const [withGST, setWithGST] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [bgColor, setBgColor] = useState("pink");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGST, setCustomerGST] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [editableItems, setEditableItems] = useState<EditableItem[]>([
    { name: "", price: 0, quantity: 1, totalPrice: 0, hsn: "", _id: "" },
  ]);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [previousPending, setPreviousPending] = useState(0);
  const [oldPendingAdjusted, setOldPendingAdjusted] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  // const [carryForward, setCarryForward] = useState(0);

  const user = useSelector((state: any) => state?.auth?.user);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/products/products`);

        const result = await response.json();
        setAllProducts(result);
      } catch (error) {
        
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchPreviousPending = async () => {
      if (!customerPhone) return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${BASE_URL}/orders/pending?phone=${customerPhone}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setPreviousPending(data?.pendingAmount || 0);
      } catch (error) {
        
        setPreviousPending(0); // fallback
      }
    };

    fetchPreviousPending();
  }, [customerPhone]);

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
    updatedItems[index].hsn = product.hsn || ""; // ✅ ADD THIS LINE
    updatedItems[index]._id = product._id;

    setEditableItems(updatedItems);
    setProductSuggestions([]);

    if (index === editableItems.length - 1 && updatedItems[index]._id) {
      setEditableItems([
        ...updatedItems,
        { name: "", price: 0, quantity: 1, totalPrice: 0, hsn: "", _id: "" },
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
    if (bgColor === "white") return "#ffc0cb";
    if (bgColor === "yellow") return "#fff9c4";
    return "#ffffff";
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
        name: item.name,
        price: item.price,
        totalPrice: item.totalPrice,
        hsn: item.hsn || "",
      }));

    try {
      const response = await fetch(`${BASE_URL}/orders/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerGST,
          customerState,
          items: itemsToSave,
          amountPaid,
          oldPendingAdjusted,
          carryForward:
            totalAmount + previousPending - (amountPaid + oldPendingAdjusted),
          firm: "shreesai",
        }),
      });

      const data = await response.json();

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

        if (!user || !user._id) {
          alert("❌ User not found. Please login again.");
          return;
        }

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
              user: user?._id,
              customerName,
              customerAddress,
              customerGST,
              customerState,
              items: editableItems.map((item) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                hsn: item.hsn,
              })),
              totalAmount: totalAmount,
              withGST,
              gstRate,
              totalAmountWithGST: totalAmount + gstAmount,
            }),
          });

          // ✅ Reset form
          setIsGeneratingPDF(false);
          setEditableItems([
            {
              name: "",
              price: 0,
              quantity: 1,
              totalPrice: 0,
              hsn: "",
              _id: "",
            },
          ]);

          setCustomerName("");
          setCustomerAddress("");
          setCustomerGST("");
          setCustomerState("");
        }, 500); // enough time for DOM to re-render
      } else {
        alert("❌ Failed to create invoice. Try again.");
      }
    } catch (error) {
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
            <h1 className="text-2xl font-bold">SHREE SAI SUIT</h1>
            <p>
              568,Ground Floor Gali Ghanteshwar Katra Neel, Chandni Chowk, Delhi
              - 110006
            </p>
            <p className="font-semibold text-red-600">
              GSTIN: 07AIPHM0425C1ZS | M: 9971745882
            </p>
            <p>
              <strong>E-Mail:</strong>rajivmittal87@gmail.com
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
              className="outline-none focus:outline-none border-none focus:border-none"
            >
              {customerName}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <strong>Phone:</strong>
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setCustomerPhone(e.currentTarget.innerText)}
              className={`outline-none border-none focus:outline-none ${
                isGeneratingPDF
                  ? ""
                  : "border-b border-dashed border-gray-400 px-2"
              }`}
            >
              {customerPhone}
            </span>

            {/* Only show search button in screen mode (not in PDF) */}
            {!isGeneratingPDF && (
              <button
                onClick={async () => {
                  if (!customerPhone || customerPhone.length < 4) {
                    alert("Please enter valid phone number.");
                    return;
                  }

                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(
                      `${BASE_URL}/orders/pending?phone=${customerPhone}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                    const data = await res.json();
                    setPreviousPending(data?.pendingAmount || 0);
                  } catch (err) {
                    console.error("Error fetching pending:", err);
                    setPreviousPending(0);
                  }
                }}
                className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 print:hidden"
              >
                🔍
              </button>
            )}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setCustomerAddress(e.target.innerText)}
              className="outline-none focus:outline-none border-none focus:border-none"
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
              className="outline-none focus:outline-none border-none focus:border-none"
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
              className="outline-none focus:outline-none border-none focus:border-none"
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
              <th className="border py-1">HSN</th>
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
                        onChange={(e) =>
                          handleProductNameChange(index, e.target.value)
                        }
                      />
                      {/* Dropdown */}
                      {productSuggestions.length > 0 &&
                        index === editableItems.length - 1 && (
                          <ul className="absolute top-full left-0 mt-1 bg-white border w-full shadow z-50 max-h-40 overflow-y-auto text-left">
                            {productSuggestions.map((prod, i) => (
                              <li
                                key={i}
                                className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer"
                                onClick={() =>
                                  handleSuggestionSelect(index, prod)
                                }
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
                    <div className="text-xs">{item.hsn}</div>
                  ) : (
                    <input
                      type="text"
                      className="w-20 text-xs px-2 py-1 border rounded-sm"
                      value={item.hsn}
                      onChange={(e) => {
                        const updatedItems = [...editableItems];
                        updatedItems[index].hsn = e.target.value;
                        setEditableItems(updatedItems);
                      }}
                    />
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
                        handleValueChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
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
                        handleValueChange(
                          index,
                          "price",
                          Number(e.target.value)
                        )
                      }
                    />
                  )}
                </td>

                <td className="border text-center py-1 font-semibold">
                  ₹{item.totalPrice.toFixed(2)}
                </td>
                {!isGeneratingPDF && (
                  <td className="border text-center py-1 action-cell">
                    <button
                      onClick={() => deleteRow(index)}
                      className="text-red-500 text-xs"
                    >
                      ❌
                    </button>
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

        {/* PAYMENT / DUES SECTION - Clean & Professional */}
        <div className="mt-4 font-semibold text-sm w-full flex flex-col items-end space-y-1">
          {/* Previous Pending - auto fetched */}
          <p className="text-right">
            <strong>Previous Pending:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setPreviousPending(Number(e.currentTarget.innerText))
              }
              className="outline-none focus:outline-none border-b border-dashed border-gray-400 min-w-[60px] inline-block print:border-none"
            >
              {previousPending}
            </span>
          </p>

          {/* Adjust from Previous Pending */}
          <p className="text-right">
            <strong>Adjust from Previous Pending:</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setOldPendingAdjusted(Number(e.currentTarget.innerText))
              }
              className="outline-none focus:outline-none border-b border-dashed border-gray-400 min-w-[60px] inline-block print:border-none"
            >
              {oldPendingAdjusted}
            </span>
          </p>

          {/* Amount Paid */}
          <p className="text-right">
            <strong>Amount Paid (₹):</strong>{" "}
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onBlur={(e) => setAmountPaid(Number(e.currentTarget.innerText))}
              className="outline-none focus:outline-none border-b border-dashed border-gray-400 min-w-[60px] inline-block print:border-none"
            >
              {amountPaid}
            </span>
          </p>

          {/* Carry Forward (auto-calculated) */}
          <p className="text-right text-red-600 text-base mt-1">
            <strong>Carry Forward:</strong> ₹
            {(
              totalAmount +
              previousPending -
              (amountPaid + oldPendingAdjusted)
            ).toFixed(2)}
          </p>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-sm border-t pt-3">
          <p>
            <strong>A/c Holder Name:</strong>Shree Sai Suit
          </p>
          <p>
            <strong>Bank Name:</strong> IDBI OD A/C
          </p>
          <p>
            <strong>Account No:</strong> 0095651100000505
          </p>
          <p>
            <strong> Branch & IFSC:</strong> Chandni Chowk & IBKL0000095
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
            <p>for: SHREE SAI SUIT</p>
            <p className="mt-6">Auth. Signatory</p>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-4 print:hidden">
          {!isGeneratingPDF && (
            <button
              onClick={generateInvoiceAndUpdateStock}
              className="px-6 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
              disabled={
                editableItems.length === 0 ||
                editableItems
                  .filter((item) => item.name.trim() !== "")
                  .some((item) => !item._id || item._id.trim() === "")
              }
            >
              Generate Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder2;
