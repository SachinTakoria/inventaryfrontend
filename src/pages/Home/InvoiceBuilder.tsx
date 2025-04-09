import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { usePDF } from "react-to-pdf";
import moment from "moment";
import { toWords } from "number-to-words";

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

const InvoiceBuilder: React.FC = () => {
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
  const [orderData, setOrderData] = useState<{
    invoiceNumber?: string;
    createdAt?: string;
  } | null>(null);

  const user = useSelector((state: any) => state.user?.currentUser);

  // console.log("🧠 User from Redux:", user);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/products/products`);

        const result = await response.json();
        setAllProducts(result);
      } catch (error) {}
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
    document.activeElement instanceof HTMLElement &&
      document.activeElement.blur();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Please login again.");
      return;
    }

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
        productId: item._id,
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
          withGST, // ✅ Add this line
          gstRate, // ✅ And this
          totalAmount,
          oldPendingAdjusted,
          carryForward:
            totalAmount + previousPending - (amountPaid + oldPendingAdjusted),
          firm: "devjyoti",
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

        // Save invoice in DB and include invoiceNumber + createdAt
        const invoiceRes = await fetch(`${BASE_URL}/invoices`, {
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
            customerPhone,
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

        const invoiceData = await invoiceRes.json();

        if (data?.order && invoiceData?.invoice) {
          setOrderData({
            ...data.order,
            invoiceNumber: invoiceData.invoice.invoiceNumber,
            createdAt: invoiceData.invoice.createdAt,
          });


          await fetch(`${BASE_URL}/orders/update-invoice-number/${data.order._id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              invoiceNumber: invoiceData.invoice.invoiceNumber,
            }),
          });

        }

        setIsGeneratingPDF(true);
        // console.log("User from Redux:", user);

        if (!user || !user._id) {
          alert("❌ User not found. Please login again.");
          return;
        }

        setTimeout(async () => {
          toPDF({ method: "open", page: { format: "A4" } });

          // Reset form
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
        }, 500);
      } else {
        alert("❌ Failed to create invoice. Try again.");
      }
    } catch (error) {
      alert("❌ Something went wrong while generating the invoice.");
    }
  };

  return (
    <div className="p-4">
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
        className="p-6 border border-black print:bg-white"
        style={{
          backgroundColor: getBackgroundColor(),
          border: "2px solid black",
          padding: "20px",
        }}
      >
        <h1 className="text-xl font-bold text-center underline">
          {withGST ? "TAX INVOICE" : "INVOICE"}
        </h1>

        <div className="border border-black p-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="w-1/4 flex justify-start items-start">
              {withGST && orderData?.invoiceNumber && (
                <QRCode
                  value={`https://satyaka.in/invoice-view/${orderData.invoiceNumber}`}
                  size={80}
                  className="bg-white p-1"
                />
              )}
            </div>

            {/* Firm Info - Center */}
            <div className="w-2/4 text-center space-y-1">
              {withGST ? (
                <>
                  <h1 className="text-2xl font-bold tracking-wide">
                    DEV JYOTI TEXTILE
                  </h1>
                  <p className="text-sm">Shori Cloth Market, Rohtak - 124001</p>
                  <p className="text-sm">
                    <span className="font-semibold text-red-600">GSTIN:</span>{" "}
                    <span className="text-red-600">06BSSPJ8369N1ZN</span>{" "}
                    &nbsp;|&nbsp;
                    <span className="font-semibold text-red-600">M:</span>{" "}
                    <span className="text-red-600">9812183950</span>
                  </p>
                </>
              ) : (
                <h1 className="text-xl font-bold tracking-wide">
                  ESTIMATED BILL
                </h1>
              )}
            </div>

            {/* Invoice Info - Right */}
            <div className="w-1/4 text-xs text-right  p-2">
              <p>
                <strong>Invoice No:</strong> {orderData?.invoiceNumber || "--"}
              </p>
              <p>
                <strong>Dated:</strong>{" "}
                {moment(orderData?.createdAt).format("DD MMM, YYYY")}
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <h3 className="font-bold mb-2 text-base">Consignee (Ship To)</h3>
            <table className="table-auto w-full text-sm border border-gray-400">
              <thead>
                <tr>
                  <th className="border px-2 py-1 font-semibold">Name</th>
                  <th className="border px-2 py-1 font-semibold">Address</th>
                  <th className="border px-2 py-1 font-semibold">GSTIN</th>
                  <th className="border px-2 py-1 font-semibold">State</th>
                  <th className="border px-2 py-1 font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setCustomerName(e.target.innerText)}
                      className="outline-none border-none focus:outline-none w-full inline-block"
                    >
                      {customerName}
                    </span>
                  </td>
                  <td className="border px-2 py-1">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setCustomerAddress(e.target.innerText)}
                      className="outline-none border-none focus:outline-none w-full inline-block"
                    >
                      {customerAddress}
                    </span>
                  </td>
                  <td className="border px-2 py-1">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setCustomerGST(e.target.innerText)}
                      className="outline-none border-none focus:outline-none w-full inline-block"
                    >
                      {customerGST}
                    </span>
                  </td>
                  <td className="border px-2 py-1">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setCustomerState(e.target.innerText)}
                      className="outline-none border-none focus:outline-none w-full inline-block"
                    >
                      {customerState}
                    </span>
                  </td>
                  <td className="border px-2 py-1 flex items-center gap-2">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setCustomerPhone(e.currentTarget.innerText)
                      }
                      className="outline-none border-none focus:outline-none w-full inline-block"
                    >
                      {customerPhone}
                    </span>
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
                            setPreviousPending(0);
                          }
                        }}
                        className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 print:hidden"
                      >
                        🔍
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
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
            <div className="border border-black p-2 w-full md:w-[350px] text-xs">
              <div className="grid grid-cols-2 gap-[2px]">
                {withGST && (
                  <>
                    <div className="border border-gray-400 px-2 py-1">
                      Gross
                    </div>
                    <div className="border border-gray-400 px-2 py-1 text-right">
                      ₹{finalPrice.toFixed(2)}
                    </div>

                    <div className="border border-gray-400 px-2 py-1">
                      CGST @{gstRate / 2}%
                    </div>
                    <div className="border border-gray-400 px-2 py-1 text-right">
                      ₹{(gstAmount / 2).toFixed(2)}
                    </div>

                    <div className="border border-gray-400 px-2 py-1">
                      SGST @{gstRate / 2}%
                    </div>
                    <div className="border border-gray-400 px-2 py-1 text-right">
                      ₹{(gstAmount / 2).toFixed(2)}
                    </div>
                  </>
                )}
                <div className="border border-gray-400 px-2 py-1 font-bold">
                  Total
                </div>
                <div className="border border-gray-400 px-2 py-1 text-right font-bold">
                  ₹{totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* IN WORDS - separate row below total */}
          <div className="mt-2 border border-black p-2 italic text-sm font-semibold">
            In Words:{" "}
            <strong>
              {toWords(Math.round(totalAmount)).toUpperCase()} ONLY
            </strong>
          </div>

          {/* PAYMENT / DUES SECTION - Now in boxed layout */}
          <div className="mt-4 font-semibold text-sm w-full">
            <div className="border border-black p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Details */}
              <div className="text-sm">
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

              {/* Dues Section */}
              <div className="text-xs">
                <div className="grid grid-cols-2 gap-[2px]">
                  <div className="border border-gray-400 px-2 py-1">
                    Previous Pending
                  </div>
                  <div className="border border-gray-400 px-2 py-1 text-right">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setPreviousPending(Number(e.currentTarget.innerText))
                      }
                      className="outline-none focus:outline-none w-full inline-block print:border-none"
                    >
                      {previousPending}
                    </span>
                  </div>

                  <div className="border border-gray-400 px-2 py-1">
                    Adjust from Previous Pending
                  </div>
                  <div className="border border-gray-400 px-2 py-1 text-right">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setOldPendingAdjusted(Number(e.currentTarget.innerText))
                      }
                      className="outline-none focus:outline-none w-full inline-block print:border-none"
                    >
                      {oldPendingAdjusted}
                    </span>
                  </div>

                  <div className="border border-gray-400 px-2 py-1">
                    Amount Paid (₹)
                  </div>
                  <div className="border border-gray-400 px-2 py-1 text-right">
                    <span
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        setAmountPaid(Number(e.currentTarget.innerText))
                      }
                      className="outline-none focus:outline-none w-full inline-block print:border-none"
                    >
                      {amountPaid}
                    </span>
                  </div>

                  <div className="border border-gray-400 px-2 py-1 font-semibold text-red-600">
                    Carry Forward
                  </div>
                  <div className="border border-gray-400 px-2 py-1 text-right font-semibold text-red-600">
                    ₹
                    {(
                      totalAmount +
                      previousPending -
                      (amountPaid + oldPendingAdjusted)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TERMS & CONDITIONS + SIGNATURE */}
          <div className="mt-4 border border-black p-4 text-sm">
            <div className="flex justify-between">
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
            <p className="text-center mt-4 italic text-gray-600">
              This is a Computer Generated Invoice. Signature Not Required.
            </p>
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
    </div>
  );
};

export default InvoiceBuilder;
