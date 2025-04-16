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
    const [discountPercent, setDiscountPercent] = useState(0);
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

  const [consignees, setConsignees] = useState<any[]>([]);
  const [selectedConsignee, setSelectedConsignee] = useState<any>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newConsignee, setNewConsignee] = useState({
    name: "",
    address: "",
    gstin: "",
    pan: "",
    state: "",
  });

  const user = useSelector((state: any) => state.user?.currentUser);

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

  useEffect(() => {
    const fetchConsignees = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/consignees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConsignees(data.consignees || []);
    };
    fetchConsignees();
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
  const discountAmount = (finalPrice * discountPercent) / 100;

  const priceAfterDiscount = finalPrice - discountAmount;
  const gstAmount = withGST ? (priceAfterDiscount * gstRate) / 100 : 0;
  const totalAmount = priceAfterDiscount + gstAmount;

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
          discountPercent,
          discountAmount,
          items: itemsToSave,
          amountPaid,
          withGST, // ✅ Add this line
          gstRate, // ✅ And this
          totalAmount,
          consignee: selectedConsignee,
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
            firm: "devjyoti",
            items: editableItems.map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
              hsn: item.hsn,
            })),
            totalAmount: totalAmount,
            withGST,
            consignee: selectedConsignee,
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

          await fetch(
            `${BASE_URL}/orders/update-invoice-number/${data.order._id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                invoiceNumber: invoiceData.invoice.invoiceNumber,
              }),
            }
          );
        }

        setIsGeneratingPDF(true);

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
        }, 1000);
      } else {
        alert("❌ Failed to create invoice. Try again.");
      }
    } catch (error) {
      alert("❌ Something went wrong while generating the invoice.");
    }
  };

  const handleDeleteConsignee = async (id: string) => {
    const token = localStorage.getItem("token");
    const confirm = window.confirm("Are you sure you want to delete?");
    if (!confirm) return;

    const res = await fetch(`${BASE_URL}/consignees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.success) {
      setConsignees((prev) => prev.filter((c) => c._id !== id));
      setSelectedConsignee(null);
      alert("✅ Consignee deleted");
    } else {
      alert("❌ Failed to delete");
    }
  };

  const handleSaveConsignee = async () => {
    const token = localStorage.getItem("token");
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${BASE_URL}/consignees/${editingId}`
      : `${BASE_URL}/consignees`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newConsignee),
    });

    const data = await res.json();
    if (data.success) {
      alert(`✅ Consignee ${editingId ? "updated" : "added"} successfully`);
      if (!editingId) {
        setConsignees((prev) => [...prev, data.consignee]);
      } else {
        setConsignees((prev) =>
          prev.map((c) => (c._id === editingId ? data.consignee : c))
        );
      }
      setNewConsignee({ name: "", address: "", gstin: "", pan: "", state: "" });
      setAddingNew(false);
      setEditingId(null);
    } else {
      alert("❌ Failed to save consignee");
    }
  };

  return (
    <div className="p-4">
      <div>
        {/* CONTROLS */}
        <div className="print:hidden flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withGST}
              onChange={(e) => setWithGST(e.target.checked)}
            />
            With GST
          </label>
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
          <h2 className="text-md font-bold text-center mb-6 border-b border-black pb-2">
            {withGST ? "TAX INVOICE" : "INVOICE"}
          </h2>

          {/* ESTIMATED BILL - shown only if withGST is false */}
          {!withGST && (
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-1">ESTIMATED BILL</h1>
              <p className="text-sm">
                <strong>Invoice No:</strong> {orderData?.invoiceNumber || "N/A"}
              </p>
              <p className="text-sm">
                <strong>Dated:</strong>{" "}
                {moment(orderData?.createdAt).format("DD MMM, YYYY")}
              </p>
            </div>
          )}

          {
            !withGST && (

              <div className="mt-4 border-t pt-2">
      <h3 className="font-bold pb-1 mb-2">Buyer (Bill To)</h3>
      <div className="grid grid-cols-1 gap-2">
        <p>
          <strong>Name:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerName || "N/A"}</span>
          ) : (
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
        <p className="flex items-center gap-2">
          <strong>Phone:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerPhone || "N/A"}</span>
          ) : (
            <>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
              />
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
            </>
          )}
        </p>
        <p>
          <strong>Address:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerAddress || "N/A"}</span>
          ) : (
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
        <p>
          <strong>GSTIN:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerGST || "N/A"}</span>
          ) : (
            <input
              value={customerGST}
              onChange={(e) => setCustomerGST(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
        <p>
          <strong>State:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerState || "N/A"}</span>
          ) : (
            <input
              value={customerState}
              onChange={(e) => setCustomerState(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
      </div>
    </div>
            )
          }


          

{
  withGST && (
<>
<div className="flex justify-between items-start gap-4 pb-4">
  {/* ✅ LEFT SIDE: Firm Info + Consignee + Buyer */}
  <div className="w-[60%] border border-black p-4 text-sm rounded-md min-h-[340px] flex flex-col justify-between">
    {/* Firm Details */}
    <div>
      <h1 className="text-2xl font-bold">DEV JYOTI TEXTILES</h1>
      <p className="mt-1">Shori Cloth Market, Rohtak - 124001</p>
      <p className="text-red-600 font-semibold mt-1">
        GSTIN/UIN: 06BSSPJ8369N1ZN | Mobile: 9812183950
      </p>
      <p className="font-semibold mt-1">State Name: HARYANA 124001</p>
    </div>

    {/* Consignee */}
    <div className="mt-4 border-t pt-2">
      <div className="flex justify-between items-center print:hidden">
        <h3 className="font-semibold">CONSIGNEE (SHIP TO)</h3>
        {!isGeneratingPDF && (
          <div className="flex items-center gap-2">
            <select
              className="border px-2 py-1 text-sm"
              onChange={(e) => {
                const selected = consignees.find(
                  (c) => c._id === e.target.value
                );
                setSelectedConsignee(selected);
              }}
            >
              <option value="">Select Consignee</option>
              {consignees.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="bg-green-500 text-white px-2 py-1 text-sm rounded hover:bg-green-600"
              onClick={() => {
                setAddingNew(true);
                setEditingId(null);
                setNewConsignee({
                  name: "",
                  address: "",
                  gstin: "",
                  pan: "",
                  state: "",
                });
              }}
            >
              ➕
            </button>
          </div>
        )}
      </div>

      {selectedConsignee && !addingNew && (
        <div className="text-sm mt-2 space-y-[2px]">
          <p>
            <strong>{selectedConsignee.name}</strong>
          </p>
          <p>{selectedConsignee.address}</p>
          <p>GSTIN/UIN: {selectedConsignee.gstin}</p>
          <p>PAN/IT No: {selectedConsignee.pan}</p>
          <p>State Name: {selectedConsignee.state}</p>
          {!isGeneratingPDF && (
            <div className="flex gap-2 mt-1 print:hidden">
              <button
                className="text-blue-600 text-sm"
                onClick={() => {
                  setEditingId(selectedConsignee._id);
                  setNewConsignee({ ...selectedConsignee });
                  setAddingNew(true);
                }}
              >
                ✏️
              </button>
              <button
                className="text-red-600 text-sm"
                onClick={() =>
                  handleDeleteConsignee(selectedConsignee._id)
                }
              >
                ❌
              </button>
            </div>
          )}
        </div>
      )}

      {addingNew && (
        <div className="mt-3 space-y-2 print:hidden">
          {["name", "address", "gstin", "pan", "state"].map((field) => (
            <input
              key={field}
              className="w-full border px-3 py-1 text-sm rounded"
              placeholder={`Enter ${field}`}
              value={newConsignee[field]}
              onChange={(e) =>
                setNewConsignee({
                  ...newConsignee,
                  [field]: e.target.value,
                })
              }
            />
          ))}
          <div className="flex gap-2">
            <button
              className="bg-blue-500 text-white px-4 py-1 rounded"
              onClick={handleSaveConsignee}
            >
              ✅ Save
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-1 rounded"
              onClick={() => {
                setAddingNew(false);
                setEditingId(null);
                setNewConsignee({
                  name: "",
                  address: "",
                  gstin: "",
                  pan: "",
                  state: "",
                });
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Buyer Info */}
    <div className="mt-4 border-t pt-2">
      <h3 className="font-bold pb-1 mb-2">Buyer (Bill To)</h3>
      <div className="grid grid-cols-1 gap-2">
        <p>
          <strong>Name:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerName || "N/A"}</span>
          ) : (
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
        <p className="flex items-center gap-2">
          <strong>Phone:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerPhone || "N/A"}</span>
          ) : (
            <>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
              />
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
            </>
          )}
        </p>
        <p>
          <strong>Address:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerAddress || "N/A"}</span>
          ) : (
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
        <p>
          <strong>GSTIN:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerGST || "N/A"}</span>
          ) : (
            <input
              value={customerGST}
              onChange={(e) => setCustomerGST(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
        <p>
          <strong>State:</strong>{" "}
          {isGeneratingPDF ? (
            <span>{customerState || "N/A"}</span>
          ) : (
            <input
              value={customerState}
              onChange={(e) => setCustomerState(e.target.value)}
              className="border-b border-dashed px-2 text-sm w-[200px] outline-none"
            />
          )}
        </p>
      </div>
    </div>
  </div>

  {/* ✅ RIGHT SIDE: QR + Invoice Table */}
  <div className="w-[40%] border border-black p-4 rounded-md text-xs font-medium min-h-[480px] flex flex-col items-end text-right">
    <div className="w-full flex justify-end">
      <QRCode value={window.location.href} size={140} />
    </div>
    <table className="w-full mt-1 border border-black text-[11px]">
      <tbody>
        <tr>
          <td className="border px-2 py-3 font-semibold w-[40%]">Invoice No</td>
          <td className="border px-2 py-1 text-right">
            {orderData?.invoiceNumber || "N/A"}
          </td>
        </tr>
        <tr>
          <td className="border px-2 py-3 font-semibold">Dated</td>
          <td className="border px-2 py-1 text-right">
            {moment(orderData?.createdAt).format("DD MMM, YYYY")}
          </td>
        </tr>
        <tr>
          <td className="border px-2 py-3 font-semibold">Delivery Note</td>
          <td className="border px-2 py-1 text-right">_</td>
        </tr>
        <tr>
          <td className="border px-2 py-3 font-semibold">
            Reference No. & Date
          </td>
          <td className="border px-2 py-1 text-right">Other References</td>
        </tr>
        <tr>
          <td className="border px-2 py-3 font-semibold">Dispatch Doc No.</td>
          <td className="border px-2 py-1 text-right">Delivery Note Date</td>
        </tr>
        <tr>
          <td className="border px-2 py-3 font-semibold">
            Dispatched through
          </td>
          <td className="border px-2 py-1 text-right">Destination</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

</>

  )
}


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
          {!isGeneratingPDF && (
            <div className="flex justify-end mt-4">
              <div className="text-sm flex items-center gap-2">
                <label htmlFor="discount" className="font-medium">
                  Apply Discount (%):
                </label>
                <select
                  id="discount"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="border px-2 py-1 rounded"
                >
                  <option value={0}>None</option>
                  <option value={1}>1%</option>
                  <option value={2}>2%</option>
                  <option value={3}>3%</option>
                  <option value={4}>4%</option>
                  <option value={5}>5%</option>
                </select>
              </div>
            </div>
          )}

          {/* ✅ GST + Discount + Final Total */}
          <div className="mt-2 font-semibold text-sm w-full flex justify-end">
            <div className="border border-black p-2 w-full md:w-[350px] text-xs">
              <div className="grid grid-cols-2 gap-[2px]">
                {/* Gross */}
                <div className="border border-gray-400 px-2 py-1">Gross</div>
                <div className="border border-gray-400 px-2 py-1 text-right">
                  ₹{finalPrice.toFixed(2)}
                </div>

                {/* Discount (only if applied) */}
                {discountPercent > 0 && (
                  <>
                    <div className="border border-gray-400 px-2 py-1">
                      Discount @{discountPercent}%
                    </div>
                    <div className="border border-gray-400 px-2 py-1 text-right">
                      – ₹{discountAmount.toFixed(2)}
                    </div>
                  </>
                )}

                {/* GST (if applicable) */}
                {withGST && (
                  <>
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

                {/* Final Total */}
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

          {/* PAYMENT / DUES SECTION - Clean & Professional */}
          <div className="mt-4 font-semibold text-sm w-full">
            <div className="border border-black p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Details */}
              <div className="text-sm">
                <p>
                  <strong>Bank Name:</strong> BANDHAN BANK
                </p>
                <p>
                  <strong>Account No:</strong> 10190007096780
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
